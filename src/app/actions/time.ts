"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdmin, requireUser } from "@/lib/auth";
import { resolveRates } from "@/lib/rates";
import { dayStart } from "@/lib/dates";
import { parseDuration } from "@/lib/format";

export type ActionState = { error?: string; ok?: boolean };

const REVALIDATE = ["/", "/timesheet", "/reports", "/projects"];
const refresh = () => REVALIDATE.forEach((p) => revalidatePath(p, "layout"));

/** A member may only touch their own time; an admin may touch anyone's. */
async function assertCanEditEntry(entryId: string) {
  const user = await requireUser();
  const entry = await db.timeEntry.findUnique({
    where: { id: entryId },
    select: { userId: true },
  });
  if (!entry) throw new Error("That time entry no longer exists.");
  if (entry.userId !== user.id && !isAdmin(user)) {
    throw new Error("You can only edit your own time.");
  }
  return user;
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

  const billableOverride =
    formData.get("billable") === null ? undefined : parsed.data.billable === "on";

  const rates = await resolveRates(user.id, parsed.data.projectId, billableOverride);

  await db.timeEntry.create({
    data: {
      userId: user.id,
      taskId: parsed.data.taskId || null,
      projectId: parsed.data.projectId,
      date: dayStart(parsed.data.date),
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
  await assertCanEditEntry(id);

  const minutes = parseDuration(String(formData.get("duration") ?? ""));
  if (minutes === null || minutes <= 0) {
    return { error: "That duration didn't make sense. Try 1.5, 1:30 or 90m." };
  }

  const dateRaw = String(formData.get("date") ?? "");
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

// ---------------------------------------------------------------- stopwatch

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
