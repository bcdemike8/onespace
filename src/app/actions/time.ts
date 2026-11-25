"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdmin, requireUser } from "@/lib/auth";
import { resolveRates } from "@/lib/rates";
import { assertUnlocked, setReopenedFrom } from "@/lib/lock";
import { dayStart } from "@/lib/dates";
import { parseDuration } from "@/lib/format";
import {
  UNPLANNED_SECTION,
  cleanTaskName,
  matchExisting,
} from "@/lib/timesheet-task";

export type ActionState = { error?: string; ok?: boolean };

const REVALIDATE = ["/", "/timesheet", "/reports", "/projects"];
const refresh = () => REVALIDATE.forEach((p) => revalidatePath(p, "layout"));

/** A member may only touch their own time; an admin may touch anyone's. */
async function assertCanEditEntry(entryId: string) {
  const user = await requireUser();
  const entry = await db.timeEntry.findUnique({
    where: { id: entryId },
    select: { userId: true, date: true },
  });
  if (!entry) throw new Error("That time entry no longer exists.");
  if (entry.userId !== user.id && !isAdmin(user)) {
    throw new Error("You can only edit your own time.");
  }
  // The day the entry currently sits on has to be open, or nobody could have
  // invoiced it safely.
  await assertUnlocked(entry.date);
  return { user, entry };
}

// ------------------------------------------------------------- manual entry

const logSchema = z.object({
  taskId: z.string().trim().min(1).optional().nullable(),
  projectId: z.string().trim().min(1, "Pick a project."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
  duration: z.string().trim().min(1, "Enter a duration, e.g. 1.5 or 1:30."),
  notes: z.string().trim().max(1000).optional().nullable(),
  billable: z.string().optional().nullable(),
});

export async function logTimeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = logSchema.safeParse({
    taskId: formData.get("taskId") || null,
    projectId: formData.get("projectId"),
    date: formData.get("date"),
    duration: formData.get("duration"),
    notes: formData.get("notes"),
    billable: formData.get("billable"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const minutes = parseDuration(parsed.data.duration);
  if (minutes === null || minutes <= 0) {
    return { error: "That duration didn't make sense. Try 1.5, 1:30 or 90m." };
  }
  if (minutes > 24 * 60) {
    return { error: "That's more than 24 hours in a single day." };
  }

  const entryDate = dayStart(parsed.data.date);
  try {
    await assertUnlocked(entryDate);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "That period is closed." };
  }

  const billableOverride =
    formData.get("billable") === null ? undefined : parsed.data.billable === "on";

  const rates = await resolveRates(user.id, parsed.data.projectId, billableOverride);

  await db.timeEntry.create({
    data: {
      userId: user.id,
      taskId: parsed.data.taskId || null,
      projectId: parsed.data.projectId,
      date: entryDate,
      minutes,
      notes: parsed.data.notes || null,
      source: "MANUAL",
      ...rates,
    },
  });

  refresh();
  return { ok: true };
}

export async function updateTimeEntryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  try {
    await assertCanEditEntry(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "You can't edit that." };
  }

  const minutes = parseDuration(String(formData.get("duration") ?? ""));
  if (minutes === null || minutes <= 0) {
    return { error: "That duration didn't make sense. Try 1.5, 1:30 or 90m." };
  }

  const dateRaw = String(formData.get("date") ?? "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    try {
      await assertUnlocked(dayStart(dateRaw));
    } catch (e) {
      return { error: e instanceof Error ? e.message : "That period is closed." };
    }
  }

  await db.timeEntry.update({
    where: { id },
    data: {
      minutes,
      notes: (formData.get("notes") as string) || null,
      billable: formData.get("billable") === "on",
      ...(/^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? { date: dayStart(dateRaw) } : {}),
    },
  });

  refresh();
  return { ok: true };
}

export async function deleteTimeEntryAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await assertCanEditEntry(id);
  await db.timeEntry.delete({ where: { id } });
  refresh();
}

/**
 * Delete one entry and say how it went, for callers that aren't a plain form
 * (the "logged" list in a timesheet cell). Same rules as above: your own
 * time, or anyone's if you're an admin, and only in an open month.
 */
export async function removeTimeEntryAction(
  id: string,
): Promise<{ ok?: boolean; error?: string }> {
  try {
    await assertCanEditEntry(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "You can't delete that." };
  }
  await db.timeEntry.delete({ where: { id } });
  refresh();
  return { ok: true };
}

// ------------------------------------------------------------ weekly grid

/**
 * Set the hours the *timesheet* holds against one task on one day.
 *
 * Time booked from a project page, a stopwatch or an import is left strictly
 * alone: the grid shows it read-only and this only ever creates, updates or
 * removes the entry the grid itself owns. So a cell can add to what's already
 * recorded, and can never silently erase it.
 */
export async function setTimesheetCellAction(formData: FormData) {
  const user = await requireUser();

  const taskId = String(formData.get("taskId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const dateRaw = String(formData.get("date") ?? "");
  const raw = String(formData.get("duration") ?? "").trim();

  if (!projectId || !/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) return;

  const target = raw === "" ? 0 : parseDuration(raw);
  if (target === null || target < 0 || target > 24 * 60) return;

  const date = dayStart(dateRaw);
  await assertUnlocked(date);

  const where = {
    userId: user.id,
    taskId: taskId || null,
    projectId,
    date,
    source: "TIMESHEET" as const,
  };

  const existing = await db.timeEntry.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  if (target === 0) {
    if (existing.length) {
      await db.timeEntry.deleteMany({
        where: { id: { in: existing.map((e) => e.id) } },
      });
    }
  } else if (existing.length === 0) {
    const rates = await resolveRates(user.id, projectId);
    await db.timeEntry.create({ data: { ...where, minutes: target, ...rates } });
  } else {
    // Collapse to a single entry holding the cell's value; the grid is the
    // authority for its own share of the day.
    const [keep, ...rest] = existing;
    await db.timeEntry.update({ where: { id: keep.id }, data: { minutes: target } });
    if (rest.length) {
      await db.timeEntry.deleteMany({ where: { id: { in: rest.map((e) => e.id) } } });
    }
  }

  refresh();
}

/**
 * The note on a timesheet cell.
 *
 * Separate from the hours rather than part of the same form. The cell is a
 * single input somebody tabs through at speed, and the grid's whole value is
 * that filling a week takes seconds; a textarea in that path would slow down
 * the common case to serve the rarer one.
 *
 * A note needs an entry to live on. "1.5" with no explanation is a normal
 * timesheet line; an explanation attached to no hours is not something a
 * timesheet can hold, so this writes nothing rather than inventing a
 * zero-minute entry for it to sit on.
 */
export async function setTimesheetNoteAction(input: {
  projectId: string;
  taskId: string;
  date: string;
  notes: string;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();

  const { projectId, taskId, date: dateRaw } = input;
  if (!projectId || !/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
    return { ok: false, error: "That isn't a day on this sheet." };
  }

  const date = dayStart(dateRaw);
  await assertUnlocked(date);

  const notes = input.notes.trim().slice(0, 2000) || null;

  const existing = await db.timeEntry.findMany({
    where: {
      userId: user.id,
      taskId: taskId || null,
      projectId,
      date,
      source: "TIMESHEET",
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (existing.length === 0) {
    return { ok: false, error: "Log some time on this day first." };
  }

  // The cell collapses to one entry when hours are saved, so in practice
  // this is one row; updating all of them keeps the note true of the cell
  // either way.
  await db.timeEntry.updateMany({
    where: { id: { in: existing.map((e) => e.id) } },
    data: { notes },
  });

  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------- stopwatch

/**
 * "Other" on the timesheet's task picker: log against work the plan never
 * named.
 *
 * It makes a real task rather than a free-text label on the entry, so the
 * hours behave like every other hour in OneSpace — they roll into the
 * project, they show on the printed timesheet with a name beside them, and
 * next week the same task is already in the picker instead of being retyped
 * slightly differently. It lands in a section of its own so a project owner
 * reading the plan can tell sold work from unplanned work at a glance.
 */
export async function addTimesheetTaskAction(input: {
  projectId: string;
  name: string;
}): Promise<{ ok: boolean; task?: { id: string; name: string }; error?: string }> {
  const user = await requireUser();

  const cleaned = cleanTaskName(input.name ?? "");
  if ("error" in cleaned) return { ok: false, error: cleaned.error };
  const name = cleaned.name;

  const project = await db.project.findUnique({
    where: { id: input.projectId ?? "" },
    select: { id: true },
  });
  if (!project) return { ok: false, error: "That project no longer exists." };

  // Typing the name of something already on the project lands on it rather
  // than standing a near-identical task beside it.
  const open = await db.task.findMany({
    where: { projectId: project.id, status: { not: "DONE" } },
    select: { id: true, name: true },
  });
  const existing = matchExisting(name, open);
  if (existing) {
    // Nothing changed, so nothing to revalidate.
    return { ok: true, task: { id: existing.id, name: existing.name } };
  }

  let section = await db.section.findFirst({
    where: { projectId: project.id, name: UNPLANNED_SECTION },
    select: { id: true },
  });
  if (!section) {
    const lastSection = await db.section.findFirst({
      where: { projectId: project.id },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });
    section = await db.section.create({
      data: {
        projectId: project.id,
        name: UNPLANNED_SECTION,
        orderIndex: (lastSection?.orderIndex ?? -1) + 1,
      },
      select: { id: true },
    });
  }

  const last = await db.task.findFirst({
    where: { projectId: project.id, sectionId: section.id, parentId: null },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });

  // Assigned to whoever is logging it: they did the work, and it keeps the
  // project on their sheet next week without them going looking for it.
  const task = await db.task.create({
    data: {
      projectId: project.id,
      sectionId: section.id,
      name,
      assigneeId: user.id,
      orderIndex: (last?.orderIndex ?? -1) + 1,
    },
    select: { id: true, name: true },
  });

  refresh();
  revalidatePath(`/projects/${project.id}`, "layout");
  return { ok: true, task };
}

export async function startTimerAction(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return;

  // Starting a new timer banks whatever is already running, the way a
  // stopwatch tool should — never silently discard someone's work.
  await stopRunningTimer(user.id);

  await db.runningTimer.create({
    data: { userId: user.id, taskId, notes: (formData.get("notes") as string) || null },
  });

  refresh();
}

async function stopRunningTimer(userId: string): Promise<number> {
  const timer = await db.runningTimer.findUnique({
    where: { userId },
    include: { task: { select: { projectId: true } } },
  });
  if (!timer) return 0;

  const minutes = Math.max(
    1,
    Math.round((Date.now() - timer.startedAt.getTime()) / 60_000),
  );

  const rates = await resolveRates(userId, timer.task.projectId);

  await db.$transaction([
    db.timeEntry.create({
      data: {
        userId,
        taskId: timer.taskId,
        projectId: timer.task.projectId,
        date: dayStart(timer.startedAt),
        minutes,
        notes: timer.notes,
        startedAt: timer.startedAt,
        endedAt: new Date(),
        source: "TIMER",
        ...rates,
      },
    }),
    db.runningTimer.delete({ where: { id: timer.id } }),
  ]);

  return minutes;
}

export async function stopTimerAction() {
  const user = await requireUser();
  await stopRunningTimer(user.id);
  refresh();
}

/** Throw the running timer away without banking it. */
export async function discardTimerAction() {
  const user = await requireUser();
  await db.runningTimer.deleteMany({ where: { userId: user.id } });
  refresh();
}

// ------------------------------------------------------------ period lock

/**
 * Reopen closed months, or put the normal rule back.
 *
 * There has to be a way out: a month closes automatically, and sooner or later
 * something genuinely needs correcting after the close. Admin-only, global,
 * and visible in the banner while it's in force so nobody forgets it's open.
 */
export async function setPeriodReopenAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!isAdmin(user)) return { error: "Administrators only." };

  // The clear button lives in the same form as the date field, so it says so
  // explicitly rather than relying on an empty value winning.
  const raw = formData.get("clear")
    ? ""
    : String(formData.get("reopenedFrom") ?? "").trim();
  if (!raw) {
    await setReopenedFrom(null);
    refresh();
    return { ok: true };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { error: "Pick a date to reopen from." };
  }

  await setReopenedFrom(dayStart(raw));
  refresh();
  return { ok: true };
}
