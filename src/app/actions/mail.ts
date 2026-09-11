"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdmin, requireUser } from "@/lib/auth";
import { resolveRates } from "@/lib/rates";
import { assertUnlocked } from "@/lib/lock";
import { dayInZone } from "@/lib/dates";
import { parseDuration } from "@/lib/format";
import { sendReply } from "@/lib/google/gmail";
import { syncMail } from "@/lib/google/mail-sync";
import { orgTimezone } from "@/lib/google/sync";

export type ActionState = { error?: string; ok?: boolean; message?: string };

const REVALIDATE = ["/", "/inbox", "/timesheet", "/reports", "/projects"];
const refresh = () => REVALIDATE.forEach((p) => revalidatePath(p, "layout"));

/** The thread, if this person is allowed to see it. */
async function ownThread(id: string) {
  const user = await requireUser();
  const thread = await db.mailThread.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { sentAt: "asc" } },
    },
  });
  if (!thread) throw new Error("That thread is no longer here.");
  if (thread.userId !== user.id && !isAdmin(user)) {
    throw new Error("That's someone else's mailbox.");
  }
  return { user, thread };
}

// -------------------------------------------------------------------- sync

export async function syncMailAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const everyone = formData.get("scope") === "all";
  if (everyone && !isAdmin(user)) {
    return { error: "Only an admin can sync everyone's mail." };
  }

  try {
    const r = await syncMail(everyone ? {} : { userId: user.id });
    refresh();

    if (r.people === 0 && r.failed.length > 0) return { error: r.failed[0].error };
    if (r.threads === 0) {
      return {
        ok: true,
        message:
          "No client mail found. Check the clients you email have their domains set on the Clients page.",
      };
    }

    const bits = [
      `${r.threads} thread${r.threads === 1 ? "" : "s"}`,
      `${r.awaiting} waiting on a reply`,
    ];
    if (r.machine > 0) {
      bits.push(
        `${r.machine} calendar or auto-reply thread${r.machine === 1 ? "" : "s"} left out`,
      );
    }
    if (r.commitments > 0) {
      bits.push(
        `${r.commitments} action item${r.commitments === 1 ? "" : "s"} from ${r.recaps} recap${r.recaps === 1 ? "" : "s"}`,
      );
    }
    if (r.failed.length > 0) {
      bits.push(`couldn't read ${r.failed.map((f) => f.name).join(", ")}`);
    }
    return { ok: true, message: `${bits.join(", ")}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The mail sync failed." };
  }
}

// ------------------------------------------------------------------ filing

export async function fileMailAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "") || null;
  const taskId = String(formData.get("taskId") ?? "") || null;

  try {
    await ownThread(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "You can't change that." };
  }

  await db.mailThread.update({
    where: { id },
    data: { projectId, taskId: projectId ? taskId : null },
  });
  refresh();
  return { ok: true };
}

// --------------------------------------------------------------- time + done

/**
 * Book time against a thread.
 *
 * Shared by "reply and log" and "done, and here's how long it took", so the
 * rate snapshot, the lock check and the timezone conversion happen in exactly
 * one place.
 */
async function bookTime(
  thread: { id: string; userId: string; projectId: string | null; taskId: string | null; subject: string },
  duration: string,
  when: Date,
  billableOverride?: boolean,
): Promise<string | null> {
  if (!thread.projectId) return "Pick a project before logging time against this thread.";

  const minutes = parseDuration(duration);
  if (minutes === null || minutes <= 0) {
    return "That duration didn't make sense. Try 15m, 0.25 or 1:30.";
  }
  if (minutes > 24 * 60) return "That's more than 24 hours.";

  const date = dayInZone(when, await orgTimezone());
  try {
    await assertUnlocked(date);
  } catch (e) {
    return e instanceof Error ? e.message : "That period is closed.";
  }

  const rates = await resolveRates(thread.userId, thread.projectId, billableOverride);
  await db.timeEntry.create({
    data: {
      userId: thread.userId,
      projectId: thread.projectId,
      taskId: thread.taskId,
      date,
      minutes,
      notes: `Email: ${thread.subject}`,
      source: "MANUAL",
      ...rates,
    },
  });
  return null;
}

const replySchema = z.object({
  id: z.string().min(1),
  body: z.string().trim().min(1, "Write something before sending."),
  duration: z.string().trim().optional().nullable(),
  logTime: z.string().optional().nullable(),
});

/**
 * Send a reply as the person, record it, and optionally book the time it took.
 *
 * The reply is sent first. If Gmail refuses, nothing else has happened and the
 * draft is still in the box; if the bookkeeping after it fails, the mail has
 * still gone, which is the right way round.
 */
export async function replyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = replySchema.safeParse({
    id: formData.get("id"),
    body: formData.get("body"),
    duration: formData.get("duration"),
    logTime: formData.get("logTime"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let context;
  try {
    context = await ownThread(parsed.data.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "You can't reply to that." };
  }
  const { thread } = context;

  const last = thread.messages[thread.messages.length - 1];
  if (!last) return { error: "There's nothing here to reply to." };

  // Reply to everyone who was on the last message, minus ourselves.
  const mine = thread.user.email.toLowerCase();
  const recipients = [
    ...new Set([last.fromEmail, ...last.toEmails].filter((a) => a && a !== mine)),
  ];
  const cc = last.ccEmails.filter((a) => a !== mine && !recipients.includes(a));

  if (recipients.length === 0) return { error: "There's nobody to reply to." };

  let sentId: string;
  try {
    sentId = await sendReply({
      from: { email: thread.user.email, name: thread.user.name },
      to: recipients,
      cc,
      subject: thread.subject,
      body: parsed.data.body,
      threadId: thread.gmailThreadId,
      // Threading headers off the message being answered, so this lands in
      // the same conversation in their mail app rather than as a new one.
      inReplyTo: last.messageIdHeader,
      references: last.referencesHeader,
    });
  } catch (e) {
    return {
      error: e instanceof Error ? `Gmail wouldn't send it: ${e.message}` : "Gmail wouldn't send it.",
    };
  }

  const now = new Date();

  // Recorded as ours and as sent from here, so the next sync doesn't read it
  // back as the client saying something new.
  await db.mailMessage.create({
    data: {
      threadId: thread.id,
      gmailMessageId: sentId || `onespace-${now.getTime()}`,
      fromEmail: thread.user.email,
      fromName: thread.user.name,
      toEmails: recipients,
      ccEmails: cc,
      sentAt: now,
      body: parsed.data.body,
      fromUs: true,
      sentFromOneSpace: true,
    },
  });

  await db.mailThread.update({
    where: { id: thread.id },
    data: {
      status: "DONE",
      awaitingUs: false,
      lastFrom: thread.user.email,
      lastFromName: thread.user.name,
      lastMessageAt: now,
      snippet: parsed.data.body.slice(0, 300),
    },
  });

  let warning: string | undefined;
  if (parsed.data.logTime === "on" && parsed.data.duration) {
    const problem = await bookTime(thread, parsed.data.duration, now, undefined);
    // The mail has gone. A time problem is worth saying, not worth pretending
    // the reply failed over.
    if (problem) warning = `Sent, but the time wasn't logged: ${problem}`;
  }

  refresh();
  return warning ? { ok: true, message: warning } : { ok: true };
}

export async function markMailDoneAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");

  let context;
  try {
    context = await ownThread(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "You can't change that." };
  }

  const duration = String(formData.get("duration") ?? "").trim();
  if (formData.get("logTime") === "on" && duration) {
    const problem = await bookTime(context.thread, duration, new Date(), undefined);
    if (problem) return { error: problem };
  }

  await db.mailThread.update({ where: { id }, data: { status: "DONE" } });
  refresh();
  return { ok: true };
}

export async function reopenMailAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  try {
    await ownThread(id);
  } catch {
    return;
  }
  await db.mailThread.update({ where: { id }, data: { status: "OPEN" } });
  refresh();
}
