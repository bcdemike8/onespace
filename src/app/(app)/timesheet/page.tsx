import Link from "next/link";
import { requireUser, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  addDays,
  dayStart,
  formatMedium,
  formatWeekday,
  formatShort,
  toISODate,
  today,
  weekStart,
} from "@/lib/dates";
import { formatHours } from "@/lib/format";
import { PageHeader, Stat } from "@/components/ui";
import {
  TimesheetGrid,
  type PickerProject,
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

  const [entries, openTasks, projects, people] = await Promise.all([
    db.timeEntry.findMany({
      where: { userId: subject.id, date: { gte: from, lte: to } },
      select: {
        minutes: true,
        date: true,
        taskId: true,
        projectId: true,
        task: { select: { name: true } },
        project: {
          select: { id: true, name: true, client: { select: { name: true } } },
        },
      },
    }),
    // Open tasks assigned to this person get a row even with no time yet, so
    // the week starts pre-filled with what they're supposed to be doing.
    db.task.findMany({
      where: {
        assigneeId: subject.id,
        status: { not: "DONE" },
        project: { status: { in: ["ACTIVE", "ON_HOLD"] } },
      },
      select: {
        id: true,
        name: true,
        project: {
          select: { id: true, name: true, client: { select: { name: true } } },
        },
      },
      orderBy: [{ dueDate: "asc" }],
      take: 60,
    }),
    db.project.findMany({
      where: { status: { in: ["ACTIVE", "ON_HOLD"] } },
      select: {
        id: true,
        name: true,
        client: { select: { name: true } },
        tasks: {
          where: { status: { not: "DONE" } },
          select: { id: true, name: true },
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    admin
      ? db.user.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const rowMap = new Map<string, TimesheetRow>();

  const ensureRow = (
    key: string,
    seed: Omit<TimesheetRow, "key" | "minutes">,
  ): TimesheetRow => {
    let row = rowMap.get(key);
    if (!row) {
      row = { key, minutes: {}, ...seed };
      rowMap.set(key, row);
    }
    return row;
  };

  for (const task of openTasks) {
    ensureRow(`${task.project.id}|${task.id}`, {
      projectId: task.project.id,
      taskId: task.id,
      projectName: task.project.name,
      clientName: task.project.client?.name ?? null,
      taskName: task.name,
    });
  }

  for (const entry of entries) {
    const row = ensureRow(`${entry.projectId}|${entry.taskId ?? ""}`, {
      projectId: entry.projectId,
      taskId: entry.taskId,
      projectName: entry.project.name,
      clientName: entry.project.client?.name ?? null,
      taskName: entry.task?.name ?? "General project time",
    });
    const iso = toISODate(entry.date);
    row.minutes[iso] = (row.minutes[iso] ?? 0) + entry.minutes;
  }

  const rows = [...rowMap.values()].sort(
    (a, b) =>
      a.projectName.localeCompare(b.projectName) ||
      a.taskName.localeCompare(b.taskName),
  );

  const nowDay = today();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(from, i);
    return {
      iso: toISODate(date),
      weekday: formatWeekday(date),
      label: formatShort(date),
      isToday: date.getTime() === nowDay.getTime(),
    };
  });

  const pickerProjects: PickerProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    clientName: p.client?.name ?? null,
    tasks: p.tasks,
  }));

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
            : "Fill in the week. Every cell saves as you go."
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
        <div className="grid flex-1 gap-3 sm:max-w-md sm:grid-cols-2">
          <Stat
            label="Week"
            value={`${formatMedium(from)}`}
            hint={`through ${formatMedium(to)}`}
          />
          <Stat label="Total logged" value={`${formatHours(weekMinutes)}h`} />
        </div>

        {admin && people.length > 1 ? (
          <form className="w-full sm:w-56">
            <label className="label" htmlFor="person">
              Viewing
            </label>
            <input type="hidden" name="week" value={toISODate(from)} />
            <select
              id="person"
              name="person"
              defaultValue={subject.id}
              className="input"
            >
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

      <TimesheetGrid
        rows={rows}
        days={days}
        projects={pickerProjects}
        readOnly={readOnly}
      />
    </div>
  );
}
