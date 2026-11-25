"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { dayStart } from "@/lib/dates";
import { isAdmin, requireUser } from "@/lib/auth";
import { mayDecide, takesTasks } from "@/lib/commitments/permissions";
import { addTaskOnce } from "@/lib/commitments/accept";
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
 * The action items behind a row, if this person may act on them.
 *
 * A row on My work can stand for several stored items - the same undertaking
 * said on two calls - so everything here takes a list. Each item hangs off
 * exactly one of a meeting or the recap email it was written in; both know
 * who the host is and a date to anchor the task's description to.
 *
 * Allowed: the person who undertook it; for an item whose owner couldn't be
 * placed, the host of the call or thread; or an admin. See mayDecide.
 */
async function ownCommitments(ids: string[]) {
  const user = await requireUser();
  if (ids.length === 0) throw new Error("Nothing was chosen.");

  const rows = await db.commitment.findMany({
    where: { id: { in: ids } },
    include: {
      meeting: { select: { userId: true, startsAt: true } },
      mailMessage: {
        select: {
          sentAt: true,
          thread: { select: { userId: true } },
        },
      },
    },
  });
  if (rows.length !== ids.length) {
    throw new Error("Some of those are no longer here - refresh the page.");
  }

  const items = rows.map((row) => {
    const origin = row.meeting
      ? { userId: row.meeting.userId, on: row.meeting.startsAt, where: "call" }
      : row.mailMessage
        ? {
            userId: row.mailMessage.thread.userId,
            on: row.mailMessage.sentAt,
            where: "recap",
          }
        : null;

    // Neither: the meeting or the mail it came from has been deleted under it.
    if (!origin) throw new Error("Whatever this came from is no longer here.");

    if (!mayDecide({ ownerId: row.ownerId, hostId: origin.userId }, { id: user.id, admin: isAdmin(user) })) {
      throw new Error(
        row.ownerId
          ? "That's a colleague's commitment - only they can add or clear it."
          : `That's someone else's ${origin.where}.`,
      );
    }
    return { row, origin };
  });

  // In the order asked for: the first id is the row as shown.
  items.sort((a, b) => ids.indexOf(a.row.id) - ids.indexOf(b.row.id));
  return { user, items };
}

const idsFrom = (formData: FormData) => [
  ...new Set(formData.getAll("id").map(String).filter(Boolean)),
];

/**
 * Turn an action item into a real task on the project.
 *
 * Assigned to the person who undertook it - several consultants on one
 * project each confirm their own. An item whose owner couldn't be
 * established is only ever added from the call's own page, by somebody
 * looking at it, and lands on the host's plate because they chose so.
 */
export async function acceptCommitmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ids = idsFrom(formData);
  const name = String(formData.get("name") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();

  let ctx;
  try {
    ctx = await ownCommitments(ids);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "You can't accept that." };
  }
  if (!name) return { error: "Give the task a name." };
  if (!projectId) return { error: "Choose the project this goes on." };

  const pending = ctx.items.filter((i) => i.row.status === "PENDING");
  if (pending.length === 0) return { error: "That's already been dealt with." };
  const first = pending[0];

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, status: true },
  });
  if (!project) return { error: "That project is no longer here." };
  if (!takesTasks(project.status)) {
    return { error: "That project is completed or archived - choose an open one." };
  }

  const assigneeId = first.row.ownerId ?? first.origin.userId;

  // The date on the card: the promised one, changed or not, or one the
  // person picked for their own planning. Left blank, the task has none -
  // a date nobody chose isn't put on it. (Items from before this carry a
  // calculated date with dueStated false; that one is never used.)
  const typed = String(formData.get("dueDate") ?? "").trim();
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(typed)
    ? dayStart(typed)
    : first.row.dueStated
      ? first.row.dueDate
      : null;

  const said = first.origin.on.toISOString().slice(0, 10);
  const from = first.origin.where === "call" ? "the call on" : "the recap sent on";
  // The full instruction, then the sentence and where it was said, so
  // anyone wondering where this came from can check rather than guess.
  const description = [
    first.row.detail,
    `From ${from} ${said}: "${first.row.text}"`,
  ]
    .filter(Boolean)
    .join("\n\n");

  // Atomic: a second "Add it" for the same item - a double-click, another
  // tab - finds it already added and creates no second task.
  const taskId = await addTaskOnce(
    db,
    first.row.id,
    pending.slice(1).map((i) => i.row.id),
    { projectId, name: name.slice(0, 200), assigneeId, dueDate, description },
  );
  if (!taskId) return { error: "That's already been added." };

  refresh();
  return { ok: true };
}

/**
 * Not a task - for one row, or for every row in a project group at once.
 *
 * Dismissed rather than deleted: a re-read of the call recognises it and
 * doesn't offer it again. Says so when it can't, instead of doing nothing.
 */
export async function dismissCommitmentsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ids = idsFrom(formData);
  try {
    await ownCommitments(ids);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "That couldn't be cleared." };
  }
  const done = await db.commitment.updateMany({
    where: { id: { in: ids }, status: "PENDING" },
    data: { status: "DISMISSED" },
  });
  refresh();
  return { ok: true, message: `${done.count} cleared.` };
}

/** The same, for the meetings page, which posts a plain form. */
export async function dismissCommitmentAction(formData: FormData): Promise<void> {
  await dismissCommitmentsAction({}, formData);
}

/**
 * Read calls again, under the current rules.
 *
 * Unsets the read marker so the next Zoom sync goes back to Zoom for the
 * transcripts - which are still there, because Zoom keeps them; OneSpace is
 * the one that doesn't. Nothing is deleted here: when each new reading
 * arrives it replaces the host's own waiting items and unidentified ones,
 * and leaves colleagues' commitments, and everything already added or
 * dismissed, as they are (lib/commitments/reread).
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
  const { transcriptWindowSince, transcriptWindowLabel } = await import(
    "@/lib/zoom/sync"
  );
  const [since, window] = await Promise.all([
    transcriptWindowSince(),
    transcriptWindowLabel(),
  ]);

  const scope = {
    ...(everyone ? {} : { userId: user.id }),
    startsAt: { gte: since },
  };

  // Nothing is cleared up front. Clearing waiting items here used to take
  // colleagues' commitments off their My work, and lost them for good if
  // the re-read then failed. The new reading is merged in when it arrives:
  // it replaces only the host's own and unidentified items, after it has
  // actually succeeded (see lib/commitments/reread).
  //
  // Only meetings there is still a transcript to go back for: the sync finds
  // one by Zoom UUID, so a calendar-only meeting has nothing to re-read.
  const queued = await db.meeting.updateMany({
    where: { ...scope, zoomUuid: { not: null }, transcriptReadAt: { not: null } },
    data: { transcriptReadAt: null, transcriptNote: null, transcriptFailedAt: null },
  });
  const cleared = { queued: queued.count };

  refresh();
  return {
    ok: true,
    message:
      cleared.queued === 0
        ? `Nothing ${window} to read again${everyone ? "" : " on your calls"}.`
        : `${cleared.queued} call${cleared.queued === 1 ? "" : "s"} ${window}${
            everyone ? "" : " of yours"
          } queued to be read again. Your waiting suggestions from them are replaced once each is read; colleagues' are left alone. Run Sync Zoom, or leave it to tonight.`,
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

/**
 * Every call in the window, and what Zoom says about each.
 *
 * The per-call diagnostic answers "what about this one". This answers "what
 * is wrong with all of them", which is the actual complaint — and it starts
 * with the account's recording settings, because if the cloud recording or
 * the transcript flag is off, nothing downstream can work and every fix
 * aimed further down is wasted.
 */
export async function sweepZoomAction(): Promise<{
  error?: string;
  report?: string;
}> {
  const user = await requireUser();
  if (!isAdmin(user)) {
    return { error: "Only an admin can sweep the whole account." };
  }

  const { zoomConfigured } = await import("@/lib/zoom/client");
  if (!zoomConfigured()) {
    return { error: "Zoom isn't connected on this service." };
  }

  try {
    const { diagnoseZoom } = await import("@/lib/zoom/sweep");
    const found = await diagnoseZoom();

    const out: string[] = [];
    out.push(`Zoom, ${found.window}.`);
    if (found.note) out.push(found.note);
    out.push("");

    for (const person of found.people) {
      out.push(`── ${person.email}`);
      if (person.settings.length) {
        out.push("   Recording settings:");
        for (const line of person.settings) out.push(`     ${line}`);
      }
      if (person.note) out.push(`   ${person.note}`);
      if (person.calls.length === 0) {
        out.push("   No finished calls in the window.");
      }
      out.push("");

      for (const call of person.calls) {
        out.push(`   ${call.startedAt}  ${call.topic}`);
        out.push(`     Zoom:      ${call.recording}`);
        for (const f of call.files) out.push(`                ${f}`);
        out.push(`     Transcript: ${call.transcript}`);
        out.push(`     AI summary: ${call.aiSummary}`);
        out.push(`     OneSpace:   ${call.onespace}`);
        out.push("");
      }
    }

    if (found.truncated) {
      out.push(
        "Stopped early — this covers the most recent calls only, so it stays inside one request.",
      );
    }

    return { report: out.join("\n") };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Couldn't ask Zoom.",
    };
  }
}
