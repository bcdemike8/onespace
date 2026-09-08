"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { dayStart } from "@/lib/dates";
import { matchKey, splitProjectName } from "@/lib/import/shared";
import { type AsanaPlan, parseAsanaCsv } from "@/lib/import/asana";
import { type EverhourPlan, parseEverhourCsv } from "@/lib/import/everhour";

/**
 * CSV import from Asana (projects and tasks) and Everhour (time entries).
 *
 * Every import is two steps: a preview that resolves names against the people
 * and projects already in OneSpace and reports exactly what will happen, then
 * a commit. Nothing is written until the commit, and the same file text is
 * re-parsed at commit time so there's no half-parsed state sitting on a server.
 */

export interface PersonMatch {
  name: string;
  email: string;
  /** Minutes or task count, depending on the importer. */
  weight: number;
  matchedUserId: string | null;
  matchedUserName: string | null;
}

async function matchPeople(
  candidates: { name: string; email: string; weight: number }[],
): Promise<PersonMatch[]> {
  const users = await db.user.findMany({
    select: { id: true, name: true, email: true },
  });

  const byEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));
  const byName = new Map(users.map((u) => [matchKey(u.name), u]));

  return candidates.map((c) => {
    // Email is authoritative; fall back to an exact name match.
    const user =
      (c.email ? byEmail.get(c.email.toLowerCase()) : undefined) ??
      byName.get(matchKey(c.name));

    return {
      ...c,
      matchedUserId: user?.id ?? null,
      matchedUserName: user?.name ?? null,
    };
  });
}

// ------------------------------------------------------------------ Asana

export interface AsanaPreview {
  ok: boolean;
  error?: string;
  plan?: {
    detectedProjectName: string | null;
    sections: string[];
    taskCount: number;
    subtaskCount: number;
    completedCount: number;
    datedCount: number;
    estimatedHours: number;
    startDate: Date | null;
    endDate: Date | null;
    warnings: string[];
    mappedColumns: { field: string; column: string | null }[];
    sample: { name: string; section: string | null; assignee: string; due: Date | null }[];
  };
  people?: PersonMatch[];
  clients?: { id: string; name: string }[];
}

function summariseAsana(plan: AsanaPlan): NonNullable<AsanaPreview["plan"]> {
  const dated = plan.tasks.filter((t) => t.dueDate);
  const dueDates = dated.map((t) => t.dueDate!.getTime());

  return {
    detectedProjectName: plan.detectedProjectName,
    sections: plan.sections,
    taskCount: plan.tasks.length,
    subtaskCount: plan.tasks.filter((t) => t.isSubtask).length,
    completedCount: plan.tasks.filter((t) => t.completed).length,
    datedCount: dated.length,
    estimatedHours:
      Math.round(
        plan.tasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0) * 100,
      ) / 100,
    startDate: plan.startDate ?? (dueDates.length ? new Date(Math.min(...dueDates)) : null),
    endDate: dueDates.length ? new Date(Math.max(...dueDates)) : null,
    warnings: plan.warnings,
    mappedColumns: [
      { field: "Task name", column: plan.columns.name },
      { field: "Section", column: plan.columns.section },
      { field: "Assignee", column: plan.columns.assignee },
      { field: "Assignee email", column: plan.columns.assigneeEmail },
      { field: "Due date", column: plan.columns.dueDate },
      { field: "Notes", column: plan.columns.notes },
      { field: "Completed", column: plan.columns.completedAt },
      { field: "Estimated hours", column: plan.columns.estimatedHours },
    ],
    sample: plan.tasks.slice(0, 8).map((t) => ({
      name: t.name,
      section: t.sectionName,
      assignee: t.assigneeName || t.assigneeEmail || "",
      due: t.dueDate,
    })),
  };
}

export async function previewAsanaImportAction(
  text: string,
): Promise<AsanaPreview> {
  await requireAdmin();

  try {
    const plan = parseAsanaCsv(text);
    if (!plan.columns.name) {
      return {
        ok: false,
        error:
          "That doesn't look like an Asana task export — there's no task-name column.",
      };
    }

    const [people, clients] = await Promise.all([
      matchPeople(
        plan.assignees.map((a) => ({
          name: a.name,
          email: a.email,
          weight: a.taskCount,
        })),
      ),
      db.client.findMany({
        where: { archivedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return { ok: true, plan: summariseAsana(plan), people, clients };
  } catch (error) {
    return {
      ok: false,
      error: `Couldn't read that file: ${(error as Error).message}`,
    };
  }
}

export interface AsanaCommitOptions {
  projectName: string;
  clientId: string;
  newClientName: string;
  startDate: string;
  includeSubtasks: boolean;
  includeCompleted: boolean;
  createTemplate: boolean;
  templateName: string;
}

export interface CommitResult {
  ok: boolean;
  error?: string;
  message?: string;
  projectId?: string;
  templateId?: string;
  created?: Record<string, number>;
  notes?: string[];
}

export async function commitAsanaImportAction(
  text: string,
  options: AsanaCommitOptions,
): Promise<CommitResult> {
  await requireAdmin();

  const plan = parseAsanaCsv(text);
  const projectName = options.projectName.trim() || plan.detectedProjectName;
  if (!projectName) return { ok: false, error: "Give the project a name." };
  if (plan.tasks.length === 0) {
    return { ok: false, error: "There are no tasks in that file." };
  }

  const tasks = plan.tasks.filter(
    (t) =>
      (options.includeSubtasks || !t.isSubtask) &&
      (options.includeCompleted || !t.completed),
  );
  if (tasks.length === 0) {
    return { ok: false, error: "Those filters leave no tasks to import." };
  }

  // Resolve the client: an existing one, a new one, or none.
  let clientId: string | null = options.clientId || null;
  const newClientName = options.newClientName.trim();
  if (!clientId && newClientName) {
    const existing = await db.client.findUnique({ where: { name: newClientName } });
    clientId = existing
      ? existing.id
      : (await db.client.create({ data: { name: newClientName } })).id;
  }

  const people = await matchPeople(
    plan.assignees.map((a) => ({ name: a.name, email: a.email, weight: a.taskCount })),
  );
  const userIdFor = new Map<string, string>();
  for (const p of people) {
    if (!p.matchedUserId) continue;
    if (p.email) userIdFor.set(p.email.toLowerCase(), p.matchedUserId);
    userIdFor.set(matchKey(p.name), p.matchedUserId);
  }

  const startDate = options.startDate ? dayStart(options.startDate) : plan.startDate;
  const estimatedTotal = tasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
  const dueDates = tasks.filter((t) => t.dueDate).map((t) => t.dueDate!.getTime());

  const project = await db.project.create({
    data: {
      name: projectName,
      clientId,
      startDate,
      dueDate: dueDates.length ? new Date(Math.max(...dueDates)) : null,
      budgetHours: estimatedTotal > 0 ? estimatedTotal : null,
    },
  });

  // Sections first, so tasks can reference the created rows.
  const sectionIdByName = new Map<string, string>();
  const usedSections = plan.sections.filter((s) =>
    tasks.some((t) => t.sectionName === s),
  );
  for (const [index, name] of usedSections.entries()) {
    const section = await db.section.create({
      data: { projectId: project.id, name, orderIndex: index },
    });
    sectionIdByName.set(name, section.id);
  }

  let unassigned = 0;
  await db.task.createMany({
    data: tasks.map((t, index) => {
      const assigneeId =
        (t.assigneeEmail ? userIdFor.get(t.assigneeEmail.toLowerCase()) : undefined) ??
        (t.assigneeName ? userIdFor.get(matchKey(t.assigneeName)) : undefined) ??
        null;
      if (!assigneeId && (t.assigneeName || t.assigneeEmail)) unassigned += 1;

      return {
        projectId: project.id,
        sectionId: t.sectionName ? (sectionIdByName.get(t.sectionName) ?? null) : null,
        name: t.name,
        description: t.notes,
        assigneeId,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours,
        status: t.completed ? ("DONE" as const) : ("TODO" as const),
        completedAt: t.completed ? new Date() : null,
        orderIndex: index,
      };
    }),
  });

  const created: Record<string, number> = {
    Tasks: tasks.length,
    Sections: usedSections.length,
  };
  const notes: string[] = [];
  if (unassigned > 0) {
    notes.push(
      `${unassigned} ${unassigned === 1 ? "task" : "tasks"} came in unassigned ` +
        `${unassigned === 1 ? "because its" : "because their"} Asana assignee has no ` +
        "OneSpace account yet. Add them under People, then set the assignee on those tasks.",
    );
  }

  // Optionally turn the freshly imported project into a reusable template.
  let templateId: string | undefined;
  if (options.createTemplate) {
    let templateName = options.templateName.trim() || `${projectName} template`;
    let n = 2;
    while (await db.projectTemplate.findUnique({ where: { name: templateName } })) {
      templateName = `${options.templateName.trim() || `${projectName} template`} (${n++})`;
    }

    const template = await db.projectTemplate.create({
      data: {
        name: templateName,
        description: `Built from the Asana import of “${projectName}”.`,
      },
    });
    templateId = template.id;

    const templateSectionId = new Map<string, string>();
    for (const [index, name] of usedSections.entries()) {
      const section = await db.templateSection.create({
        data: { templateId: template.id, name, orderIndex: index },
      });
      templateSectionId.set(name, section.id);
    }

    const anchor = startDate ?? new Date();
    await db.templateTask.createMany({
      data: tasks.map((t, index) => ({
        templateId: template.id,
        sectionId: t.sectionName ? (templateSectionId.get(t.sectionName) ?? null) : null,
        name: t.name,
        description: t.notes,
        estimatedHours: t.estimatedHours,
        defaultAssigneeId:
          (t.assigneeEmail ? userIdFor.get(t.assigneeEmail.toLowerCase()) : undefined) ??
          (t.assigneeName ? userIdFor.get(matchKey(t.assigneeName)) : undefined) ??
          null,
        orderIndex: index,
        // Absolute due dates become offsets from kickoff, so the template can
        // be stamped out against any future start date.
        offsetDays: t.dueDate
          ? Math.round((t.dueDate.getTime() - anchor.getTime()) / 86_400_000)
          : null,
      })),
    });

    created.Template = 1;
    await db.project.update({
      where: { id: project.id },
      data: { templateId: template.id },
    });
  }

  revalidatePath("/", "layout");

  return {
    ok: true,
    projectId: project.id,
    templateId,
    created,
    notes,
    message: `Imported “${projectName}” with ${tasks.length} tasks.`,
  };
}

// --------------------------------------------------------------- Everhour

export interface EverhourPreview {
  ok: boolean;
  error?: string;
  plan?: {
    entryCount: number;
    totalMinutes: number;
    earliest: Date | null;
    latest: Date | null;
    warnings: string[];
    mappedColumns: { field: string; column: string | null }[];
    hasRates: boolean;
    monthly: boolean;
    partners: string[];
    leadCount: number;
    /** Time already loaded by a previous import over the same days. */
    existingImported: { count: number; minutes: number };
  };
  people?: PersonMatch[];
  projects?: {
    name: string;
    clientName: string;
    minutes: number;
    matchedProjectId: string | null;
    matchedProjectName: string | null;
  }[];
}

async function matchProjects(plan: EverhourPlan) {
  const projects = await db.project.findMany({
    select: { id: true, name: true },
  });
  const byName = new Map(projects.map((p) => [matchKey(p.name), p]));

  return plan.projects.map((p) => {
    const match = byName.get(matchKey(p.name));
    return {
      ...p,
      matchedProjectId: match?.id ?? null,
      matchedProjectName: match?.name ?? null,
    };
  });
}

export async function previewEverhourImportAction(
  text: string,
  fromISO: string,
  toISO: string,
): Promise<EverhourPreview> {
  await requireAdmin();

  try {
    const plan = parseEverhourCsv(text, {
      from: fromISO ? dayStart(fromISO) : null,
      to: toISO ? dayStart(toISO) : null,
    });

    if (!plan.columns.date || !plan.columns.time) {
      return {
        ok: false,
        error:
          "That export is missing a date or time column. Re-export from Everhour " +
          "with at least Date, Member, Project and Time selected.",
      };
    }

    const [people, projects, priorImport] = await Promise.all([
      matchPeople(
        plan.members.map((m) => ({
          name: m.name,
          email: m.email,
          weight: m.minutes,
        })),
      ),
      matchProjects(plan),
      plan.earliest && plan.latest
        ? db.timeEntry.aggregate({
            where: {
              source: "IMPORT",
              date: { gte: plan.earliest, lte: plan.latest },
            },
            _count: { _all: true },
            _sum: { minutes: true },
          })
        : Promise.resolve(null),
    ]);

    return {
      ok: true,
      plan: {
        entryCount: plan.entries.length,
        totalMinutes: plan.totalMinutes,
        earliest: plan.earliest,
        latest: plan.latest,
        warnings: plan.warnings,
        hasRates: plan.entries.some(
          (e) => e.billRateCents !== null || e.costRateCents !== null,
        ),
        monthly: plan.monthly,
        partners: plan.partners,
        leadCount: plan.projects.filter((pr) => pr.leadName).length,
        existingImported: {
          count: priorImport?._count._all ?? 0,
          minutes: priorImport?._sum.minutes ?? 0,
        },
        mappedColumns: [
          { field: "Date", column: plan.columns.date },
          { field: "Member", column: plan.columns.member },
          { field: "Project", column: plan.columns.project },
          { field: "Task", column: plan.columns.task },
          { field: "Time", column: plan.columns.time },
          { field: "Billable", column: plan.columns.billable },
          { field: "Billable amount", column: plan.columns.billableAmount },
          { field: "Cost", column: plan.columns.cost },
        ],
      },
      people,
      projects,
    };
  } catch (error) {
    return {
      ok: false,
      error: `Couldn't read that file: ${(error as Error).message}`,
    };
  }
}

export interface EverhourCommitOptions {
  fromISO: string;
  toISO: string;
  createMissingProjects: boolean;
  useExportedRates: boolean;
  /**
   * Clear time from earlier imports across the days this file covers, before
   * loading it. For re-importing the same period at better resolution — a
   * report re-exported with real dates rather than month headings, where the
   * usual row-matching can't recognise the old rows as the same work.
   */
  replaceImported: boolean;
}

export async function commitEverhourImportAction(
  text: string,
  options: EverhourCommitOptions,
): Promise<CommitResult> {
  await requireAdmin();

  const plan = parseEverhourCsv(text, {
    from: options.fromISO ? dayStart(options.fromISO) : null,
    to: options.toISO ? dayStart(options.toISO) : null,
  });
  if (plan.entries.length === 0) {
    return { ok: false, error: "No usable time entries in that range." };
  }

  // Only ever removes IMPORT rows, and only across the days this file covers:
  // hours typed into a timesheet, logged from a project page or captured by a
  // stopwatch are never touched.
  let replaced = 0;
  if (options.replaceImported && plan.earliest && plan.latest) {
    const { count } = await db.timeEntry.deleteMany({
      where: {
        source: "IMPORT",
        date: { gte: plan.earliest, lte: plan.latest },
      },
    });
    replaced = count;
  }

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      costRateCents: true,
      billRateCents: true,
    },
  });
  const userByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));
  const userByName = new Map(users.map((u) => [matchKey(u.name), u]));

  const projects = await db.project.findMany({
    select: { id: true, name: true, billable: true, billRateCents: true },
  });
  const projectByName = new Map(projects.map((p) => [matchKey(p.name), p]));

  const clients = await db.client.findMany({ select: { id: true, name: true } });
  const clientByName = new Map(clients.map((c) => [matchKey(c.name), c]));

  const partners = await db.partner.findMany({ select: { id: true, name: true } });
  const partnerByName = new Map(partners.map((p) => [matchKey(p.name), p]));

  async function partnerIdFor(name: string): Promise<string | null> {
    if (!name) return null;
    const existing = partnerByName.get(matchKey(name));
    if (existing) return existing.id;
    const created = await db.partner.create({ data: { name } });
    partnerByName.set(matchKey(name), created);
    return created.id;
  }

  async function clientIdFor(name: string): Promise<string | null> {
    if (!name) return null;
    const existing = clientByName.get(matchKey(name));
    if (existing) return existing.id;
    const created = await db.client.create({ data: { name } });
    clientByName.set(matchKey(name), created);
    return created.id;
  }

  // Tasks are matched by name within their project, one lookup per project.
  const tasksByProject = new Map<string, Map<string, string>>();
  async function taskIdFor(projectId: string, taskName: string) {
    if (!taskName) return null;
    let lookup = tasksByProject.get(projectId);
    if (!lookup) {
      const rows = await db.task.findMany({
        where: { projectId },
        select: { id: true, name: true },
      });
      lookup = new Map(rows.map((t) => [matchKey(t.name), t.id]));
      tasksByProject.set(projectId, lookup);
    }
    return lookup.get(matchKey(taskName)) ?? null;
  }

  interface Resolved {
    userId: string;
    projectId: string;
    taskId: string | null;
    date: Date;
    minutes: number;
    notes: string | null;
    billable: boolean;
    billRateCents: number;
    costRateCents: number;
    source: "IMPORT";
  }

  const resolved: Resolved[] = [];
  let skippedNoUser = 0;
  let skippedNoProject = 0;
  let createdProjects = 0;
  const missingPeople = new Set<string>();
  const missingProjects = new Set<string>();

  for (const entry of plan.entries) {
    const user =
      (entry.memberEmail ? userByEmail.get(entry.memberEmail.toLowerCase()) : undefined) ??
      userByName.get(matchKey(entry.memberName)) ??
      // Everhour sometimes carries a longer form of the same name
      // ("Marcus Callaway Taylor" for "Marcus Callaway"), and this report has
      // no email column to fall back on.
      users.find(
        (u) =>
          matchKey(entry.memberName).startsWith(matchKey(u.name)) ||
          matchKey(u.name).startsWith(matchKey(entry.memberName)),
      );

    if (!user) {
      skippedNoUser += 1;
      if (entry.memberName || entry.memberEmail) {
        missingPeople.add(entry.memberName || entry.memberEmail);
      }
      continue;
    }

    let project = entry.projectName
      ? projectByName.get(matchKey(entry.projectName))
      : undefined;

    if (!project && entry.projectName && options.createMissingProjects) {
      // Everhour's "client" is the partner the work came through; the end
      // customer is buried in the project name.
      const derived = splitProjectName(entry.projectName);
      const clientId = await clientIdFor(entry.clientName || derived.client);
      const partnerId = await partnerIdFor(entry.partnerName);

      // The report names a project lead — that's the project owner.
      const owner = entry.leadName
        ? (userByName.get(matchKey(entry.leadName)) ??
           users.find((u) => matchKey(u.name).startsWith(matchKey(entry.leadName))))
        : undefined;

      const created = await db.project.create({
        data: {
          name: entry.projectName,
          clientId,
          partnerId,
          ownerId: owner?.id ?? null,
          // These are historical, so they stay out of the active list.
          status: "COMPLETED",
        },
        select: { id: true, name: true, billable: true, billRateCents: true },
      });
      projectByName.set(matchKey(entry.projectName), created);
      project = created;
      createdProjects += 1;
    }

    if (!project) {
      skippedNoProject += 1;
      if (entry.projectName) missingProjects.add(entry.projectName);
      continue;
    }

    const taskId = await taskIdFor(project.id, entry.taskName);

    // Prefer the rate implied by the export, so historical money stays true.
    const billRateCents =
      (options.useExportedRates ? entry.billRateCents : null) ??
      project.billRateCents ??
      user.billRateCents;
    const costRateCents =
      (options.useExportedRates ? entry.costRateCents : null) ?? user.costRateCents;

    resolved.push({
      userId: user.id,
      projectId: project.id,
      taskId,
      date: entry.date,
      minutes: entry.minutes,
      // When the export names a task this project doesn't have, keep the name
      // in the note rather than throwing it away — it's often the only record
      // of what the time was actually spent on.
      notes: entry.notes ?? (taskId ? null : entry.taskName || null),
      billable: entry.billable && project.billable,
      billRateCents,
      costRateCents,
      source: "IMPORT",
    });
  }

  // Re-importing the same file must not double-count, but a month-grouped
  // export legitimately contains repeated identical rows — four one-hour
  // kickoff calls in the same month are four hours, not one. So compare
  // COUNTS per signature rather than mere existence.
  const signature = (r: Resolved) =>
    [
      r.userId,
      r.projectId,
      r.taskId ?? "",
      r.date.toISOString().slice(0, 10),
      r.minutes,
      r.notes ?? "",
      r.billable,
    ].join("\u0000");

  const wanted = new Map<string, Resolved[]>();
  for (const r of resolved) {
    const key = signature(r);
    wanted.set(key, [...(wanted.get(key) ?? []), r]);
  }

  const projectIds = [...new Set(resolved.map((r) => r.projectId))];
  const existingRows = projectIds.length
    ? await db.timeEntry.groupBy({
        by: ["userId", "projectId", "taskId", "date", "minutes", "notes", "billable"],
        where: { projectId: { in: projectIds } },
        _count: { _all: true },
      })
    : [];

  const already = new Map<string, number>();
  for (const row of existingRows) {
    const key = [
      row.userId,
      row.projectId,
      row.taskId ?? "",
      row.date.toISOString().slice(0, 10),
      row.minutes,
      row.notes ?? "",
      row.billable,
    ].join("\u0000");
    already.set(key, (already.get(key) ?? 0) + row._count._all);
  }

  const toCreate: Resolved[] = [];
  let duplicates = 0;
  for (const [key, group] of wanted) {
    const have = already.get(key) ?? 0;
    if (have >= group.length) {
      duplicates += group.length;
      continue;
    }
    duplicates += have;
    toCreate.push(...group.slice(have));
  }

  // One bulk insert rather than a thousand round trips.
  for (let i = 0; i < toCreate.length; i += 500) {
    await db.timeEntry.createMany({ data: toCreate.slice(i, i + 500) });
  }
  const imported = toCreate.length;

  const notes: string[] = [];
  if (missingPeople.size > 0) {
    notes.push(
      `${skippedNoUser} ${skippedNoUser === 1 ? "entry" : "entries"} skipped — no OneSpace account for: ` +
        `${[...missingPeople].slice(0, 8).join(", ")}` +
        `${missingPeople.size > 8 ? `, and ${missingPeople.size - 8} more` : ""}. ` +
        "Add them under People and run this import again — already-imported rows won't duplicate.",
    );
  }
  if (missingProjects.size > 0) {
    notes.push(
      `${skippedNoProject} ${skippedNoProject === 1 ? "entry" : "entries"} skipped — no matching project for: ` +
        `${[...missingProjects].slice(0, 8).join(", ")}` +
        `${missingProjects.size > 8 ? `, and ${missingProjects.size - 8} more` : ""}. ` +
        "Import those projects from Asana first, or tick “create missing projects”.",
    );
  }
  if (duplicates > 0) {
    notes.push(
      `${duplicates} ${duplicates === 1 ? "entry was" : "entries were"} already ` +
        "imported and left alone.",
    );
  }
  if (replaced > 0) {
    notes.push(
      `${replaced} ${replaced === 1 ? "entry" : "entries"} from an earlier ` +
        "import were cleared first. Time logged in OneSpace itself was untouched.",
    );
  }

  revalidatePath("/", "layout");

  return {
    ok: true,
    created: {
      "Time entries": imported,
      ...(createdProjects ? { Projects: createdProjects } : {}),
    },
    notes,
    message: `Imported ${imported} time ${imported === 1 ? "entry" : "entries"}.`,
  };
}
