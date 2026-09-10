"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isAdmin, requireUser } from "@/lib/auth";
import { syncZoom } from "@/lib/zoom/sync";

export type ActionState = { error?: string; ok?: boolean; message?: string };

const refresh = () =>
  ["/", "/meetings", "/timesheet", "/projects"].forEach((p) =>
    revalidatePath(p, "layout"),
  );

export async function syncZoomAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const everyone = formData.get("scope") === "all";
  if (everyone && !isAdmin(user)) {
    return { error: "Only an admin can sync everyone's Zoom." };
  }

  try {
    const r = await syncZoom(everyone ? {} : { userId: user.id });
    refresh();

    if (r.people === 0) {
      return {
        error:
          "Nobody in OneSpace matched a Zoom user. Zoom is matched by email, so their Zoom account has to use the same address.",
      };
    }

    const bits = [`${r.seen} Zoom call${r.seen === 1 ? "" : "s"} read`];
    if (r.timed > 0) bits.push(`${r.timed} given their real length`);
    if (r.created > 0) bits.push(`${r.created} that weren't on a calendar`);
    if (r.commitments > 0) {
      bits.push(
        `${r.commitments} commitment${r.commitments === 1 ? "" : "s"} found in ${r.transcripts} transcript${r.transcripts === 1 ? "" : "s"}`,
      );
    } else if (r.transcripts > 0) {
      bits.push(`${r.transcripts} transcripts read, nothing promised`);
    }
    if (r.failed.length > 0) {
      bits.push(`couldn't read ${r.failed.map((f) => f.name).join(", ")}`);
    }
    return { ok: true, message: `${bits.join(", ")}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The Zoom sync failed." };
  }
}

/** The person whose meeting it is, or an admin. */
async function ownCommitment(id: string) {
  const user = await requireUser();
  const row = await db.commitment.findUnique({
    where: { id },
    include: { meeting: { select: { userId: true, projectId: true, startsAt: true } } },
  });
  if (!row) throw new Error("That commitment is no longer here.");
  if (row.meeting.userId !== user.id && !isAdmin(user)) {
    throw new Error("That's someone else's call.");
  }
  return { user, row };
}

/**
 * Turn a commitment into a real task on the project.
 *
 * Assigned to whoever made the promise, which is the whole point - the person
 * who said it on the call is the person it lands on.
 */
export async function acceptCommitmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();

  let ctx;
  try {
    ctx = await ownCommitment(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "You can't accept that." };
  }
  if (!name) return { error: "Give the task a name." };
  if (!projectId) {
    return { error: "File this meeting to a project first, then the task has somewhere to go." };
  }
  if (ctx.row.status === "ACCEPTED") return { error: "That's already a task." };

  await db.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        projectId,
        name: name.slice(0, 200),
        assigneeId: ctx.row.meeting.userId,
        // The description carries the sentence and where it was said, so
        // anyone wondering where this came from can check rather than guess.
        description: `From the call on ${ctx.row.meeting.startsAt.toISOString().slice(0, 10)}: "${ctx.row.text}"`,
      },
    });
    await tx.commitment.update({
      where: { id },
      data: { status: "ACCEPTED", taskId: task.id },
    });
  });

  refresh();
  return { ok: true };
}

export async function dismissCommitmentAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  try {
    await ownCommitment(id);
  } catch {
    return;
  }
  await db.commitment.update({ where: { id }, data: { status: "DISMISSED" } });
  refresh();
}
