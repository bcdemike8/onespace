import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, formatMedium, toISODate, today } from "@/lib/dates";
import { centsToInput, formatHours, formatMoney, pct } from "@/lib/format";
import {
  PageHeader,
  ProgressBar,
  ProjectStatusChip,
  Stat,
} from "@/components/ui";
import { AddTaskForm } from "@/components/AddTaskForm";
import { ProjectTaskRow, type ProjectTaskData } from "@/components/ProjectTaskRow";
import { LogTimeForm } from "@/components/LogTimeForm";
import {
  createSectionAction,
  deleteSectionAction,
  renameSectionAction,
} from "@/app/actions/tasks";
import { TimeEntryRow } from "@/components/TimeEntryRow";
import { CallSummary } from "@/components/CallSummary";
import { asSummaryDoc } from "@/lib/summary";
import { saveProjectAsTemplateAction } from "@/app/actions/templates";
import { ProjectSettings } from "./ProjectSettings";
import {
  StatusUpdates,
  type StatusUpdateView,
} from "./StatusUpdates";
import { slackChannelOptions } from "@/app/actions/slack";
import { getLockState } from "@/lib/lock";
import { isLocked } from "@/lib/periods";
import { BillingTypeBadge } from "@/components/BillingTypeField";
import { HealthChip } from "@/components/HealthChip";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const admin = isAdmin(user);

  const project = await db.project.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      partner: { select: { id: true, name: true } },
      owner: { select: { name: true } },
      template: { select: { id: true, name: true } },
      sections: { orderBy: { orderIndex: "asc" } },
      statusUpdates: {
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        include: { author: { select: { name: true } } },
      },
      tasks: {
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          dueDate: true,
          estimatedHours: true,
          assigneeId: true,
          sectionId: true,
          parentId: true,
        },
      },
    },
  });

  if (!project) notFound();

  const [lockState, slackChannels] = await Promise.all([
    getLockState(),
    // Only admins see the settings dialog this feeds.
    admin ? slackChannelOptions() : Promise.resolve([]),
  ]);

  const [entries, people, clients, partners, timeByTask, calls] = await Promise.all([
    db.timeEntry.findMany({
      where: { projectId: id },
      select: {
        id: true,
        minutes: true,
        billable: true,
        billRateCents: true,
        costRateCents: true,
        date: true,
        notes: true,
        userId: true,
        user: { select: { name: true } },
        task: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    db.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.client.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.partner.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.timeEntry.groupBy({
      by: ["taskId"],
      where: { projectId: id },
      _sum: { minutes: true },
    }),
    // Calls filed against this project, for the summaries. The summary is
    // the durable record of what was said - more useful here, months
    // later, than on the meeting card it was confirmed from.
    db.meeting.findMany({
      where: { projectId: id, summary: { not: null } },
      orderBy: { startsAt: "desc" },
      take: 40,
      select: {
        id: true,
        title: true,
        startsAt: true,
        summary: true,
        summaryJson: true,
        recordingUrl: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  const minutesByTask = new Map(
    timeByTask.map((r) => [r.taskId, r._sum.minutes ?? 0]),
  );

  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);
  const costCents = entries.reduce(
    (sum, e) => sum + Math.round((e.minutes * e.costRateCents) / 60),
    0,
  );
  const billableCents = entries.reduce(
    (sum, e) =>
      sum + (e.billable ? Math.round((e.minutes * e.billRateCents) / 60) : 0),
    0,
  );

  const doneCount = project.tasks.filter((t) => t.status === "DONE").length;
  const loggedHours = totalMinutes / 60;

  // Unsectioned tasks come first, then each section in order.
  const groups: { id: string | null; name: string; tasks: ProjectTaskData[] }[] = [
    { id: null, name: "Tasks", tasks: [] },
    ...project.sections.map((s) => ({ id: s.id, name: s.name, tasks: [] as ProjectTaskData[] })),
  ];
  const groupById = new Map(groups.map((g) => [g.id, g]));

  // Subtasks are keyed by parent so each one can be slotted in directly under
  // it, whatever its position in the flat ordering.
  const childrenByParent = new Map<string, typeof project.tasks>();
  for (const task of project.tasks) {
    if (!task.parentId) continue;
    const list = childrenByParent.get(task.parentId) ?? [];
    list.push(task);
    childrenByParent.set(task.parentId, list);
  }

  const view = (
    task: (typeof project.tasks)[number],
    depth: number,
  ): ProjectTaskData => ({
    id: task.id,
    name: task.name,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours,
    assigneeId: task.assigneeId,
    loggedMinutes: minutesByTask.get(task.id) ?? 0,
    depth,
    openSubtasks: (childrenByParent.get(task.id) ?? []).filter(
      (c) => c.status !== "DONE",
    ).length,
  });

  for (const task of project.tasks) {
    if (task.parentId) continue; // placed under its parent below
    const group = groupById.get(task.sectionId) ?? groups[0];
    group.tasks.push(view(task, 0));
    for (const child of childrenByParent.get(task.id) ?? []) {
      group.tasks.push(view(child, 1));
    }
  }

  // The catch-all "Tasks" group only earns its place when it holds something,
  // or when the project has no sections at all.
  const visibleGroups = groups.filter((g) =>
    g.id === null ? g.tasks.length > 0 || project.sections.length === 0 : true,
  );

  const openTasks = project.tasks.filter((t) => t.status !== "DONE");

  const updates: StatusUpdateView[] = project.statusUpdates.map((u) => ({
    id: u.id,
    health: u.health,
    note: u.note,
    dateLabel: formatMedium(u.date),
    authorName: u.author?.name ?? "Someone",
    canDelete: admin || u.authorId === user.id,
  }));
  const [currentUpdate, ...olderUpdates] = updates;

  return (
    <div>
      <PageHeader
        title={project.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <ProjectStatusChip status={project.status} />
            <HealthChip health={currentUpdate?.health ?? null} />
            <BillingTypeBadge type={project.billingType} />
            {project.client ? <span>{project.client.name}</span> : null}
            {project.partner ? <span>· via {project.partner.name}</span> : null}
            {project.owner ? <span>· Owner: {project.owner.name}</span> : null}
            {project.startDate ? (
              <span>· Started {formatMedium(project.startDate)}</span>
            ) : null}
            {project.dueDate ? (
              <span>· Due {formatMedium(project.dueDate)}</span>
            ) : null}
            {project.template ? (
              <Link
                href={`/templates/${project.template.id}`}
                className="text-brand-700 hover:underline"
              >
                · From “{project.template.name}”
              </Link>
            ) : null}
          </span>
        }
        actions={
          admin ? (
            <>
              <form action={saveProjectAsTemplateAction}>
                <input type="hidden" name="projectId" value={project.id} />
                <input
                  type="hidden"
                  name="name"
                  value={`${project.name} template`}
                />
                <button type="submit" className="btn-secondary">
                  Save as template
                </button>
              </form>
              <ProjectSettings
                clients={clients}
                partners={partners}
                people={people}
                slackChannels={slackChannels}
                values={{
                  id: project.id,
                  name: project.name,
                  code: project.code ?? "",
                  clientId: project.clientId ?? "",
                  partnerId: project.partnerId ?? "",
                  ownerId: project.ownerId ?? "",
                  status: project.status,
                  startDate: project.startDate ? toISODate(project.startDate) : "",
                  dueDate: project.dueDate ? toISODate(project.dueDate) : "",
                  budgetHours: project.budgetHours?.toString() ?? "",
                  budgetAmount: project.budgetCents
                    ? centsToInput(project.budgetCents)
                    : "",
                  billRate: project.billRateCents
                    ? centsToInput(project.billRateCents)
                    : "",
                  billingType: project.billingType,
                  slackChannelId: project.slackChannelId ?? "",
                }}
              />
            </>
          ) : null
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Hours logged"
          value={`${formatHours(totalMinutes)}h`}
          hint={
            project.budgetHours
              ? `of ${project.budgetHours}h budget`
              : "No hours budget set"
          }
          tone={
            project.budgetHours && loggedHours > project.budgetHours
              ? "bad"
              : "default"
          }
        />
        <Stat
          label="Tasks complete"
          value={`${doneCount}/${project.tasks.length}`}
          hint={`${openTasks.length} still open`}
        />
        <Stat
          label="Cost to date"
          value={formatMoney(costCents)}
          hint={
            project.budgetCents
              ? `${pct(costCents, project.budgetCents)}% of ${formatMoney(
                  project.budgetCents,
                )}`
              : "At each person's cost rate"
          }
          tone={
            project.budgetCents && costCents > project.budgetCents ? "bad" : "default"
          }
        />
        <Stat
          label="Billable value"
          value={formatMoney(billableCents)}
          hint={
            billableCents > 0
              ? `${formatMoney(billableCents - costCents)} margin`
              : "Nothing billable logged"
          }
          tone={billableCents - costCents < 0 ? "bad" : "good"}
        />
      </div>

      {project.budgetHours || project.budgetCents ? (
        <div className="card mb-6 grid gap-4 p-4 sm:grid-cols-2">
          {project.budgetHours ? (
            <div>
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className="font-medium text-ink-700">Hours budget</span>
                <span className="tnum text-ink-500">
                  {formatHours(totalMinutes)}h / {project.budgetHours}h
                </span>
              </div>
              <ProgressBar value={loggedHours} max={project.budgetHours} />
            </div>
          ) : null}
          {project.budgetCents ? (
            <div>
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className="font-medium text-ink-700">Cost vs revenue budget</span>
                <span className="tnum text-ink-500">
                  {formatMoney(costCents)} / {formatMoney(project.budgetCents)}
                </span>
              </div>
              <ProgressBar value={costCents} max={project.budgetCents} />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <StatusUpdates
            projectId={project.id}
            today={toISODate(today())}
            current={currentUpdate ?? null}
            history={olderUpdates}
          />

          {visibleGroups.map((group) => (
            <section key={group.id ?? "none"} className="card overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-ink-200 bg-ink-50 px-4 py-2">
                {group.id ? (
                  <form action={renameSectionAction} className="min-w-0 flex-1">
                    <input type="hidden" name="id" value={group.id} />
                    <input
                      name="name"
                      defaultValue={group.name}
                      aria-label="Section name"
                      className="w-full truncate bg-transparent text-xs font-semibold uppercase tracking-wide text-ink-600 outline-none focus:text-ink-900"
                    />
                  </form>
                ) : (
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                    {group.name}
                  </h3>
                )}
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-ink-500 tnum">
                    {group.tasks.filter((t) => t.status === "DONE").length}/
                    {group.tasks.length}
                  </span>
                  {admin && group.id ? (
                    <form action={deleteSectionAction}>
                      <input type="hidden" name="id" value={group.id} />
                      <button
                        type="submit"
                        className="text-xs text-ink-400 hover:text-bad-700"
                        aria-label={`Delete section ${group.name}`}
                      >
                        remove
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>

              {group.tasks.length > 0 ? (
                <ul className="divide-y divide-ink-100">
                  {group.tasks.map((task) => (
                    <ProjectTaskRow
                      key={task.id}
                      task={task}
                      people={people}
                      projectId={project.id}
                      canDelete={admin || (minutesByTask.get(task.id) ?? 0) === 0}
                    />
                  ))}
                </ul>
              ) : null}

              <div className="border-t border-ink-100">
                <AddTaskForm
                  projectId={project.id}
                  sectionId={group.id}
                  people={people}
                />
              </div>
            </section>
          ))}

          <form action={createSectionAction} className="flex gap-2">
            <input type="hidden" name="projectId" value={project.id} />
            <input
              name="name"
              placeholder="New section name"
              className="input max-w-xs"
              autoComplete="off"
            />
            <button type="submit" className="btn-secondary">
              Add section
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <section className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">Log time</h2>
            <LogTimeForm
              compact
              defaultDate={toISODate(today())}
              earliestDate={
                lockState.lockedThrough
                  ? toISODate(addDays(lockState.lockedThrough, 1))
                  : undefined
              }
              defaultProjectId={project.id}
              projects={[
                {
                  id: project.id,
                  name: project.name,
                  clientName: project.client?.name ?? null,
                  billingType: project.billingType,
                  tasks: openTasks.map((t) => ({ id: t.id, name: t.name })),
                },
              ]}
            />
          </section>

          {calls.length > 0 ? (
            <section className="card overflow-hidden">
              <h2 className="border-b border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-900">
                Calls
              </h2>
              <ul className="max-h-[32rem] divide-y divide-ink-100 overflow-y-auto">
                {calls.map((call) => (
                  <li key={call.id} className="px-4 py-3">
                    <details>
                      <summary className="cursor-pointer list-none">
                        <span className="text-sm font-medium text-ink-900">
                          {call.title}
                        </span>
                        <span className="ml-2 text-xs text-ink-500">
                          {formatMedium(call.startsAt)} · {call.user.name}
                        </span>
                      </summary>
                      <div className="mt-2">
                        {asSummaryDoc(call.summaryJson) ? (
                          <CallSummary
                            doc={asSummaryDoc(call.summaryJson)!}
                            text={call.summary}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                            {call.summary}
                          </p>
                        )}
                      </div>
                      {call.recordingUrl ? (
                        <a
                          href={call.recordingUrl}
                          target="_blank"
                          rel="noopener"
                          className="mt-2 inline-block text-xs text-brand-700 hover:underline"
                        >
                          Recording ↗
                        </a>
                      ) : null}
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="card overflow-hidden">
            <h2 className="border-b border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-900">
              Time log
            </h2>
            {entries.length === 0 ? (
              <p className="px-4 py-6 text-sm text-ink-500">
                No time logged against this project yet.
              </p>
            ) : (
              <ul className="max-h-[28rem] divide-y divide-ink-100 overflow-y-auto">
                {entries.slice(0, 60).map((entry) => (
                  <TimeEntryRow
                    key={entry.id}
                    entry={{
                      id: entry.id,
                      dateISO: toISODate(entry.date),
                      dateLabel: formatMedium(entry.date),
                      minutes: entry.minutes,
                      hoursLabel: formatHours(entry.minutes),
                      notes: entry.notes,
                      billable: entry.billable,
                      personName: entry.user.name,
                      taskName: entry.task?.name ?? "General project time",
                      // Members correct their own time; admins correct anyone's.
                      editable:
                        (admin || entry.userId === user.id) &&
                        !isLocked(entry.date, lockState),
                    }}
                  />
                ))}
              </ul>
            )}
            {entries.length > 60 ? (
              <div className="border-t border-ink-200 px-4 py-2 text-xs text-ink-500">
                Showing the 60 most recent of {entries.length} entries.{" "}
                <Link href={`/reports?projects=${project.id}`} className="text-brand-700">
                  See them all in reports →
                </Link>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
