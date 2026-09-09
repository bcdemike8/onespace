import "server-only";
import { db } from "@/lib/db";
import { addDays, formatWeekday, today, weekStart } from "@/lib/dates";
import { postMessage, slackConfigured } from "@/lib/slack/client";
import {
  buildFridayDigest,
  buildMondayDigest,
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
 * Monday: what's on your plate. Overdue first, because that's the part people
 * have actually lost track of.
 */
export async function sendMondayDigests(): Promise<DigestOutcome> {
  const now = today();
  const weekEnd = addDays(weekStart(now), 6);

  const people = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slackUserId: true },
    orderBy: { name: "asc" },
  });

  const [tasks, owned] = await Promise.all([
    db.task.findMany({
      where: {
        status: { not: "DONE" },
        assigneeId: { in: people.map((p) => p.id) },
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
      where: { status: { in: ["ACTIVE", "ON_HOLD"] }, ownerId: { not: null } },
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
  ]);

  const outcome: DigestOutcome = { sent: 0, skipped: 0, failed: [], unlinked: [] };

  for (const person of people) {
    const mine = tasks.filter((t) => t.assigneeId === person.id);
    const overdue: DigestTask[] = [];
    const dueThisWeek: DigestTask[] = [];
    for (const t of mine) {
      const row: DigestTask = {
        name: t.name,
        projectName: t.project.name,
        dueDate: t.dueDate,
        overdue: Boolean(t.dueDate && t.dueDate < now),
      };
      (row.overdue ? overdue : dueThisWeek).push(row);
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

    // Nothing to say is a reason not to speak. A weekly "you have 0 tasks" is
    // how a useful nudge turns into noise people mute.
    if (overdue.length === 0 && dueThisWeek.length === 0 && attention.length === 0) {
      outcome.skipped += 1;
      continue;
    }
    if (!person.slackUserId) {
      outcome.unlinked.push(person.name);
      continue;
    }

    const msg = buildMondayDigest({
      firstName: firstNameOf(person.name),
      overdue,
      dueThisWeek,
      ownedNeedingAttention: attention,
      appUrl: appUrl(),
    });
    const r = await postMessage(person.slackUserId, msg.text, msg.blocks);
    if (r.ok) outcome.sent += 1;
    else outcome.failed.push({ name: person.name, error: r.error ?? "unknown" });
  }

  return outcome;
}

/**
 * Friday: what you logged. This one always goes out, including at zero — an
 * empty week is exactly the case worth flagging before the month closes.
 */
export async function sendFridayDigests(): Promise<DigestOutcome> {
  const now = today();
  const from = weekStart(now);
  const to = addDays(from, 6);

  const people = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slackUserId: true },
    orderBy: { name: "asc" },
  });

  const entries = await db.timeEntry.findMany({
    where: { date: { gte: from, lte: to }, userId: { in: people.map((p) => p.id) } },
    select: {
      userId: true,
      minutes: true,
      date: true,
      project: { select: { name: true } },
    },
  });

  const outcome: DigestOutcome = { sent: 0, skipped: 0, failed: [], unlinked: [] };

  // Only weekdays up to today: nobody needs telling they haven't logged Sunday.
  const workdaysSoFar: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const d = addDays(from, i);
    if (d <= now) workdaysSoFar.push(d);
  }

  for (const person of people) {
    const mine = entries.filter((e) => e.userId === person.id);

    const byProjectMap = new Map<string, number>();
    const byDay = new Set<number>();
    let totalMinutes = 0;
    for (const e of mine) {
      byProjectMap.set(
        e.project.name,
        (byProjectMap.get(e.project.name) ?? 0) + e.minutes,
      );
      byDay.add(e.date.getTime());
      totalMinutes += e.minutes;
    }

    if (!person.slackUserId) {
      outcome.unlinked.push(person.name);
      continue;
    }

    const msg = buildFridayDigest({
      firstName: firstNameOf(person.name),
      byProject: [...byProjectMap.entries()]
        .map(([name, minutes]) => ({ name, minutes }))
        .sort((a, b) => b.minutes - a.minutes),
      totalMinutes,
      emptyDays: workdaysSoFar
        .filter((d) => !byDay.has(d.getTime()))
        .map((d) => formatWeekday(d)),
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
