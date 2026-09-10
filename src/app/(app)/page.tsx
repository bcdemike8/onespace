import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  DAY_MS,
  addDays,
  dayStart,
  formatMedium,
  relativeDueLabel,
  toISODate,
  today,
  weekEnd,
  weekStart,
} from "@/lib/dates";
import { formatHours, formatMoney, pct } from "@/lib/format";
import { getLockState } from "@/lib/lock";
import { isLocked } from "@/lib/periods";
import {
  EmptyState,
  PageHeader,
  ProgressBar,
  ProjectStatusChip,
  Stat,
} from "@/components/ui";
import { LogTimeForm, type LoggableProject } from "@/components/LogTimeForm";
import { TaskListItem, type TaskListItemData } from "@/components/TaskListItem";
import { deleteTimeEntryAction } from "@/app/actions/time";
import { DayQueue, type QueueCommitment, type QueueProject } from "./DayQueue";

export const dynamic = "force-dynamic";

/**
 * The three horizons a consultant actually plans in: today, the next few
 * days, the rest of the week.
 *
 * Rolling windows rather than calendar weeks. "The next seven days" is what
 * somebody means on a Thursday; "the rest of this week" on a Thursday is a
 * day and a half and hides everything that matters. Overdue rides with today
 * because that is when it needs doing.
 */
function bucketTasks(tasks: TaskListItemData[], now = today()) {
  const inThree = addDays(now, 3);
  const inSeven = addDays(now, 7);

  const todayOrLate: TaskListItemData[] = [];
  const soon: TaskListItemData[] = [];
  const thisWeek: TaskListItemData[] = [];
  const later: TaskListItemData[] = [];
  const undated: TaskListItemData[] = [];

  for (const task of tasks) {
    if (!task.dueDate) undated.push(task);
    else if (task.dueDate <= now) todayOrLate.push(task);
    else if (task.dueDate <= inThree) soon.push(task);
    else if (task.dueDate <= inSeven) thisWeek.push(task);
    else later.push(task);
  }

  return [
    { title: "Today", tasks: todayOrLate, tone: "warn" as const },
    { title: "Next three days", tasks: soon, tone: "default" as const },
    { title: "Rest of the week", tasks: thisWeek, tone: "default" as const },
    { title: "After that", tasks: later, tone: "default" as const },
    { title: "No date on them", tasks: undated, tone: "default" as const },
  ].filter((g) => g.tasks.length > 0);
}

export default async function MyWorkPage() {
  const user = await requireUser();
  const now = today();
  const lockState = await getLockState();
  const weekFrom = weekStart(now);
  const weekTo = weekEnd(now);

  const [
    openTasks,
    weekEntries,
    todayEntries,
    recentEntries,
    projects,
    timer,
    ownedProjects,
    pendingCommitments,
    awaitingReply,
    meetingsToLog,
  ] = await Promise.all([
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
          billingType: true,
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
      // What this person is accountable for, as distinct from what's on their
      // own plate — a lead often owns work other people are doing.
      db.project.findMany({
        where: { ownerId: user.id, status: { in: ["ACTIVE", "ON_HOLD"] } },
        select: {
          id: true,
          name: true,
          status: true,
          dueDate: true,
          budgetHours: true,
          client: { select: { name: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: [{ dueDate: "asc" }, { name: "asc" }],
      }),
      // What the last fortnight of calls and recaps produced and nobody has
      // said yes or no to yet. Older than that and the moment has passed:
      // it either got done or it didn't, and a stale suggestion is noise.
      db.commitment.findMany({
        where: {
          status: "PENDING",
          createdAt: { gte: addDays(new Date(), -14) },
          OR: [
            { meeting: { userId: user.id } },
            { mailMessage: { thread: { userId: user.id } } },
          ],
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 30,
        select: {
          id: true,
          text: true,
          suggestedTask: true,
          speaker: true,
          source: true,
          dueDate: true,
          dueStated: true,
          meeting: {
            select: { id: true, title: true, startsAt: true, projectId: true },
          },
          mailMessage: {
            select: {
              sentAt: true,
              thread: { select: { id: true, subject: true, projectId: true } },
            },
          },
        },
      }),
      // Threads whose last word is the client's. The clearest kind of
      // overdue there is: somebody is waiting.
      db.mailThread.findMany({
        where: { userId: user.id, status: "OPEN", awaitingUs: true },
        orderBy: { lastMessageAt: "asc" },
        take: 8,
        select: {
          id: true,
          subject: true,
          lastFromName: true,
          lastFrom: true,
          lastMessageAt: true,
          client: { select: { name: true } },
        },
      }),
      // Meetings that happened and haven't been turned into time yet.
      db.meeting.count({
        where: { userId: user.id, status: "PENDING", startsAt: { lte: new Date() } },
      }),
    ]);

  const ownedIds = ownedProjects.map((p) => p.id);
  const [ownedMinutes, ownedOpen] = await Promise.all([
    db.timeEntry.groupBy({
      by: ["projectId"],
      where: { projectId: { in: ownedIds } },
      _sum: { minutes: true },
    }),
    db.task.groupBy({
      by: ["projectId"],
      where: { projectId: { in: ownedIds }, status: { not: "DONE" } },
      _count: { _all: true },
    }),
  ]);
  const ownedMinutesBy = new Map(
    ownedMinutes.map((r) => [r.projectId, r._sum.minutes ?? 0]),
  );
  const ownedOpenBy = new Map(ownedOpen.map((r) => [r.projectId, r._count._all]));

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

  const queue: QueueCommitment[] = pendingCommitments.map((c) => {
    const meeting = c.meeting;
    const mail = c.mailMessage;
    return {
      id: c.id,
      text: c.text,
      suggestedTask: c.suggestedTask,
      speaker: c.speaker,
      source: c.source,
      dueDate: c.dueDate ? toISODate(c.dueDate) : null,
      dueStated: c.dueStated,
      originLabel: meeting
        ? `${meeting.title} · ${formatMedium(dayStart(meeting.startsAt))}`
        : mail
          ? `${mail.thread.subject} · ${formatMedium(dayStart(mail.sentAt))}`
          : "Source removed",
      originHref: meeting ? "/meetings" : mail ? `/inbox/${mail.thread.id}` : null,
      projectId: meeting?.projectId ?? mail?.thread.projectId ?? null,
    };
  });

  const queueProjects: QueueProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    clientName: p.client?.name ?? null,
  }));

  const groups = bucketTasks(tasks, now);
  const overdueCount = tasks.filter((t) => t.dueDate && t.dueDate < now).length;

  const loggableProjects: LoggableProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    clientName: p.client?.name ?? null,
    billingType: p.billingType,
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
          <DayQueue items={queue} projects={queueProjects} />

          {awaitingReply.length > 0 ? (
            <section className="mb-6">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-600">
                  Waiting on your reply
                </h2>
                <span className="text-xs text-ink-500 tnum">
                  {awaitingReply.length}
                </span>
              </div>
              <ul className="card divide-y divide-ink-100">
                {awaitingReply.map((thread) => {
                  const waitingDays = Math.floor(
                    (now.getTime() - dayStart(thread.lastMessageAt).getTime()) / DAY_MS,
                  );
                  return (
                    <li key={thread.id} className="px-4 py-2.5">
                      <Link
                        href={`/inbox/${thread.id}`}
                        className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 hover:text-brand-700"
                      >
                        <span className="text-sm font-medium text-ink-900">
                          {thread.subject}
                        </span>
                        <span className="text-xs text-ink-500">
                          {thread.lastFromName || thread.lastFrom}
                          {thread.client ? ` · ${thread.client.name}` : ""}
                        </span>
                        <span
                          className={`ml-auto text-xs tnum ${
                            waitingDays >= 2 ? "font-medium text-warn-700" : "text-ink-500"
                          }`}
                        >
                          {waitingDays === 0
                            ? "today"
                            : waitingDays === 1
                              ? "1 day"
                              : `${waitingDays} days`}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {meetingsToLog > 0 ? (
            <p className="mb-6 rounded-lg border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm text-ink-600">
              {meetingsToLog} meeting{meetingsToLog === 1 ? "" : "s"} still to log.{" "}
              <Link href="/meetings" className="font-medium text-brand-700 hover:underline">
                Deal with {meetingsToLog === 1 ? "it" : "them"}
              </Link>
            </p>
          ) : null}

          {ownedProjects.length > 0 ? (
            <section className="mb-6">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-600">
                  Projects I own
                </h2>
                <span className="text-xs text-ink-500 tnum">
                  {ownedProjects.length}
                </span>
              </div>

              <div className="card overflow-hidden">
                <ul className="divide-y divide-ink-100">
                  {ownedProjects.map((project) => {
                    const minutes = ownedMinutesBy.get(project.id) ?? 0;
                    const open = ownedOpenBy.get(project.id) ?? 0;
                    const overdue =
                      project.dueDate && project.dueDate < now && open > 0;

                    return (
                      <li
                        key={project.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-ink-50/60"
                      >
                        <div className="min-w-[14rem] flex-1">
                          <Link
                            href={`/projects/${project.id}`}
                            className="text-sm font-medium text-ink-900 hover:text-brand-700"
                          >
                            {project.name}
                          </Link>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
                            <span>{project.client?.name ?? "No client"}</span>
                            {project.dueDate ? (
                              <span
                                className={
                                  overdue ? "font-medium text-bad-700" : undefined
                                }
                              >
                                · {relativeDueLabel(project.dueDate, now)}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="text-xs text-ink-600 tnum">
                          {open}/{project._count.tasks} open
                        </div>

                        <div className="w-36 shrink-0">
                          {project.budgetHours ? (
                            <ProgressBar
                              value={minutes / 60}
                              max={project.budgetHours}
                              label={`${formatHours(minutes)}h of ${project.budgetHours}h · ${pct(
                                minutes / 60,
                                project.budgetHours,
                              )}%`}
                            />
                          ) : (
                            <span className="text-xs text-ink-400 tnum">
                              {formatHours(minutes)}h logged
                            </span>
                          )}
                        </div>

                        <ProjectStatusChip status={project.status} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          ) : null}

          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-600">
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
                        group.tone === "warn" ? "text-warn-700" : "text-ink-600"
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
              earliestDate={
                lockState.lockedThrough
                  ? toISODate(addDays(lockState.lockedThrough, 1))
                  : undefined
              }
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
                    {isLocked(entry.date, lockState) ? (
                      <span
                        className="shrink-0 px-1 text-xs text-ink-400"
                        title="This month has been closed"
                      >
                        closed
                      </span>
                    ) : (
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
                    )}
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
