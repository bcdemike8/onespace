import { db } from "@/lib/db";
import { dayInZone, toISODate } from "@/lib/dates";
import { formatDuration } from "@/lib/format";

/**
 * Time on the timesheet that isn't any meeting's own entry, by person and
 * day: "1h Acme Retainer · 30m Internal". Returns a lookup for a call's
 * owner and start, null when that day has nothing.
 */
export async function timesheetOnDay(
  calls: { userId: string; startsAt: Date }[],
  zone: string,
): Promise<(userId: string, startsAt: Date) => string | null> {
  const key = (userId: string, day: Date) => `${userId}|${toISODate(day)}`;
  if (calls.length === 0) return () => null;

  const userIds = [...new Set(calls.map((c) => c.userId))];
  const days = [
    ...new Map(
      calls.map((c) => {
        const day = dayInZone(c.startsAt, zone);
        return [toISODate(day), day] as const;
      }),
    ).values(),
  ];

  const entries = await db.timeEntry.findMany({
    where: { userId: { in: userIds }, date: { in: days }, meeting: { is: null } },
    select: { userId: true, date: true, minutes: true, project: { select: { name: true } } },
  });

  const byDay = new Map<string, Map<string, number>>();
  for (const e of entries) {
    const k = key(e.userId, e.date);
    const projects = byDay.get(k) ?? new Map<string, number>();
    projects.set(e.project.name, (projects.get(e.project.name) ?? 0) + e.minutes);
    byDay.set(k, projects);
  }

  return (userId, startsAt) => {
    const projects = byDay.get(key(userId, dayInZone(startsAt, zone)));
    if (!projects) return null;
    return [...projects]
      .sort((a, b) => b[1] - a[1])
      .map(([name, minutes]) => `${formatDuration(minutes)} ${name}`)
      .join(" · ");
  };
}
