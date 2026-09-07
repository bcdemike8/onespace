import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  addDays,
  formatMedium,
  toISODate,
  today,
  weekEnd,
  weekStart,
} from "@/lib/dates";
import { formatHours, formatMoney } from "@/lib/format";
import { PageHeader, Stat, EmptyState } from "@/components/ui";
import { LogTimeForm, type LoggableProject } from "@/components/LogTimeForm";
import { TaskListItem, type TaskListItemData } from "@/components/TaskListItem";
import { deleteTimeEntryAction } from "@/app/actions/time";

export const dynamic = "force-dynamic";

/** Buckets that answer "what should I do next?" without any thinking. */
function bucketTasks(tasks: TaskListItemData[]) {
  const now = today();
  const endOfWeek = weekEnd(now);

  const overdue: TaskListItemData[] = [];
  const dueToday: TaskListItemData[] = [];
  const thisWeek: TaskListItemData[] = [];
  const later: TaskListItemData[] = [];

  for (const task of tasks) {
    if (!task.dueDate) later.push(task);
    else if (task.dueDate < now) overdue.push(task);
    else if (task.dueDate.getTime() === now.getTime()) dueToday.push(task);
    else if (task.dueDate <= endOfWeek) thisWeek.push(task);
    else later.push(task);
  }

  return [
    { title: "Overdue", tasks: overdue, tone: "bad" as const },
    { title: "Due today", tasks: dueToday, tone: "warn" as const },
    { title: "Rest of this week", tasks: thisWeek, tone: "default" as const },
    { title: "Later", tasks: later, tone: "default" as const },
  ].filter((g) => g.tasks.length > 0);
}

export default async function MyWorkPage() {
  const user = await requireUser();
  const now = today();
  const weekFrom = weekStart(now);
  const weekTo = weekEnd(now);

  const [openTasks, weekEntries, todayEntries, recentEntries, projects, timer] =
    await Promise.all([
      db.task.findMany({
        where: { assigneeId: user.id, status: { not: "DONE" } },
        select: {
          id: true,
          name: true,
          status: true,
          dueDate: true,
          estimatedHours: true,
          project: {
            select: { id: true, name: true, client: { select: { name: true } } },
          },
        },
        orderBy: [{ dueDate: "asc" }, { orderIndex: "asc" }],
        take: 200,
      }),
      db.timeEntry.aggregate({
        where: { userId: user.id, date: { gte: weekFrom, lte: weekTo } },
        _sum: { minutes: true },
      }),
      db.timeEntry.aggregate({
        where: { userId: user.id, date: now },
        _sum: { minutes: true },
      }),
      db.timeEntry.findMany({
        where: { userId: user.id, date: { gte: addDays(now, -13) } },
        select: {
          id: true,
          date: true,
          minutes: true,
          notes: true,
          billable: true,
          billRateCents: true,
          task: { select: { name: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 12,
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
      db.runningTimer.findUnique({ where: { userId: user.id } }),
    ]);

  const loggedByTask = await db.timeEntry.groupBy({
    by: ["taskId"],
    where: { taskId: { in: openTasks.map((t) => t.id) } },
    _sum: { minutes: true },
  });
  const minutesByTask = new Map(
    loggedByTask.map((r) => [r.taskId, r._sum.minutes ?? 0]),
  );

  const tasks: TaskListItemData[] = openTasks.map((t) => ({
    id: t.id,
    name: t.name,
    status: t.status,
    dueDate: t.dueDate,
    estimatedHours: t.estimatedHours,
    loggedMinutes: minutesByTask.get(t.id) ?? 0,
    projectId: t.project.id,
    projectName: t.project.name,
    clientName: t.project.client?.name ?? null,
    assigneeName: null,
  }));

  const groups = bucketTasks(tasks);
  const overdueCount = groups.find((g) => g.title === "Overdue")?.tasks.length ?? 0;

  const loggableProjects: LoggableProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    clientName: p.client?.name ?? null,
    tasks: p.tasks,
  }));

  return (
    <div>
      <PageHeader
        title={`Hi ${user.name.split(" ")[0]}`}
        subtitle={`Week of ${formatMedium(weekFrom)} — ${tasks.length} open ${
          tasks.length === 1 ? "task" : "tasks"
        } assigned to you.`}
        actions={
          <Link href="/timesheet" className="btn-secondary">
            Open timesheet
          </Link>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat
          label="Logged today"
          value={`${formatHours(todayEntries._sum.minutes ?? 0)}h`}
        />
        <Stat
          label="Logged this week"
          value={`${formatHours(weekEntries._sum.minutes ?? 0)}h`}
          hint={`${formatMedium(weekFrom)} – ${formatMedium(weekTo)}`}
        />
        <Stat
          label="Overdue tasks"
          value={overdueCount}
          tone={overdueCount > 0 ? "bad" : "good"}
          hint={overdueCount === 0 ? "Nothing behind schedule." : "Needs attention"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
            My tasks
          </h2>

          {groups.length === 0 ? (
            <EmptyState
              title="Nothing assigned to you right now."
              body="Tasks assigned to you across every project show up here, sorted by what's due first."
              action={{ href: "/projects", label: "Browse projects" }}
            />
          ) : (
            <div className="space-y-5">
              {groups.map((group) => (
                <section key={group.title} className="card overflow-hidden">
                  <div className="flex items-center justify-between border-b border-ink-200 bg-ink-50 px-4 py-2">
                    <h3
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        group.tone === "bad"
                          ? "text-bad-700"
                          : group.tone === "warn"
                            ? "text-warn-700"
                            : "text-ink-600"
                      }`}
                    >
                      {group.title}
                    </h3>
                    <span className="text-xs text-ink-500 tnum">
                      {group.tasks.length}
                    </span>
                  </div>
                  <ul className="divide-y divide-ink-100">
                    {group.tasks.map((task) => (
                      <TaskListItem
                        key={task.id}
                        task={task}
                        timerRunning={Boolean(timer)}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">Log time</h2>
            <LogTimeForm
              projects={loggableProjects}
              defaultDate={toISODate(now)}
              compact
            />
          </section>

          <section className="card overflow-hidden">
            <h2 className="border-b border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-900">
              Recent entries
            </h2>
            {recentEntries.length === 0 ? (
              <p className="px-4 py-6 text-sm text-ink-500">
                Nothing logged in the last two weeks.
              </p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {recentEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start gap-2 px-4 py-2.5 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-ink-800">
                        {entry.task?.name ?? entry.project.name}
                      </div>
                      <div className="truncate text-xs text-ink-500">
                        {formatMedium(entry.date)} · {entry.project.name}
                        {entry.notes ? ` · ${entry.notes}` : ""}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-medium tnum text-ink-900">
                        {formatHours(entry.minutes)}h
                      </div>
                      {entry.billable && entry.billRateCents > 0 ? (
                        <div className="text-xs tnum text-ink-500">
                          {formatMoney(
                            Math.round((entry.minutes * entry.billRateCents) / 60),
                          )}
                        </div>
                      ) : null}
                    </div>
                    <form action={deleteTimeEntryAction} className="shrink-0">
                      <input type="hidden" name="id" value={entry.id} />
                      <button
                        type="submit"
                        aria-label="Delete entry"
                        className="px-1 text-ink-400 hover:text-bad-700"
                      >
                        ×
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
