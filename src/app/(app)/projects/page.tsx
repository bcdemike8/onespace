import Link from "next/link";
import type { ProjectStatus } from "@prisma/client";
import { isAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMedium, relativeDueLabel, today } from "@/lib/dates";
import { formatHours, formatMoney, pct } from "@/lib/format";
import {
  EmptyState,
  PageHeader,
  ProgressBar,
  ProjectStatusChip,
} from "@/components/ui";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { setProjectOwnerAction } from "@/app/actions/projects";

export const dynamic = "force-dynamic";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "mine", label: "Mine" },
  { value: "open", label: "Open" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "all", label: "All" },
];

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; client?: string }>;
}) {
  const user = await requireUser();
  const admin = isAdmin(user);
  const params = await searchParams;
  const status = params.status ?? "open";
  const clientId = params.client ?? "";

  // "Mine" is the same open list, narrowed to what this person owns.
  const statusWhere =
    status === "all"
      ? {}
      : status === "open" || status === "mine"
        ? { status: { in: ["ACTIVE", "ON_HOLD"] as ProjectStatus[] } }
        : { status: status as ProjectStatus };

  const ownerWhere = status === "mine" ? { ownerId: user.id } : {};

  const [projects, clients, people] = await Promise.all([
    db.project.findMany({
      where: { ...statusWhere, ...ownerWhere, ...(clientId ? { clientId } : {}) },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        dueDate: true,
        budgetHours: true,
        budgetCents: true,
        client: { select: { id: true, name: true } },
        partner: { select: { name: true } },
        ownerId: true,
        owner: { select: { name: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { name: "asc" }],
    }),
    db.client.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const ids = projects.map((p) => p.id);

  const [minutesByProject, openTaskCounts] = await Promise.all([
    db.timeEntry.groupBy({
      by: ["projectId"],
      where: { projectId: { in: ids } },
      _sum: { minutes: true },
    }),
    db.task.groupBy({
      by: ["projectId"],
      where: { projectId: { in: ids }, status: { not: "DONE" } },
      _count: { _all: true },
    }),
  ]);

  const minutes = new Map(
    minutesByProject.map((r) => [r.projectId, r._sum.minutes ?? 0]),
  );
  const openTasks = new Map(
    openTaskCounts.map((r) => [r.projectId, r._count._all]),
  );

  const now = today();

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Every engagement, its hours and how much of the budget is gone."
        actions={
          isAdmin(user) ? (
            <Link href="/projects/new" className="btn-primary">
              New project
            </Link>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => {
            const href = `/projects?status=${tab.value}${
              clientId ? `&client=${clientId}` : ""
            }`;
            const active = status === tab.value;
            return (
              <Link
                key={tab.value}
                href={href}
                className={`rounded-lg px-2.5 py-1.5 text-sm font-medium ${
                  active
                    ? "bg-ink-900 text-white"
                    : "text-ink-600 hover:bg-ink-100"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {clients.length > 0 ? (
          <form className="ml-auto flex items-end gap-2">
            <input type="hidden" name="status" value={status} />
            <select name="client" defaultValue={clientId} className="input w-52">
              <option value="">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-secondary">
              Filter
            </button>
          </form>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title={
            status === "mine"
              ? "No open projects are assigned to you."
              : "No projects here yet."
          }
          body={
            status === "mine"
              ? "Projects show up here once someone sets you as their owner."
              : "Build a template first, then spin up projects from it in a couple of clicks."
          }
          action={
            isAdmin(user)
              ? { href: "/projects/new", label: "Create a project" }
              : undefined
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem]">
              <thead className="border-b border-ink-200 bg-ink-50">
                <tr>
                  <th className="th">Project</th>
                  <th className="th">Owner</th>
                  <th className="th">Status</th>
                  <th className="th">Due</th>
                  <th className="th text-right">Open tasks</th>
                  <th className="th text-right">Hours</th>
                  <th className="th w-48">Budget used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {projects.map((project) => {
                  const logged = minutes.get(project.id) ?? 0;
                  const loggedHours = logged / 60;
                  const overdue =
                    project.dueDate &&
                    project.dueDate < now &&
                    project.status === "ACTIVE";

                  return (
                    <tr key={project.id} className="hover:bg-ink-50/60">
                      <td className="td">
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-medium text-ink-900 hover:text-brand-700"
                        >
                          {project.name}
                        </Link>
                        <div className="text-xs text-ink-500">
                          {project.client?.name ?? "No client"}
                          {project.partner ? ` · via ${project.partner.name}` : ""}
                          {project.code ? ` · ${project.code}` : ""}
                        </div>
                      </td>

                      <td className="td">
                        {admin ? (
                          <form action={setProjectOwnerAction}>
                            <input type="hidden" name="id" value={project.id} />
                            <AutoSubmitSelect
                              name="ownerId"
                              ariaLabel={`Owner of ${project.name}`}
                              defaultValue={project.ownerId ?? ""}
                              className={`input w-36 py-1 text-xs ${
                                project.ownerId ? "" : "text-ink-400"
                              }`}
                              options={[
                                { value: "", label: "— unassigned —" },
                                ...people.map((p) => ({ value: p.id, label: p.name })),
                              ]}
                            />
                          </form>
                        ) : (
                          <span className="text-sm text-ink-600">
                            {project.owner?.name ?? "—"}
                          </span>
                        )}
                      </td>
                      <td className="td">
                        <ProjectStatusChip status={project.status} />
                      </td>
                      <td className="td text-sm">
                        {project.dueDate ? (
                          <span className={overdue ? "font-medium text-bad-700" : ""}>
                            {formatMedium(project.dueDate)}
                            <div className="text-xs text-ink-500">
                              {relativeDueLabel(project.dueDate, now)}
                            </div>
                          </span>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                      </td>
                      <td className="td text-right tnum">
                        {openTasks.get(project.id) ?? 0}
                        <span className="text-ink-400">
                          /{project._count.tasks}
                        </span>
                      </td>
                      <td className="td text-right tnum font-medium">
                        {formatHours(logged)}
                        {project.budgetHours ? (
                          <span className="text-ink-400">
                            {" "}
                            / {project.budgetHours}
                          </span>
                        ) : null}
                      </td>
                      <td className="td">
                        {project.budgetHours ? (
                          <ProgressBar
                            value={loggedHours}
                            max={project.budgetHours}
                            label={`${pct(loggedHours, project.budgetHours)}% of ${
                              project.budgetHours
                            }h${
                              project.budgetCents
                                ? ` · ${formatMoney(project.budgetCents)} budget`
                                : ""
                            }`}
                          />
                        ) : (
                          <span className="text-xs text-ink-400">
                            No budget set
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
