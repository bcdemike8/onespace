import Link from "next/link";
import { requireUser, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  addDays,
  dayStart,
  formatRange,
  formatShort,
  formatWeekday,
  toISODate,
  today,
  weekStart,
} from "@/lib/dates";
import { formatHours, formatMoney } from "@/lib/format";
import {
  TIMESHEET_PERIODS,
  billableSplit,
  parsePeriod,
  periodLabel,
  periodRange,
  summarize,
} from "@/lib/timesheet-period";
import { getLockState } from "@/lib/lock";
import { isLocked, lockSummary } from "@/lib/periods";
import { PeriodLockNotice } from "@/components/PeriodLockNotice";
import { PageHeader, Stat } from "@/components/ui";
import {
  TimesheetGrid,
  type Day,
  type TimesheetProject,
  type TimesheetRow,
} from "@/components/TimesheetGrid";

export const dynamic = "force-dynamic";

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; person?: string; period?: string }>;
}) {
  const viewer = await requireUser();
  const params = await searchParams;

  const anchor = params.week ? dayStart(params.week) : today();
  const from = weekStart(anchor);
  const to = addDays(from, 6);

  // The grid is always a week. The figures above it are not: at month end
  // the question is what September came to, and answering it used to mean
  // leaving for Reports and rebuilding a filter.
  const period = parsePeriod(params.period);
  const span = periodRange(period, from, to, today());

  // Admins can look at (but not edit) anyone's week.
  const admin = isAdmin(viewer);
  const subjectId = admin && params.person ? params.person : viewer.id;
  const subject =
    subjectId === viewer.id
      ? viewer
      : ((await db.user.findUnique({ where: { id: subjectId } })) ?? viewer);
  const readOnly = subject.id !== viewer.id;

  const [entries, ownedProjects, assignedTaskProjects, people] = await Promise.all([
    db.timeEntry.findMany({
      where: { userId: subject.id, date: { gte: from, lte: to } },
      select: {
        minutes: true,
        date: true,
        taskId: true,
        projectId: true,
        source: true,
        task: { select: { name: true } },
      },
    }),
    // Everything this person is on: what they own...
    db.project.findMany({
      where: { ownerId: subject.id, status: { in: ["ACTIVE", "ON_HOLD"] } },
      select: { id: true },
    }),
    // ...and anywhere they hold unfinished work.
    db.task.findMany({
      where: {
        assigneeId: subject.id,
        status: { not: "DONE" },
        project: { status: { in: ["ACTIVE", "ON_HOLD"] } },
      },
      select: { projectId: true },
      distinct: ["projectId"],
    }),
    admin
      ? db.user.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  // Why each project is on the sheet, so the header can say so.
  const reasons = new Map<string, string>();
  for (const p of ownedProjects) reasons.set(p.id, "you own this");
  for (const t of assignedTaskProjects) {
    if (!reasons.has(t.projectId)) reasons.set(t.projectId, "assigned to you");
  }
  for (const e of entries) {
    if (!reasons.has(e.projectId)) reasons.set(e.projectId, "logged this week");
  }

  const projectIds = [...reasons.keys()];

  // Lifetime hours per project for this person, so the sheet carries the
  // history alongside the week. The imported Everhour months sit on the 1st
  // of each month, so they'd otherwise only surface in nine specific weeks.
  const lifetime = await db.timeEntry.groupBy({
    by: ["projectId"],
    where: { userId: subject.id, projectId: { in: projectIds } },
    _sum: { minutes: true },
  });
  const lifetimeBy = new Map(lifetime.map((r) => [r.projectId, r._sum.minutes ?? 0]));

  const allTime = await db.timeEntry.aggregate({
    where: { userId: subject.id },
    _sum: { minutes: true },
  });

  // Rates come off the entry, not off the project or the person: an entry
  // stores what the work was worth on the day it was logged, so a rate rise
  // in October doesn't quietly rewrite what August earned.
  const periodTotals = summarize(
    await db.timeEntry.findMany({
      where: { userId: subject.id, date: { gte: span.from, lte: span.to } },
      select: {
        minutes: true,
        billable: true,
        billRateCents: true,
        projectId: true,
      },
    }),
  );

  const projects = await db.project.findMany({
    where: { id: { in: projectIds } },
    select: {
      id: true,
      name: true,
      client: { select: { name: true } },
      tasks: {
        where: { status: { not: "DONE" } },
        select: { id: true, name: true },
        orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  // Rows are only the tasks with time on them this week; the picker covers
  // the rest, which keeps a 30-project sheet readable.
  const rowsByProject = new Map<string, Map<string, TimesheetRow>>();
  for (const entry of entries) {
    const key = entry.taskId ?? "";
    const forProject =
      rowsByProject.get(entry.projectId) ?? new Map<string, TimesheetRow>();

    const row: TimesheetRow =
      forProject.get(key) ?? {
        key: `${entry.projectId}|${key}`,
        taskId: entry.taskId,
        taskName: entry.task?.name ?? "General project time",
        minutes: {},
        locked: {},
      };

    // Only what the grid itself wrote is editable in it; everything else is
    // shown but held read-only.
    const bucket = entry.source === "TIMESHEET" ? row.minutes : row.locked;
    const iso = toISODate(entry.date);
    bucket[iso] = (bucket[iso] ?? 0) + entry.minutes;
    forProject.set(key, row);
    rowsByProject.set(entry.projectId, forProject);
  }

  const grid: TimesheetProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    clientName: p.client?.name ?? null,
    reason: reasons.get(p.id) ?? "on your sheet",
    toDateMinutes: lifetimeBy.get(p.id) ?? 0,
    openTasks: p.tasks,
    rows: [...(rowsByProject.get(p.id)?.values() ?? [])].sort((a, b) =>
      a.taskName.localeCompare(b.taskName),
    ),
  }));

  // Projects with time on them come first — that's where the work is.
  grid.sort((a, b) => {
    const aHas = a.rows.length > 0 ? 0 : 1;
    const bHas = b.rows.length > 0 ? 0 : 1;
    return (
      aHas - bHas ||
      b.toDateMinutes - a.toDateMinutes ||
      a.name.localeCompare(b.name)
    );
  });

  const nowDay = today();
  const lockState = await getLockState();
  const days: Day[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(from, i);
    return {
      iso: toISODate(date),
      weekday: formatWeekday(date),
      label: formatShort(date),
      isToday: date.getTime() === nowDay.getTime(),
      closed: isLocked(date, lockState),
    };
  });
  const anyClosed = days.some((d) => d.closed);

  const prevWeek = toISODate(addDays(from, -7));
  const nextWeek = toISODate(addDays(from, 7));
  const personQuery = readOnly ? `&person=${subject.id}` : "";
  const periodQuery = period === "week" ? "" : `&period=${period}`;

  return (
    <div>
      <PageHeader
        title="Timesheet"
        subtitle={
          readOnly
            ? `Viewing ${subject.name}'s week — read only.`
            : "Every project you're on. Pick a task and fill in the week."
        }
        actions={
          <div className="flex items-center gap-1.5">
            <Link
              href={`/timesheet?week=${prevWeek}${periodQuery}${personQuery}`}
              className="btn-secondary btn-sm"
              aria-label="Previous week"
            >
              ←
            </Link>
            <Link
              href={`/timesheet?period=${period}${personQuery}`}
              className="btn-secondary btn-sm"
            >
              This week
            </Link>
            <Link
              href={`/timesheet?week=${nextWeek}${periodQuery}${personQuery}`}
              className="btn-secondary btn-sm"
              aria-label="Next week"
            >
              →
            </Link>
            <Link
              href={`/reports?preset=this_year&group=project&granularity=month&people=${subject.id}`}
              className="btn-secondary btn-sm"
            >
              Full history
            </Link>
          </div>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {TIMESHEET_PERIODS.map((p) => {
          const on = p.value === period;
          return (
            <Link
              key={p.value}
              href={`/timesheet?week=${toISODate(from)}&period=${p.value}${personQuery}`}
              aria-current={on ? "true" : undefined}
              className={on ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
            >
              {p.label}
            </Link>
          );
        })}
        <span className="text-sm text-ink-500">{periodLabel(period, span.from, span.to)}</span>
      </div>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-4xl lg:grid-cols-4">
          <Stat
            label="Hours logged"
            value={`${formatHours(periodTotals.minutes)}h`}
            hint={periodLabel(period, span.from, span.to)}
          />
          <Stat
            label="Billable value"
            value={formatMoney(periodTotals.billableCents)}
            hint={billableSplit(periodTotals)}
          />
          <Stat
            label={readOnly ? "Their projects" : "Your projects"}
            value={grid.length}
            hint={`${periodTotals.projectCount} with time in ${periodLabel(
              period,
              span.from,
              span.to,
            )}`}
          />
          <Stat
            label="Logged all time"
            value={`${formatHours(allTime._sum.minutes ?? 0)}h`}
            hint="Everything on record, imports included"
          />
        </div>

        {admin && people.length > 1 ? (
          <form className="w-full sm:w-56">
            <label className="label" htmlFor="person">
              Viewing
            </label>
            <input type="hidden" name="week" value={toISODate(from)} />
            <input type="hidden" name="period" value={period} />
            <select id="person" name="person" defaultValue={subject.id} className="input">
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id === viewer.id ? `${p.name} (you)` : p.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-secondary btn-sm mt-2 w-full">
              View week
            </button>
          </form>
        ) : null}
      </div>

      {anyClosed || lockState.reopenedFrom ? (
        <PeriodLockNotice
          summary={lockSummary(nowDay, lockState)}
          admin={admin}
          reopenedFrom={
            lockState.reopenedFrom ? toISODate(lockState.reopenedFrom) : null
          }
        />
      ) : null}

      <h2 className="mb-2 text-sm font-semibold text-ink-900">
        Week of {formatRange(from, to)}
        {period === "week" ? null : (
          <span className="ml-2 font-normal text-ink-500">
            — the figures above cover {periodLabel(period, span.from, span.to)}
          </span>
        )}
      </h2>

      <TimesheetGrid projects={grid} days={days} readOnly={readOnly} />
    </div>
  );
}
