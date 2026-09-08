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
import { SortHeader, type SortDir } from "@/components/SortHeader";
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

const BUDGET_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Any budget" },
  { value: "over", label: "Over budget" },
  { value: "risk", label: "85% or more" },
  { value: "none", label: "No budget set" },
  { value: "under", label: "Under 85%" },
];

type SortColumn = "project" | "owner" | "due" | "open" | "hours" | "budget";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const admin = isAdmin(user);
  const params = await searchParams;

  const status = params.status ?? "open";
  const clientId = params.client ?? "";
  const partnerId = params.partner ?? "";
  const ownerId = params.owner ?? "";
  const budget = params.budget ?? "";
  const sort = (params.sort ?? "due") as SortColumn;
  const dir: SortDir = params.dir === "desc" ? "desc" : "asc";

  const statusWhere =
    status === "all"
      ? {}
      : status === "open" || status === "mine"
        ? { status: { in: ["ACTIVE", "ON_HOLD"] as ProjectStatus[] } }
        : { status: status as ProjectStatus };

  // The Mine tab and the owner dropdown are the same filter; the tab wins.
  const owner =
    status === "mine"
      ? { ownerId: user.id }
      : ownerId === "none"
        ? { ownerId: null }
        : ownerId
          ? { ownerId }
          : {};

  const [projects, clients, partners, people] = await Promise.all([
    db.project.findMany({
      where: {
        ...statusWhere,
        ...owner,
        ...(clientId ? { clientId } : {}),
        ...(partnerId ? { partnerId } : {}),
      },
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
  const openTasks = new Map(openTaskCounts.map((r) => [r.projectId, r._count._all]));
  const now = today();

  // Hours, open tasks and budget burn are all derived, so filtering and
  // sorting on them happens here rather than in the query.
  let rows = projects.map((p) => {
    const logged = minutes.get(p.id) ?? 0;
    const usedPct = p.budgetHours ? (logged / 60 / p.budgetHours) * 100 : null;
    return {
      ...p,
      logged,
      open: openTasks.get(p.id) ?? 0,
      usedPct,
    };
  });

  if (budget === "over") rows = rows.filter((r) => r.usedPct !== null && r.usedPct > 100);
  if (budget === "risk") rows = rows.filter((r) => r.usedPct !== null && r.usedPct >= 85);
  if (budget === "under") rows = rows.filter((r) => r.usedPct !== null && r.usedPct < 85);
  if (budget === "none") rows = rows.filter((r) => r.usedPct === null);

  const factor = dir === "asc" ? 1 : -1;
  // Projects with nothing in the sorted column sink to the bottom either way,
  // rather than crowding the top of a descending sort.
  const nullsLast = (a: number | null, b: number | null) => {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return (a - b) * factor;
  };

  rows.sort((a, b) => {
    switch (sort) {
      case "project":
        return a.name.localeCompare(b.name) * factor;
      case "owner":
        return (
          (a.owner?.name ?? "~").localeCompare(b.owner?.name ?? "~") * factor ||
          a.name.localeCompare(b.name)
        );
      case "open":
        return (a.open - b.open) * factor || a.name.localeCompare(b.name);
      case "hours":
        return (a.logged - b.logged) * factor || a.name.localeCompare(b.name);
      case "budget":
        return nullsLast(a.usedPct, b.usedPct) || a.name.localeCompare(b.name);
      case "due":
      default:
        return (
          nullsLast(
            a.dueDate ? a.dueDate.getTime() : null,
            b.dueDate ? b.dueDate.getTime() : null,
          ) || a.name.localeCompare(b.name)
        );
    }
  });

  const query = (overrides: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { status, client: clientId, partner: partnerId, owner: ownerId, budget, sort, dir, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, String(v));
    return `/projects?${q.toString()}`;
  };

  const filtered = Boolean(clientId || partnerId || ownerId || budget);
  const totalHours = rows.reduce((s, r) => s + r.logged, 0);

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${rows.length} ${rows.length === 1 ? "project" : "projects"} · ${formatHours(totalHours)}h logged against them`}
        actions={
          admin ? (
            <Link href="/projects/new" className="btn-primary">
              New project
            </Link>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-1">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={query({ status: tab.value, owner: tab.value === "mine" ? "" : ownerId })}
            className={`rounded-lg px-2.5 py-1.5 text-sm font-medium ${
              status === tab.value
                ? "bg-ink-900 text-white"
                : "text-ink-600 hover:bg-ink-100"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <form className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="dir" value={dir} />

        <div className="min-w-[10rem] flex-1">
          <label className="label" htmlFor="f-owner">
            Owner
          </label>
          <select id="f-owner" name="owner" defaultValue={ownerId} className="input">
            <option value="">Anyone</option>
            <option value="none">Unassigned</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[10rem] flex-1">
          <label className="label" htmlFor="f-client">
            Client
          </label>
          <select id="f-client" name="client" defaultValue={clientId} className="input">
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[10rem] flex-1">
          <label className="label" htmlFor="f-partner">
            Partner
          </label>
          <select id="f-partner" name="partner" defaultValue={partnerId} className="input">
            <option value="">All partners</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[10rem] flex-1">
          <label className="label" htmlFor="f-budget">
            Budget
          </label>
          <select id="f-budget" name="budget" defaultValue={budget} className="input">
            {BUDGET_FILTERS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-secondary">
          Apply
        </button>
        {filtered ? (
          <Link href={query({ client: "", partner: "", owner: "", budget: "" })} className="btn-ghost">
            Clear
          </Link>
        ) : null}
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title={
            status === "mine"
              ? "No open projects are assigned to you."
              : filtered
                ? "Nothing matches those filters."
                : "No projects here yet."
          }
          body={
            status === "mine"
              ? "Projects show up here once someone sets you as their owner."
              : filtered
                ? "Try clearing a filter, or widening the status tab."
                : "Build a template first, then spin up projects from it in a couple of clicks."
          }
          action={
            admin && !filtered && status !== "mine"
              ? { href: "/projects/new", label: "Create a project" }
              : undefined
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[58rem]">
              <thead className="border-b border-ink-200 bg-ink-50">
                <tr>
                  <SortHeader
                    label="Project"
                    column="project"
                    activeColumn={sort}
                    activeDir={dir}
                    href={(c, d) => query({ sort: c, dir: d })}
                  />
                  <SortHeader
                    label="Owner"
                    column="owner"
                    activeColumn={sort}
                    activeDir={dir}
                    href={(c, d) => query({ sort: c, dir: d })}
                  />
                  <th className="th">Status</th>
                  <SortHeader
                    label="Due"
                    column="due"
                    activeColumn={sort}
                    activeDir={dir}
                    href={(c, d) => query({ sort: c, dir: d })}
                  />
                  <SortHeader
                    label="Open tasks"
                    column="open"
                    activeColumn={sort}
                    activeDir={dir}
                    defaultDir="desc"
                    align="right"
                    href={(c, d) => query({ sort: c, dir: d })}
                  />
                  <SortHeader
                    label="Hours"
                    column="hours"
                    activeColumn={sort}
                    activeDir={dir}
                    defaultDir="desc"
                    align="right"
                    href={(c, d) => query({ sort: c, dir: d })}
                  />
                  <SortHeader
                    label="Budget used"
                    column="budget"
                    activeColumn={sort}
                    activeDir={dir}
                    defaultDir="desc"
                    href={(c, d) => query({ sort: c, dir: d })}
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((project) => {
                  const overdue =
                    project.dueDate && project.dueDate < now && project.status === "ACTIVE";

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
                        {project.open}
                        <span className="text-ink-400">/{project._count.tasks}</span>
                      </td>

                      <td className="td text-right tnum font-medium">
                        {formatHours(project.logged)}
                        {project.budgetHours ? (
                          <span className="text-ink-400"> / {project.budgetHours}</span>
                        ) : null}
                      </td>

                      <td className="td w-48">
                        {project.budgetHours ? (
                          <ProgressBar
                            value={project.logged / 60}
                            max={project.budgetHours}
                            label={`${pct(project.logged / 60, project.budgetHours)}% of ${
                              project.budgetHours
                            }h${
                              project.budgetCents
                                ? ` · ${formatMoney(project.budgetCents)} budget`
                                : ""
                            }`}
                          />
                        ) : (
                          <span className="text-xs text-ink-400">No budget set</span>
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
