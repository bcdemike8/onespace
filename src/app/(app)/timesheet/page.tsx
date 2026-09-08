import Link from "next/link";
import { requireUser, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  addDays,
  dayStart,
  formatMedium,
  formatShort,
  formatWeekday,
  toISODate,
  today,
  weekStart,
} from "@/lib/dates";
import { formatHours } from "@/lib/format";
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
  searchParams: Promise<{ week?: string; person?: string }>;
}) {
  const viewer = await requireUser();
  const params = await searchParams;

  const anchor = params.week ? dayStart(params.week) : today();
  const from = weekStart(anchor);
  const to = addDays(from, 6);

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

    const row =
      forProject.get(key) ??
      ({
        key: `${entry.projectId}|${key}`,
        taskId: entry.taskId,
        taskName: entry.task?.name ?? "General project time",
        minutes: {},
      } satisfies TimesheetRow);

    const iso = toISODate(entry.date);
    row.minutes[iso] = (row.minutes[iso] ?? 0) + entry.minutes;
    forProject.set(key, row);
    rowsByProject.set(entry.projectId, forProject);
  }

  const grid: TimesheetProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    clientName: p.client?.name ?? null,
    reason: reasons.get(p.id) ?? "on your sheet",
    openTasks: p.tasks,
    rows: [...(rowsByProject.get(p.id)?.values() ?? [])].sort((a, b) =>
      a.taskName.localeCompare(b.taskName),
    ),
  }));

  // Projects with time on them come first — that's where the work is.
  grid.sort((a, b) => {
    const aHas = a.rows.length > 0 ? 0 : 1;
    const bHas = b.rows.length > 0 ? 0 : 1;
    return aHas - bHas || a.name.localeCompare(b.name);
  });

  const nowDay = today();
  const days: Day[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(from, i);
    return {
      iso: toISODate(date),
      weekday: formatWeekday(date),
      label: formatShort(date),
      isToday: date.getTime() === nowDay.getTime(),
    };
  });

  const weekMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);
  const prevWeek = toISODate(addDays(from, -7));
  const nextWeek = toISODate(addDays(from, 7));
  const personQuery = readOnly ? `&person=${subject.id}` : "";

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
              href={`/timesheet?week=${prevWeek}${personQuery}`}
              className="btn-secondary btn-sm"
              aria-label="Previous week"
            >
              ←
            </Link>
            <Link
              href={`/timesheet${readOnly ? `?person=${subject.id}` : ""}`}
              className="btn-secondary btn-sm"
            >
              This week
            </Link>
            <Link
              href={`/timesheet?week=${nextWeek}${personQuery}`}
              className="btn-secondary btn-sm"
              aria-label="Next week"
            >
              →
            </Link>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="grid flex-1 gap-3 sm:max-w-lg sm:grid-cols-3">
          <Stat
            label="Week"
            value={formatMedium(from)}
            hint={`through ${formatMedium(to)}`}
          />
          <Stat label="Total logged" value={`${formatHours(weekMinutes)}h`} />
          <Stat
            label="Your projects"
            value={grid.length}
            hint={`${grid.filter((p) => p.rows.length > 0).length} with time this week`}
          />
        </div>

        {admin && people.length > 1 ? (
          <form className="w-full sm:w-56">
            <label className="label" htmlFor="person">
              Viewing
            </label>
            <input type="hidden" name="week" value={toISODate(from)} />
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

      <TimesheetGrid projects={grid} days={days} readOnly={readOnly} />
    </div>
  );
}
