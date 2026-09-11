"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { addDays, dayStart } from "@/lib/dates";
import { parseMoneyToCents } from "@/lib/format";
import { parseDomains } from "@/lib/domains";

export type ActionState = { error?: string; ok?: boolean };

const refresh = () => {
  revalidatePath("/projects", "layout");
  revalidatePath("/reports", "layout");
  revalidatePath("/", "layout");
};

const optionalDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? dayStart(v) : null));

const optionalNumber = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => {
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  });

const projectSchema = z.object({
  name: z.string().trim().min(1, "Give the project a name."),
  code: z.string().trim().max(40).optional().nullable(),
  clientId: z.string().trim().optional().nullable(),
  partnerId: z.string().trim().optional().nullable(),
  ownerId: z.string().trim().optional().nullable(),
  templateId: z.string().trim().optional().nullable(),
  startDate: optionalDate,
  dueDate: optionalDate,
  budgetHours: optionalNumber,
  budgetAmount: z.string().trim().optional().nullable(),
  billRate: z.string().trim().optional().nullable(),
  billingType: z.enum(["HOURLY", "FIXED_FEE", "NON_BILLABLE"]).default("HOURLY"),
  // "C0123|general" — the id to store plus the name to show it by.
  slackChannel: z.string().trim().max(200).optional().nullable(),
  clientDomains: z.string().trim().max(500).optional().nullable(),
});


/**
 * Copy a template's sections and tasks onto a project.
 *
 * Task due dates are the template's offset counted forward from `start`.
 */
async function applyTemplate(
  projectId: string,
  templateId: string,
  start: Date,
): Promise<void> {
  const template = await db.projectTemplate.findUnique({
    where: { id: templateId },
    include: {
      sections: { orderBy: { orderIndex: "asc" } },
      tasks: { orderBy: { orderIndex: "asc" } },
    },
  });
  if (!template) return;

  // Sections first, so tasks can point at the copies rather than the originals.
  const sectionIdMap = new Map<string, string>();
  for (const section of template.sections) {
    const created = await db.section.create({
      data: { projectId, name: section.name, orderIndex: section.orderIndex },
    });
    sectionIdMap.set(section.id, created.id);
  }

  // Parents first, so their subtasks have a real id to point at. Template
  // task ids don't survive the copy, so the mapping is kept explicitly.
  const row = (t: (typeof template.tasks)[number], parentId: string | null) => ({
    projectId,
    sectionId: t.sectionId ? (sectionIdMap.get(t.sectionId) ?? null) : null,
    parentId,
    name: t.name,
    description: t.description,
    assigneeId: t.defaultAssigneeId,
    estimatedHours: t.estimatedHours,
    orderIndex: t.orderIndex,
    dueDate: t.offsetDays === null ? null : addDays(start, t.offsetDays),
  });

  const taskIdMap = new Map<string, string>();
  for (const t of template.tasks.filter((t) => !t.parentId)) {
    const created = await db.task.create({ data: row(t, null) });
    taskIdMap.set(t.id, created.id);
  }

  const children = template.tasks.filter((t) => t.parentId);
  if (children.length > 0) {
    await db.task.createMany({
      data: children.map((t) =>
        row(t, taskIdMap.get(t.parentId as string) ?? null),
      ),
    });
  }
}

/** Hours a template's estimates add up to, for seeding a budget. */
async function templateHours(templateId: string): Promise<number> {
  const rows = await db.templateTask.findMany({
    where: { templateId },
    select: { estimatedHours: true },
  });
  return rows.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
}

/**
 * Create a project, optionally stamping out a template.
 *
 * Template instantiation is the whole point of the tool: sections, tasks,
 * owners and estimates all come across, and each task's due date is its
 * template offset counted forward from the project's start date.
 */
export async function createProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    clientId: formData.get("clientId"),
    partnerId: formData.get("partnerId"),
    ownerId: formData.get("ownerId"),
    templateId: formData.get("templateId"),
    startDate: formData.get("startDate"),
    dueDate: formData.get("dueDate"),
    budgetHours: formData.get("budgetHours"),
    budgetAmount: formData.get("budgetAmount"),
    billRate: formData.get("billRate"),
    billingType: formData.get("billingType") ?? "HOURLY",
    clientDomains: formData.get("clientDomains"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const budgetCents = d.budgetAmount ? parseMoneyToCents(d.budgetAmount) : null;
  const billRateCents = d.billRate ? parseMoneyToCents(d.billRate) : null;
  if (budgetCents === null && d.budgetAmount) {
    return { error: "That budget amount didn't look like a number." };
  }

  const start = d.startDate ?? dayStart(new Date());

  // If no budget was typed but the template carries estimates, seed the hours
  // budget from them - otherwise budget-vs-actual would start life empty.
  const fromTemplate = d.templateId ? await templateHours(d.templateId) : 0;
  const budgetHours = d.budgetHours ?? (fromTemplate > 0 ? fromTemplate : null);

  const project = await db.project.create({
    data: {
      name: d.name,
      code: d.code || null,
      clientId: d.clientId || null,
      partnerId: d.partnerId || null,
      ownerId: d.ownerId || null,
      templateId: d.templateId || null,
      startDate: d.startDate,
      dueDate: d.dueDate,
      budgetHours,
      budgetCents: budgetCents ?? null,
      billRateCents,
      billingType: d.billingType,
    },
  });

  // Attach the client's email domains here, at the moment the project is
  // created. Meetings and mail are only pulled in for domains mapped to a
  // client, so a project whose client has no domain quietly gets none of
  // either - and nobody notices for a month. Asking once, here, is the only
  // point where the answer is obvious to whoever is typing.
  if (d.clientId) {
    const wanted = parseDomains(d.clientDomains);
    if (wanted.length > 0) {
      // skipDuplicates rather than a check: a domain already registered to
      // another client is that client's, and silently moving it would be
      // worse than doing nothing. The Clients page reports the clash.
      await db.clientDomain.createMany({
        data: wanted.map((domain) => ({ clientId: d.clientId!, domain })),
        skipDuplicates: true,
      });
    }
  }

  if (d.templateId) await applyTemplate(project.id, d.templateId, start);

  // Steps the template didn't name an owner for fall to the project's owner.
  await cascadeOwnerToTasks(project.id, d.ownerId || null);

  refresh();
  redirect(`/projects/${project.id}`);
}

export async function updateProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    clientId: formData.get("clientId"),
    partnerId: formData.get("partnerId"),
    ownerId: formData.get("ownerId"),
    startDate: formData.get("startDate"),
    dueDate: formData.get("dueDate"),
    budgetHours: formData.get("budgetHours"),
    budgetAmount: formData.get("budgetAmount"),
    billRate: formData.get("billRate"),
    billingType: formData.get("billingType") ?? "HOURLY",
    slackChannel: formData.get("slackChannel"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const status = String(formData.get("status") ?? "ACTIVE");
  const [slackChannelId, slackChannelName] = (d.slackChannel ?? "").split("|");
  const budgetCents = d.budgetAmount ? parseMoneyToCents(d.budgetAmount) : null;
  const billRateCents = d.billRate ? parseMoneyToCents(d.billRate) : null;

  await db.project.update({
    where: { id },
    data: {
      name: d.name,
      code: d.code || null,
      clientId: d.clientId || null,
      partnerId: d.partnerId || null,
      ownerId: d.ownerId || null,
      startDate: d.startDate,
      dueDate: d.dueDate,
      budgetHours: d.budgetHours,
      budgetCents,
      billRateCents,
      billingType: d.billingType,
      slackChannelId: slackChannelId || null,
      slackChannelName: slackChannelId ? (slackChannelName ?? null) : null,
      status: status as "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED",
    },
  });
  await cascadeOwnerToTasks(id, d.ownerId || null);

  refresh();
  revalidatePath(`/projects/${id}`, "layout");
  return { ok: true };
}

/**
 * Deleting a project deletes its time entries with it, which is usually the
 * wrong thing for anything you've billed — so refuse once time exists and
 * point at archiving instead.
 */
export async function deleteProjectAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const loggedEntries = await db.timeEntry.count({ where: { projectId: id } });
  if (loggedEntries > 0) {
    await db.project.update({ where: { id }, data: { status: "ARCHIVED" } });
  } else {
    await db.project.delete({ where: { id } });
  }

  refresh();
  redirect("/projects");
}

// ------------------------------------------------------------------ clients

export async function createClientAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give the client a name." };

  const existing = await db.client.findUnique({ where: { name } });
  if (existing) return { error: `"${name}" already exists.` };

  await db.client.create({
    data: { name, notes: (formData.get("notes") as string) || null },
  });

  revalidatePath("/clients", "layout");
  refresh();
  return { ok: true };
}


const clientSetupSchema = z.object({
  name: z.string().trim().min(1, "Give the client a name."),
  notes: z.string().trim().max(1000).optional().nullable(),
  domains: z.string().trim().max(500),
  // The first project, when one is being made at the same time.
  withProject: z.string().optional().nullable(),
  projectName: z.string().trim().max(200).optional().nullable(),
  templateId: z.string().trim().optional().nullable(),
  partnerId: z.string().trim().optional().nullable(),
  ownerId: z.string().trim().optional().nullable(),
  startDate: optionalDate,
  dueDate: optionalDate,
  budgetHours: optionalNumber,
  budgetAmount: z.string().trim().optional().nullable(),
  billRate: z.string().trim().optional().nullable(),
  billingType: z.enum(["HOURLY", "FIXED_FEE", "NON_BILLABLE"]).default("HOURLY"),
});

/**
 * Set a client up in one pass: the client, its email domains, and its first
 * project.
 *
 * These are three records on three pages, and getting two of them right is
 * the same as getting none: a client with a project but no domain pulls in
 * no meetings and no mail, and says nothing about it. That has happened
 * here, more than once, and the fix is to stop it being possible to do half
 * the job rather than to remember harder.
 *
 * So the domain is required. Not "recommended" - required. Everything the
 * Google and Zoom integrations do is keyed on it.
 */
export async function setUpClientAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = clientSetupSchema.safeParse({
    name: formData.get("name"),
    notes: formData.get("notes"),
    domains: formData.get("domains"),
    withProject: formData.get("withProject"),
    projectName: formData.get("projectName"),
    templateId: formData.get("templateId"),
    partnerId: formData.get("partnerId"),
    ownerId: formData.get("ownerId"),
    startDate: formData.get("startDate"),
    dueDate: formData.get("dueDate"),
    budgetHours: formData.get("budgetHours"),
    budgetAmount: formData.get("budgetAmount"),
    billRate: formData.get("billRate"),
    billingType: formData.get("billingType") ?? "HOURLY",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const domains = parseDomains(d.domains);
  if (domains.length === 0) {
    return {
      error:
        "Add at least one email domain - it's how their meetings and mail find this client. Just the domain: acme.com",
    };
  }

  // Told before anything is written, and named, because "that domain is
  // taken" is useless without knowing who has it.
  const clash = await db.clientDomain.findFirst({
    where: { domain: { in: domains } },
    select: { domain: true, client: { select: { name: true } } },
  });
  if (clash) {
    return {
      error: `${clash.domain} already belongs to ${clash.client.name}. A domain can only point at one client.`,
    };
  }

  const existing = await db.client.findUnique({ where: { name: d.name } });
  if (existing) {
    return { error: `There's already a client called ${d.name}.` };
  }

  const wantsProject = d.withProject === "on" || d.withProject === "true";
  if (wantsProject && !d.projectName) {
    return { error: "Give the first project a name, or turn it off." };
  }

  const budgetCents = d.budgetAmount ? parseMoneyToCents(d.budgetAmount) : null;
  if (budgetCents === null && d.budgetAmount) {
    return { error: "That budget amount didn't look like a number." };
  }
  const billRateCents = d.billRate ? parseMoneyToCents(d.billRate) : null;

  const client = await db.client.create({
    data: { name: d.name, notes: d.notes || null },
  });

  await db.clientDomain.createMany({
    data: domains.map((domain) => ({ clientId: client.id, domain })),
    skipDuplicates: true,
  });

  if (!wantsProject) {
    refresh();
    redirect("/clients");
  }

  const start = d.startDate ?? dayStart(new Date());
  const fromTemplate = d.templateId ? await templateHours(d.templateId) : 0;

  const project = await db.project.create({
    data: {
      name: d.projectName!,
      clientId: client.id,
      partnerId: d.partnerId || null,
      ownerId: d.ownerId || null,
      templateId: d.templateId || null,
      startDate: d.startDate,
      dueDate: d.dueDate,
      budgetHours: d.budgetHours ?? (fromTemplate > 0 ? fromTemplate : null),
      budgetCents: budgetCents ?? null,
      billRateCents,
      billingType: d.billingType,
    },
  });

  if (d.templateId) await applyTemplate(project.id, d.templateId, start);
  await cascadeOwnerToTasks(project.id, d.ownerId || null);

  refresh();
  redirect(`/projects/${project.id}`);
}

export async function updateClientAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  await db.client.update({
    where: { id },
    data: { name, notes: (formData.get("notes") as string) || null },
  });
  revalidatePath("/clients", "layout");
  refresh();
}

/**
 * Archive a client, or bring one back.
 *
 * Archiving means finished, and now behaves like it: their domains stop
 * matching, so no new meeting or email thread is suggested for them. Nothing
 * already logged changes, the domains stay on record, and un-archiving
 * restores the lot in one click. This is the right answer for almost every
 * client who is no longer active - delete is for mistakes, not for endings.
 */
export async function toggleClientArchivedAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const client = await db.client.findUnique({ where: { id } });
  if (!client) return;

  await db.client.update({
    where: { id },
    data: { archivedAt: client.archivedAt ? null : new Date() },
  });
  refresh();
  revalidatePath("/clients", "layout");
}

/**
 * What would be lost, or orphaned, if this client went.
 *
 * Not exported: every export from a "use server" file becomes an endpoint
 * any signed-in user can call, and this one takes an id straight from its
 * caller. The Clients page counts the same things in its own query.
 */
async function clientFootprint(clientId: string) {
  const [projects, timeEntries, meetings, mailThreads] = await Promise.all([
    db.project.count({ where: { clientId } }),
    db.timeEntry.count({ where: { project: { clientId } } }),
    db.meeting.count({ where: { project: { clientId } } }),
    db.mailThread.count({ where: { clientId } }),
  ]);
  return { projects, timeEntries, meetings, mailThreads };
}

/**
 * Delete a client outright.
 *
 * Only ever for a mistake - a typo, a duplicate, a company that turned out
 * not to be a client. Anything with real history is archived instead, and
 * this refuses rather than offering a way round it.
 *
 * The refusal matters more than the deletion. Project.clientId is SET NULL,
 * so deleting a client with projects would not fail and would not warn: the
 * projects survive with no client, every hour ever logged against them
 * silently drops out of that client's reports, and nobody finds out until
 * an invoice is short. Checking first is the whole feature.
 */
export async function deleteClientAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const typed = String(formData.get("confirmName") ?? "").trim();

  const client = await db.client.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!client) return { error: "That client is no longer here." };

  // Typing the name is the only guard against a misplaced click on a row
  // that looks like the one above it.
  if (typed !== client.name) {
    return {
      error: `Type the client's name exactly - ${client.name} - to confirm.`,
    };
  }

  const has = await clientFootprint(id);
  const blockers: string[] = [];
  if (has.projects > 0) {
    blockers.push(`${has.projects} project${has.projects === 1 ? "" : "s"}`);
  }
  if (has.timeEntries > 0) {
    blockers.push(`${has.timeEntries} logged time ${has.timeEntries === 1 ? "entry" : "entries"}`);
  }
  if (has.meetings > 0) {
    blockers.push(`${has.meetings} meeting${has.meetings === 1 ? "" : "s"}`);
  }
  if (has.mailThreads > 0) {
    blockers.push(`${has.mailThreads} email thread${has.mailThreads === 1 ? "" : "s"}`);
  }

  if (blockers.length > 0) {
    return {
      error: `${client.name} has ${blockers.join(", ")}. Deleting would leave that work with no client and quietly drop it out of their reports. Archive them instead - it stops new meetings and mail, and keeps the history.`,
    };
  }

  // Only the domains come with it, and those are meaningless without it.
  await db.client.delete({ where: { id } });

  refresh();
  revalidatePath("/clients", "layout");
  return { ok: true };
}


/**
 * Give the project's owner every task nobody else is doing.
 *
 * Only unassigned tasks are touched. A task deliberately given to someone
 * other than the owner — which is most of what came across from Asana — stays
 * with them; use assignAllTasksToOwnerAction to override that on purpose.
 */
async function cascadeOwnerToTasks(projectId: string, ownerId: string | null) {
  if (!ownerId) return 0;
  const { count } = await db.task.updateMany({
    where: { projectId, assigneeId: null },
    data: { assigneeId: ownerId },
  });
  return count;
}

/** Hand every task on the project to its owner, including reassigning. */
export async function assignAllTasksToOwnerAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const project = await db.project.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!project?.ownerId) return;

  await db.task.updateMany({
    where: { projectId: id },
    data: { assigneeId: project.ownerId },
  });

  refresh();
  revalidatePath(`/projects/${id}`, "layout");
}

/** Set (or clear) a project's owner from the projects list. */
export async function setProjectOwnerAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const ownerId = String(formData.get("ownerId") ?? "");
  if (!id) return;

  await db.project.update({
    where: { id },
    data: { ownerId: ownerId || null },
  });
  await cascadeOwnerToTasks(id, ownerId || null);

  refresh();
  revalidatePath(`/projects/${id}`, "layout");
}

// ----------------------------------------------------------------- partners

export async function createPartnerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give the partner a name." };

  if (await db.partner.findUnique({ where: { name } })) {
    return { error: `"${name}" already exists.` };
  }

  await db.partner.create({
    data: { name, notes: (formData.get("notes") as string) || null },
  });

  revalidatePath("/clients", "layout");
  refresh();
  return { ok: true };
}

export async function updatePartnerAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  await db.partner.update({
    where: { id },
    data: { name, notes: (formData.get("notes") as string) || null },
  });
  revalidatePath("/clients", "layout");
  refresh();
}

export async function togglePartnerArchivedAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const partner = await db.partner.findUnique({ where: { id } });
  if (!partner) return;

  await db.partner.update({
    where: { id },
    data: { archivedAt: partner.archivedAt ? null : new Date() },
  });
  revalidatePath("/clients", "layout");
}
