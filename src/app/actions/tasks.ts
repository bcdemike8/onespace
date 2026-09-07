"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdmin, requireAdmin, requireUser } from "@/lib/auth";
import { dayStart } from "@/lib/dates";

export type ActionState = { error?: string; ok?: boolean };

function refresh(projectId?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/timesheet", "layout");
  revalidatePath("/projects", "layout");
  if (projectId) revalidatePath(`/projects/${projectId}`, "layout");
}

const taskSchema = z.object({
  projectId: z.string().trim().min(1),
  name: z.string().trim().min(1, "Give the task a name."),
  description: z.string().trim().max(4000).optional().nullable(),
  sectionId: z.string().trim().optional().nullable(),
  assigneeId: z.string().trim().optional().nullable(),
  dueDate: z.string().trim().optional().nullable(),
  estimatedHours: z.string().trim().optional().nullable(),
});

const toHours = (v?: string | null) => {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const toDate = (v?: string | null) =>
  v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? dayStart(v) : null;

export async function createTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  const parsed = taskSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    description: formData.get("description"),
    sectionId: formData.get("sectionId"),
    assigneeId: formData.get("assigneeId"),
    dueDate: formData.get("dueDate"),
    estimatedHours: formData.get("estimatedHours"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const last = await db.task.findFirst({
    where: { projectId: d.projectId, sectionId: d.sectionId || null },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });

  await db.task.create({
    data: {
      projectId: d.projectId,
      sectionId: d.sectionId || null,
      name: d.name,
      description: d.description || null,
      assigneeId: d.assigneeId || null,
      dueDate: toDate(d.dueDate),
      estimatedHours: toHours(d.estimatedHours),
      orderIndex: (last?.orderIndex ?? -1) + 1,
    },
  });

  refresh(d.projectId);
  return { ok: true };
}

export async function updateTaskAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const id = String(formData.get("id") ?? "");

  const parsed = taskSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    description: formData.get("description"),
    sectionId: formData.get("sectionId"),
    assigneeId: formData.get("assigneeId"),
    dueDate: formData.get("dueDate"),
    estimatedHours: formData.get("estimatedHours"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const status = String(formData.get("status") ?? "TODO") as
    | "TODO"
    | "IN_PROGRESS"
    | "BLOCKED"
    | "DONE";

  await db.task.update({
    where: { id },
    data: {
      name: d.name,
      description: d.description || null,
      sectionId: d.sectionId || null,
      assigneeId: d.assigneeId || null,
      dueDate: toDate(d.dueDate),
      estimatedHours: toHours(d.estimatedHours),
      status,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });

  refresh(d.projectId);
  return { ok: true };
}

/** The one-click checkbox on every task list. */
export async function toggleTaskDoneAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");

  const task = await db.task.findUnique({
    where: { id },
    select: { status: true, projectId: true },
  });
  if (!task) return;

  const done = task.status === "DONE";
  await db.task.update({
    where: { id },
    data: {
      status: done ? "TODO" : "DONE",
      completedAt: done ? null : new Date(),
    },
  });

  refresh(task.projectId);
}

export async function setTaskStatusAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["TODO", "IN_PROGRESS", "BLOCKED", "DONE"].includes(status)) return;

  const task = await db.task.update({
    where: { id },
    data: {
      status: status as "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE",
      completedAt: status === "DONE" ? new Date() : null,
    },
    select: { projectId: true },
  });

  refresh(task.projectId);
}

export async function setTaskAssigneeAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const assigneeId = String(formData.get("assigneeId") ?? "");

  const task = await db.task.update({
    where: { id },
    data: { assigneeId: assigneeId || null },
    select: { projectId: true },
  });

  refresh(task.projectId);
}

export async function deleteTaskAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  const task = await db.task.findUnique({
    where: { id },
    select: { projectId: true, _count: { select: { timeEntries: true } } },
  });
  if (!task) return;

  // Time already logged against a task is billing history. Only an admin may
  // remove it, and the entries survive on the project either way.
  if (task._count.timeEntries > 0 && !isAdmin(user)) return;

  await db.task.delete({ where: { id } });
  refresh(task.projectId);
}

// ----------------------------------------------------------------- sections

export async function createSectionAction(formData: FormData) {
  await requireUser();
  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!projectId || !name) return;

  const last = await db.section.findFirst({
    where: { projectId },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });

  await db.section.create({
    data: { projectId, name, orderIndex: (last?.orderIndex ?? -1) + 1 },
  });
  refresh(projectId);
}

export async function renameSectionAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  const section = await db.section.update({
    where: { id },
    data: { name },
    select: { projectId: true },
  });
  refresh(section.projectId);
}

/** Deleting a section keeps its tasks — they fall back to the unsectioned list. */
export async function deleteSectionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const section = await db.section.findUnique({
    where: { id },
    select: { projectId: true },
  });
  if (!section) return;

  await db.task.updateMany({ where: { sectionId: id }, data: { sectionId: null } });
  await db.section.delete({ where: { id } });
  refresh(section.projectId);
}

export async function moveTaskAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");

  const task = await db.task.findUnique({
    where: { id },
    select: { id: true, projectId: true, sectionId: true, orderIndex: true },
  });
  if (!task) return;

  const neighbour = await db.task.findFirst({
    where: {
      projectId: task.projectId,
      sectionId: task.sectionId,
      orderIndex: direction === "up" ? { lt: task.orderIndex } : { gt: task.orderIndex },
    },
    orderBy: { orderIndex: direction === "up" ? "desc" : "asc" },
    select: { id: true, orderIndex: true },
  });
  if (!neighbour) return;

  await db.$transaction([
    db.task.update({ where: { id: task.id }, data: { orderIndex: neighbour.orderIndex } }),
    db.task.update({ where: { id: neighbour.id }, data: { orderIndex: task.orderIndex } }),
  ]);

  refresh(task.projectId);
}
