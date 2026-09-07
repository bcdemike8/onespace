"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type ActionState = { error?: string; ok?: boolean };

const refresh = (id?: string) => {
  revalidatePath("/templates", "layout");
  if (id) revalidatePath(`/templates/${id}`, "layout");
};

export async function createTemplateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give the template a name." };

  if (await db.projectTemplate.findUnique({ where: { name } })) {
    return { error: `A template called "${name}" already exists.` };
  }

  const template = await db.projectTemplate.create({
    data: { name, description: (formData.get("description") as string) || null },
  });

  refresh();
  redirect(`/templates/${template.id}`);
}

export async function updateTemplateAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  await db.projectTemplate.update({
    where: { id },
    data: { name, description: (formData.get("description") as string) || null },
  });
  refresh(id);
}

export async function deleteTemplateAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  // Projects keep working after their template goes away — the FK is SetNull —
  // but archiving is friendlier when the template is still in use.
  const inUse = await db.project.count({ where: { templateId: id } });
  if (inUse > 0) {
    await db.projectTemplate.update({ where: { id }, data: { archivedAt: new Date() } });
  } else {
    await db.projectTemplate.delete({ where: { id } });
  }

  refresh();
  redirect("/templates");
}

/** Copy an existing template — the fastest way to build a variant. */
export async function duplicateTemplateAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const source = await db.projectTemplate.findUnique({
    where: { id },
    include: {
      sections: { orderBy: { orderIndex: "asc" } },
      tasks: { orderBy: { orderIndex: "asc" } },
    },
  });
  if (!source) return;

  let name = `${source.name} (copy)`;
  let n = 2;
  while (await db.projectTemplate.findUnique({ where: { name } })) {
    name = `${source.name} (copy ${n++})`;
  }

  const copy = await db.projectTemplate.create({
    data: { name, description: source.description },
  });

  const sectionIdMap = new Map<string, string>();
  for (const section of source.sections) {
    const created = await db.templateSection.create({
      data: { templateId: copy.id, name: section.name, orderIndex: section.orderIndex },
    });
    sectionIdMap.set(section.id, created.id);
  }

  await db.templateTask.createMany({
    data: source.tasks.map((t) => ({
      templateId: copy.id,
      sectionId: t.sectionId ? (sectionIdMap.get(t.sectionId) ?? null) : null,
      name: t.name,
      description: t.description,
      offsetDays: t.offsetDays,
      estimatedHours: t.estimatedHours,
      defaultAssigneeId: t.defaultAssigneeId,
      orderIndex: t.orderIndex,
    })),
  });

  refresh();
  redirect(`/templates/${copy.id}`);
}

// -------------------------------------------------------- template sections

export async function createTemplateSectionAction(formData: FormData) {
  await requireAdmin();
  const templateId = String(formData.get("templateId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!templateId || !name) return;

  const last = await db.templateSection.findFirst({
    where: { templateId },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });

  await db.templateSection.create({
    data: { templateId, name, orderIndex: (last?.orderIndex ?? -1) + 1 },
  });
  refresh(templateId);
}

export async function deleteTemplateSectionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const section = await db.templateSection.findUnique({
    where: { id },
    select: { templateId: true },
  });
  if (!section) return;

  await db.templateTask.updateMany({ where: { sectionId: id }, data: { sectionId: null } });
  await db.templateSection.delete({ where: { id } });
  refresh(section.templateId);
}

// ----------------------------------------------------------- template tasks

const templateTaskSchema = z.object({
  templateId: z.string().trim().min(1),
  name: z.string().trim().min(1, "Give the step a name."),
  description: z.string().trim().max(4000).optional().nullable(),
  sectionId: z.string().trim().optional().nullable(),
  defaultAssigneeId: z.string().trim().optional().nullable(),
  offsetDays: z.string().trim().optional().nullable(),
  estimatedHours: z.string().trim().optional().nullable(),
});

const toInt = (v?: string | null) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
};

const toHours = (v?: string | null) => {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export async function createTemplateTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = templateTaskSchema.safeParse({
    templateId: formData.get("templateId"),
    name: formData.get("name"),
    description: formData.get("description"),
    sectionId: formData.get("sectionId"),
    defaultAssigneeId: formData.get("defaultAssigneeId"),
    offsetDays: formData.get("offsetDays"),
    estimatedHours: formData.get("estimatedHours"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const last = await db.templateTask.findFirst({
    where: { templateId: d.templateId },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });

  await db.templateTask.create({
    data: {
      templateId: d.templateId,
      sectionId: d.sectionId || null,
      name: d.name,
      description: d.description || null,
      defaultAssigneeId: d.defaultAssigneeId || null,
      offsetDays: toInt(d.offsetDays),
      estimatedHours: toHours(d.estimatedHours),
      orderIndex: (last?.orderIndex ?? -1) + 1,
    },
  });

  refresh(d.templateId);
  return { ok: true };
}

export async function updateTemplateTaskAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  const task = await db.templateTask.update({
    where: { id },
    data: {
      name,
      description: (formData.get("description") as string) || null,
      sectionId: (formData.get("sectionId") as string) || null,
      defaultAssigneeId: (formData.get("defaultAssigneeId") as string) || null,
      offsetDays: toInt(formData.get("offsetDays") as string),
      estimatedHours: toHours(formData.get("estimatedHours") as string),
    },
    select: { templateId: true },
  });

  refresh(task.templateId);
}

export async function deleteTemplateTaskAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const task = await db.templateTask.findUnique({
    where: { id },
    select: { templateId: true },
  });
  if (!task) return;

  await db.templateTask.delete({ where: { id } });
  refresh(task.templateId);
}

export async function moveTemplateTaskAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");

  const task = await db.templateTask.findUnique({ where: { id } });
  if (!task) return;

  const neighbour = await db.templateTask.findFirst({
    where: {
      templateId: task.templateId,
      sectionId: task.sectionId,
      orderIndex:
        direction === "up" ? { lt: task.orderIndex } : { gt: task.orderIndex },
    },
    orderBy: { orderIndex: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;

  await db.$transaction([
    db.templateTask.update({
      where: { id: task.id },
      data: { orderIndex: neighbour.orderIndex },
    }),
    db.templateTask.update({
      where: { id: neighbour.id },
      data: { orderIndex: task.orderIndex },
    }),
  ]);

  refresh(task.templateId);
}

/**
 * Turn a project that already exists into a reusable template — how most
 * playbooks actually get written: run it once, then keep it.
 */
export async function saveProjectAsTemplateAction(formData: FormData) {
  await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const rawName = String(formData.get("name") ?? "").trim();

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      sections: { orderBy: { orderIndex: "asc" } },
      tasks: { orderBy: { orderIndex: "asc" } },
    },
  });
  if (!project) return;

  let name = rawName || `${project.name} template`;
  let n = 2;
  while (await db.projectTemplate.findUnique({ where: { name } })) {
    name = `${rawName || `${project.name} template`} (${n++})`;
  }

  const template = await db.projectTemplate.create({
    data: { name, description: `Created from the project "${project.name}".` },
  });

  const sectionIdMap = new Map<string, string>();
  for (const section of project.sections) {
    const created = await db.templateSection.create({
      data: {
        templateId: template.id,
        name: section.name,
        orderIndex: section.orderIndex,
      },
    });
    sectionIdMap.set(section.id, created.id);
  }

  // Due dates become offsets from the project's start, so the template can be
  // stamped out against any future kickoff date.
  const start = project.startDate ?? project.createdAt;

  await db.templateTask.createMany({
    data: project.tasks.map((t) => ({
      templateId: template.id,
      sectionId: t.sectionId ? (sectionIdMap.get(t.sectionId) ?? null) : null,
      name: t.name,
      description: t.description,
      defaultAssigneeId: t.assigneeId,
      estimatedHours: t.estimatedHours,
      orderIndex: t.orderIndex,
      offsetDays: t.dueDate
        ? Math.round((t.dueDate.getTime() - start.getTime()) / 86_400_000)
        : null,
    })),
  });

  refresh();
  redirect(`/templates/${template.id}`);
}
