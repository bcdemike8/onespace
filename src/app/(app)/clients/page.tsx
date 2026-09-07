import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatHours, formatMoney } from "@/lib/format";
import { EmptyState, PageHeader } from "@/components/ui";
import {
  toggleClientArchivedAction,
  updateClientAction,
} from "@/app/actions/projects";
import { NewClientForm } from "./NewClientForm";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  await requireAdmin();

  const clients = await db.client.findMany({
    include: {
      projects: { select: { id: true, name: true, status: true } },
    },
    orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
  });

  const projectIds = clients.flatMap((c) => c.projects.map((p) => p.id));

  const entries = await db.timeEntry.findMany({
    where: { projectId: { in: projectIds } },
    select: {
      projectId: true,
      minutes: true,
      billable: true,
      billRateCents: true,
    },
  });

  const byProject = new Map<string, { minutes: number; cents: number }>();
  for (const e of entries) {
    const acc = byProject.get(e.projectId) ?? { minutes: 0, cents: 0 };
    acc.minutes += e.minutes;
    if (e.billable) acc.cents += Math.round((e.minutes * e.billRateCents) / 60);
    byProject.set(e.projectId, acc);
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Who the work is for. Reports roll up by client automatically."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {clients.length === 0 ? (
            <EmptyState
              title="No clients yet."
              body="Add one on the right, then point projects at it."
            />
          ) : (
            clients.map((client) => {
              const totals = client.projects.reduce(
                (acc, p) => {
                  const t = byProject.get(p.id);
                  return {
                    minutes: acc.minutes + (t?.minutes ?? 0),
                    cents: acc.cents + (t?.cents ?? 0),
                  };
                },
                { minutes: 0, cents: 0 },
              );
              const active = client.projects.filter(
                (p) => p.status === "ACTIVE",
              ).length;

              return (
                <section
                  key={client.id}
                  className={`card p-4 ${client.archivedAt ? "opacity-60" : ""}`}
                >
                  <form
                    action={updateClientAction}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <input type="hidden" name="id" value={client.id} />
                    <div className="min-w-[12rem] flex-1">
                      <label className="label" htmlFor={`name-${client.id}`}>
                        Client name
                      </label>
                      <input
                        id={`name-${client.id}`}
                        name="name"
                        defaultValue={client.name}
                        className="input"
                      />
                    </div>
                    <div className="min-w-[12rem] flex-[2]">
                      <label className="label" htmlFor={`notes-${client.id}`}>
                        Notes
                      </label>
                      <input
                        id={`notes-${client.id}`}
                        name="notes"
                        defaultValue={client.notes ?? ""}
                        className="input"
                      />
                    </div>
                    <button type="submit" className="btn-secondary">
                      Save
                    </button>
                  </form>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-3">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500 tnum">
                      <span>
                        {client.projects.length} project
                        {client.projects.length === 1 ? "" : "s"} ({active} active)
                      </span>
                      <span>{formatHours(totals.minutes)}h logged</span>
                      <span>{formatMoney(totals.cents)} billable</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/reports?clients=${client.id}`}
                        className="text-xs text-brand-700 hover:underline"
                      >
                        View report →
                      </Link>
                      <form action={toggleClientArchivedAction}>
                        <input type="hidden" name="id" value={client.id} />
                        <button
                          type="submit"
                          className="text-xs text-ink-400 hover:text-ink-700"
                        >
                          {client.archivedAt ? "Restore" : "Archive"}
                        </button>
                      </form>
                    </div>
                  </div>
                </section>
              );
            })
          )}
        </div>

        <div>
          <section className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">New client</h2>
            <NewClientForm />
          </section>
        </div>
      </div>
    </div>
  );
}
