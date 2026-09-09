import "server-only";
import { db } from "@/lib/db";
import { addDays, today, weekStart } from "@/lib/dates";
import { postMessage, slackConfigured } from "@/lib/slack/client";
import {
  buildDailyDigest,
  type DigestProject,
  type DigestTask,
} from "@/lib/slack/digest";

/** Where links in Slack messages point. Railway sets the domain for us. */
export function appUrl(): string {
  const explicit = process.env.APP_URL?.replace(/\/+$/, "");
  if (explicit) return explicit;
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN;
  return railway ? `https://${railway}` : "http://localhost:3000";
}

export interface DigestOutcome {
  sent: number;
  skipped: number;
  failed: { name: string; error: string }[];
  /** People with no Slack id yet — the actionable half of "nothing happened". */
  unlinked: string[];
}

const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] || name;

/**
 * The last working day before `d` — Friday when `d` is a Monday. Asking someone
 * on Monday why they logged nothing "yesterday" is asking about their Sunday.
 */
const longWeekday = (d: Date) =>
  d.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long" });

function lastWorkingDay(d: Date): Date {
  let back = addDays(d, -1);
  while (back.getUTCDay() === 0 || back.getUTCDay() === 6) back = addDays(back, -1);
  return back;
}

/**
 * The daily 5am brief: what's due, what's overdue, and whether yesterday's
 * time got logged. One message, every working morning.
 */
export async function sendDailyDigests(): Promise<DigestOutcome> {
  const now = today();
  const weekAhead = now.getUTCDay() === 1; // Monday widens to the whole week
  const weekFrom = weekStart(now);
  const weekEnd = addDays(weekFrom, 6);
  const previous = lastWorkingDay(now);

  const people = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slackUserId: true },
    orderBy: { name: "asc" },
  });
  const ids = people.map((p) => p.id);

  const [tasks, owned, entries] = await Promise.all([
    db.task.findMany({
      where: {
        status: { not: "DONE" },
        assigneeId: { in: ids },
        dueDate: { not: null, lte: weekEnd },
        project: { status: { in: ["ACTIVE", "ON_HOLD"] } },
      },
      select: {
        name: true,
        dueDate: true,
        assigneeId: true,
        project: { select: { name: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
    db.project.findMany({
      where: { status: { in: ["ACTIVE", "ON_HOLD"] }, ownerId: { in: ids } },
      select: {
        name: true,
        ownerId: true,
        statusUpdates: {
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: { health: true },
        },
        _count: { select: { tasks: { where: { status: { not: "DONE" } } } } },
      },
    }),
    db.timeEntry.findMany({
      where: { userId: { in: ids }, date: { gte: weekFrom, lte: weekEnd } },
      select: { userId: true, minutes: true, date: true },
    }),
  ]);

  const outcome: DigestOutcome = { sent: 0, skipped: 0, failed: [], unlinked: [] };

  for (const person of people) {
    const mine = tasks.filter((t) => t.assigneeId === person.id);
    const overdue: DigestTask[] = [];
    const dueToday: DigestTask[] = [];
    const dueLater: DigestTask[] = [];

    for (const t of mine) {
      const row: DigestTask = {
        name: t.name,
        projectName: t.project.name,
        dueDate: t.dueDate,
        overdue: Boolean(t.dueDate && t.dueDate < now),
      };
      if (row.overdue) overdue.push(row);
      else if (t.dueDate && t.dueDate.getTime() === now.getTime()) dueToday.push(row);
      else dueLater.push(row);
    }

    const attention: DigestProject[] = owned
      .filter((p) => {
        if (p.ownerId !== person.id) return false;
        const health = p.statusUpdates[0]?.health;
        return health === "AT_RISK" || health === "OFF_TRACK";
      })
      .map((p) => ({
        name: p.name,
        health: p.statusUpdates[0]?.health ?? null,
        openTasks: p._count.tasks,
      }));

    const theirs = entries.filter((e) => e.userId === person.id);
    const lastWorkedMinutes = theirs
      .filter((e) => e.date.getTime() === previous.getTime())
      .reduce((sum, e) => sum + e.minutes, 0);
    const weekMinutes = theirs.reduce((sum, e) => sum + e.minutes, 0);

    // Quiet when there's genuinely nothing: no work due, nothing overdue, no
    // project of theirs in trouble, and their time is already up to date. A
    // 5am message that says "all clear" every day gets muted within a week.
    const nothingDue =
      overdue.length === 0 &&
      dueToday.length === 0 &&
      (!weekAhead || dueLater.length === 0);
    if (nothingDue && attention.length === 0 && lastWorkedMinutes > 0) {
      outcome.skipped += 1;
      continue;
    }

    if (!person.slackUserId) {
      outcome.unlinked.push(person.name);
      continue;
    }

    const msg = buildDailyDigest({
      firstName: firstNameOf(person.name),
      weekAhead,
      overdue,
      dueToday,
      dueLater,
      ownedNeedingAttention: attention,
      lastWorkedMinutes,
      lastWorkedLabel: longWeekday(previous),
      weekMinutes,
      appUrl: appUrl(),
    });

    const r = await postMessage(person.slackUserId, msg.text, msg.blocks);
    if (r.ok) outcome.sent += 1;
    else outcome.failed.push({ name: person.name, error: r.error ?? "unknown" });
  }

  return outcome;
}

/** Fire-and-forget: a Slack outage must never fail the action that triggered it. */
export async function tryPost(channel: string | null, text: string, blocks?: unknown[]) {
  if (!channel || !slackConfigured()) return;
  try {
    await postMessage(channel, text, blocks);
  } catch {
    // Deliberately swallowed. The status update is already saved.
  }
}
