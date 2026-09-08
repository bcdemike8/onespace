"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { addDays, dayStart } from "@/lib/dates";
import { parseMoneyToCents } from "@/lib/format";

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
  billable: z.string().optional().nullable(),
});

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
    billable: formData.get("billable"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const budgetCents = d.budgetAmount ? parseMoneyToCents(d.budgetAmount) : null;
  const billRateCents = d.billRate ? parseMoneyToCents(d.billRate) : null;
  if (budgetCents === null && d.budgetAmount) {
    return { error: "That budget amount didn't look like a number." };
  }

  const template = d.templateId
    ? await db.projectTemplate.findUnique({
        where: { id: d.templateId },
        include: {
          sections: { orderBy: { orderIndex: "asc" } },
          tasks: { orderBy: { orderIndex: "asc" } },
        },
      })
    : null;

  const start = d.startDate ?? dayStart(new Date());

  // If no budget was typed but the template carries estimates, seed the hours
  // budget from them — otherwise budget-vs-actual would start life empty.
  const templateHours =
    template?.tasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0) ?? 0;
  const budgetHours = d.budgetHours ?? (templateHours > 0 ? templateHours : null);

  const project = await db.project.create({
    data: {
      name: d.name,
      code: d.code || null,
      clientId: d.clientId || null,
      partnerId: d.partnerId || null,
      ownerId: d.ownerId || null,
      templateId: template?.id ?? null,
      startDate: d.startDate,
      dueDate: d.dueDate,
      budgetHours,
      budgetCents: budgetCents ?? null,
      billRateCents,
      billable: formData.get("billable") === null ? true : d.billable === "on",
    },
  });

  if (template) {
    // Sections first, so tasks can point at the copies rather than the originals.
    const sectionIdMap = new Map<string, string>();
    for (const section of template.sections) {
      const created = await db.section.create({
        data: {
          projectId: project.id,
          name: section.name,
          orderIndex: section.orderIndex,
        },
      });
      sectionIdMap.set(section.id, created.id);
    }

    await db.task.createMany({
      data: template.tasks.map((t) => ({
        projectId: project.id,
        sectionId: t.sectionId ? (sectionIdMap.get(t.sectionId) ?? null) : null,
        name: t.name,
        description: t.description,
        assigneeId: t.defaultAssigneeId,
        estimatedHours: t.estimatedHours,
        orderIndex: t.orderIndex,
        dueDate: t.offsetDays === null ? null : addDays(start, t.offsetDays),
      })),
    });
  }

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
    billable: formData.get("billable"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const status = String(formData.get("status") ?? "ACTIVE");
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
      billable: d.billable === "on",
      status: status as "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED",
    },
  });

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

export async function toggleClientArchivedAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const client = await db.client.findUnique({ where: { id } });
  if (!client) return;

  await db.client.update({
    where: { id },
    data: { archivedAt: client.archivedAt ? null : new Date() },
  });
  revalidatePath("/clients", "layout");
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
