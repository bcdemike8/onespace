"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { dayStart } from "@/lib/dates";
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
    if (r.transcriptsLeft > 0) {
      bits.push(
        `${r.transcriptsLeft} more transcript${r.transcriptsLeft === 1 ? "" : "s"} still to read - run it again, or leave them to tonight`,
      );
    }
    let message = `${bits.join(", ")}.`;
    if (r.transcripts > 0 && r.fromSummary === 0 && r.summaryNote) {
      // Worth saying every time. The transcript rules are the fallback and
      // they are visibly worse than AI Companion's next steps; someone
      // reading "12 commitments found" should know which reader produced
      // them before they trust the list.
      message += ` AI Companion wasn't used, so the weaker transcript rules ran - ${r.summaryNote}`;
    }
    return { ok: true, message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The Zoom sync failed." };
  }
}

/**
 * The person whose call or recap it is, or an admin.
 *
 * A commitment hangs off exactly one of the two: a meeting, or the recap
 * email it was written in. Both know whose it is, and both know a date to
 * anchor the task's description to.
 */
async function ownCommitment(id: string) {
  const user = await requireUser();
  const row = await db.commitment.findUnique({
    where: { id },
    include: {
      meeting: { select: { userId: true, projectId: true, startsAt: true } },
      mailMessage: {
        select: {
          sentAt: true,
          thread: { select: { userId: true, projectId: true } },
        },
      },
    },
  });
  if (!row) throw new Error("That commitment is no longer here.");

  const origin = row.meeting
    ? {
        userId: row.meeting.userId,
        projectId: row.meeting.projectId,
        on: row.meeting.startsAt,
        where: "call",
      }
    : row.mailMessage
      ? {
          userId: row.mailMessage.thread.userId,
          projectId: row.mailMessage.thread.projectId,
          on: row.mailMessage.sentAt,
          where: "recap",
        }
      : null;

  // Neither: the meeting or the mail it came from has been deleted under it.
  if (!origin) throw new Error("Whatever this came from is no longer here.");

  if (origin.userId !== user.id && !isAdmin(user)) {
    throw new Error(`That's someone else's ${origin.where}.`);
  }
  return { user, row, origin };
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
    return {
      error:
        ctx.origin.where === "call"
          ? "File this meeting to a project first, then the task has somewhere to go."
          : "File this email thread to a project first, then the task has somewhere to go.",
    };
  }
  if (ctx.row.status === "ACCEPTED") return { error: "That's already a task." };

  // A date typed on the card wins over the one that was read out of the
  // sentence - the person is looking at it and knows better.
  const typed = String(formData.get("dueDate") ?? "").trim();
  const dueDate = typed ? dayStart(typed) : ctx.row.dueDate;

  const said = ctx.origin.on.toISOString().slice(0, 10);
  const from = ctx.origin.where === "call" ? "the call on" : "the recap sent on";

  await db.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        projectId,
        name: name.slice(0, 200),
        assigneeId: ctx.origin.userId,
        dueDate,
        // The description carries the sentence and where it was said, so
        // anyone wondering where this came from can check rather than guess.
        description: `From ${from} ${said}: "${ctx.row.text}"`,
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

/**
 * Throw away what the transcript rules found and read them again.
 *
 * The rules are the feature, and a rules change makes everything already
 * raised the output of a version nobody believes any more. Rather than ask
 * people to dismiss thirty rows by hand, this clears the pending ones and
 * unsets the read marker so the next Zoom sync goes back to Zoom for the
 * transcripts - which are still there, because Zoom keeps them; OneSpace is
 * the one that doesn't.
 *
 * Accepted commitments are left alone. They are real tasks now, and somebody
 * decided that. Dismissed ones are left too, so a promise already turned
 * down doesn't come back a second time.
 */
export async function rereadTranscriptsAction(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  if (!isAdmin(user)) return { error: "Only an admin can re-read transcripts." };

  const cleared = await db.$transaction(async (tx) => {
    const removed = await tx.commitment.deleteMany({
      where: {
        status: "PENDING",
        source: { in: ["TRANSCRIPT", "ZOOM_SUMMARY"] },
      },
    });
    // Only meetings there is still a transcript to go back for: the sync
    // finds one by Zoom UUID, so a calendar-only meeting has nothing to
    // re-read and clearing its marker would just cost a lookup.
    await tx.meeting.updateMany({
      where: { zoomUuid: { not: null }, transcriptReadAt: { not: null } },
      data: { transcriptReadAt: null },
    });
    return removed.count;
  });

  refresh();
  return {
    ok: true,
    message: `Cleared ${cleared} unconfirmed commitment${cleared === 1 ? "" : "s"}. Run Sync Zoom to read the transcripts again.`,
  };
}
