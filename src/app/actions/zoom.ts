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
      // Named, but not all of them: a bad afternoon can produce fifty, and a
      // wall of meeting titles buries the one line that says what to do.
      const named = r.failed.slice(0, 3).map((f) => f.name).join(", ");
      const rest = r.failed.length - 3;
      bits.push(
        `couldn't read ${named}${rest > 0 ? ` and ${rest} more` : ""} (${r.failed[0].error})`,
      );
    }
    if (r.transcriptsLeft > 0) {
      bits.push(
        `${r.transcriptsLeft} more transcript${r.transcriptsLeft === 1 ? "" : "s"} still to read - run it again, or leave them to tonight`,
      );
    }
    if (r.tooOld > 0) {
      bits.push(
        `${r.tooOld} too old to write up`,
      );
    }
    if (r.retryable > 0) {
      bits.push(
        `${r.retryable} couldn't be read and will be tried again`,
      );
    }
    let message = `${bits.join(", ")}.`;
    // The reason, whatever it was. This used to be shown only when a
    // transcript had been read and Zoom's summary hadn't answered, which is
    // precisely the case where it matters least: a sync that read nothing
    // at all said nothing about why, and "no transcript" was left looking
    // like a fact about the calls rather than a thing to go and fix.
    if (r.summaryNote && (r.retryable > 0 || r.transcripts === 0 || r.fromSummary === 0)) {
      message += ` ${r.summaryNote}`;
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
/**
 * Mark calls to be read again.
 *
 * Yours by default, everyone's when an admin asks for everyone's. This used
 * to be admin-only for both, which put the one repair that fixes a bad batch
 * of write-ups out of reach of the people whose calls they are - and a
 * consultant re-reading their own calls is not an act that needs a
 * permission, it just re-reads transcripts they were on.
 */
export async function rereadTranscriptsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const everyone = formData.get("scope") === "all";
  if (everyone && !isAdmin(user)) {
    return { error: "Only an admin can re-read everyone's calls." };
  }

  // The same window the sync writes up. Clearing the marker on a call the
  // sync will only pass over as too old is churn: two hundred rows rewritten
  // to say "too old" and nothing read. This asks for exactly what will be
  // read.
  const { transcriptWindowDays } = await import("@/lib/zoom/sync");
  const days = await transcriptWindowDays();
  const since = new Date(Date.now() - days * 86_400_000);

  const scope = {
    ...(everyone ? {} : { userId: user.id }),
    startsAt: { gte: since },
  };

  const cleared = await db.$transaction(async (tx) => {
    const removed = await tx.commitment.deleteMany({
      where: {
        status: "PENDING",
        source: { in: ["TRANSCRIPT", "ZOOM_SUMMARY", "AI_SUMMARY"] },
        meeting: scope,
      },
    });
    // Only meetings there is still a transcript to go back for: the sync
    // finds one by Zoom UUID, so a calendar-only meeting has nothing to
    // re-read and clearing its marker would just cost a lookup.
    const queued = await tx.meeting.updateMany({
      where: { ...scope, zoomUuid: { not: null }, transcriptReadAt: { not: null } },
      data: { transcriptReadAt: null, transcriptNote: null },
    });
    return { removed: removed.count, queued: queued.count };
  });

  refresh();
  return {
    ok: true,
    message:
      cleared.queued === 0
        ? `Nothing from the last ${days} days to read again${everyone ? "" : " on your calls"}.`
        : `${cleared.queued} call${cleared.queued === 1 ? "" : "s"} from the last ${days} days${
            everyone ? "" : " of yours"
          } queued to be read again${
            cleared.removed > 0
              ? `, ${cleared.removed} unconfirmed suggestion${cleared.removed === 1 ? "" : "s"} cleared`
              : ""
          }. Run Sync Zoom, or leave it to tonight.`,
  };
}

/**
 * Ask Zoom, now, what it has for one call.
 *
 * "I can see the transcript in Zoom" and "OneSpace says there isn't one"
 * can both be true, and the gap between them is always something specific:
 * a scope the app was never granted, a scope granted after the app was
 * activated, a recording that lives on a laptop, captions rather than an
 * audio transcript, a file Zoom hasn't finished making. Guessing at which
 * from here costs a day each time. This asks and prints the answer.
 */
export async function diagnoseZoomAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "");
  const meeting = await db.meeting.findUnique({
    where: { id },
    select: { zoomUuid: true, title: true, userId: true },
  });
  if (!meeting) return { error: "That meeting is no longer here." };
  // Your own call, or an admin's view of someone else's. Asking Zoom what it
  // holds for a call you were on isn't a privileged act, and gating it on
  // admin meant the person who needed the answer couldn't get it.
  if (meeting.userId !== user.id && !isAdmin(user)) {
    return { error: "That's someone else's call." };
  }
  if (!meeting.zoomUuid) {
    return {
      error:
        "This meeting has never been matched to a Zoom call, so there's nothing to look up yet. Run Sync Zoom on the meetings list first — if the call was recorded, it'll be matched by its Zoom id or by when it started.",
    };
  }

  const { describeZoomCall } = await import("@/lib/zoom/diagnose");
  try {
    return { ok: true, message: await describeZoomCall(meeting.zoomUuid) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't ask Zoom about this call." };
  }
}

/**
 * Read one call now, rather than running the whole sync to find out.
 *
 * The loop this replaces was: change a setting, run Sync Zoom, wait for it
 * to work through five transcripts, read an aggregate number, guess. This
 * reads the call in front of you and says what happened to that one.
 */
export async function readCallAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "");
  const owner = await db.meeting.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!owner) return { error: "That meeting is no longer here." };
  // Same rule: re-reading the transcript of a call you were on reads data
  // that is already yours, and produces nothing anyone else can see.
  if (owner.userId !== user.id && !isAdmin(user)) {
    return { error: "That's someone else's call." };
  }

  const { readMeetingNow } = await import("@/lib/zoom/sync");

  try {
    const message = await readMeetingNow(id);
    refresh();
    revalidatePath(`/meetings/${id}`);
    return { ok: true, message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't read that call." };
  }
}
