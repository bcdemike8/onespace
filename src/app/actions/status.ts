"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ProjectHealth } from "@prisma/client";
import { db } from "@/lib/db";
import { isAdmin, requireUser } from "@/lib/auth";
import { dayStart } from "@/lib/dates";
import { buildStatusUpdateMessage } from "@/lib/slack/digest";
import { appUrl, tryPost } from "@/lib/slack/send";

export type ActionState = { error?: string; ok?: boolean };

const HEALTHS = ["ON_TRACK", "AT_RISK", "OFF_TRACK"] as const;

const schema = z.object({
  projectId: z.string().trim().min(1),
  health: z.enum(HEALTHS),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
  note: z.string().trim().max(4000).optional().nullable(),
});

export async function addStatusUpdateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = schema.safeParse({
    projectId: formData.get("projectId"),
    health: formData.get("health"),
    date: formData.get("date"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message ?? "Pick a status and a date." };
  }

  const { projectId, health, date, note } = parsed.data;

  // "Off track" with no explanation is a flag nobody can act on.
  if (health !== "ON_TRACK" && !note?.trim()) {
    return {
      error:
        health === "AT_RISK"
          ? "Say what the risk is — a flag with no explanation can't be acted on."
          : "Say what went wrong, so someone can pick it up.",
    };
  }

  await db.statusUpdate.create({
    data: {
      projectId,
      authorId: user.id,
      health: health as ProjectHealth,
      note: note?.trim() || null,
      date: dayStart(date),
    },
  });

  // Mirror it into the project's Slack channel when one is mapped. Awaited so
  // the serverless request doesn't end mid-flight, but tryPost never throws —
  // the update is already saved and Slack being down mustn't undo that.
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { name: true, slackChannelId: true },
  });
  if (project?.slackChannelId) {
    const msg = buildStatusUpdateMessage({
      projectName: project.name,
      health,
      note: note?.trim() || null,
      authorName: user.name,
      url: `${appUrl()}/projects/${projectId}`,
    });
    await tryPost(project.slackChannelId, msg.text, msg.blocks);
  }

  revalidatePath(`/projects/${projectId}`, "layout");
  revalidatePath("/projects", "layout");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Authors can remove their own update; admins can remove any. */
export async function deleteStatusUpdateAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  const update = await db.statusUpdate.findUnique({
    where: { id },
    select: { authorId: true, projectId: true },
  });
  if (!update) return;
  if (update.authorId !== user.id && !isAdmin(user)) return;

  await db.statusUpdate.delete({ where: { id } });

  revalidatePath(`/projects/${update.projectId}`, "layout");
  revalidatePath("/projects", "layout");
}
