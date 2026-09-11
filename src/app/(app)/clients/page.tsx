import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatHours, formatMoney } from "@/lib/format";
import { EmptyState, PageHeader } from "@/components/ui";
import {
  toggleClientArchivedAction,
  togglePartnerArchivedAction,
  updateClientAction,
  updatePartnerAction,
} from "@/app/actions/projects";
import { DomainsField } from "./DomainsField";
import { IgnoredDomains } from "./IgnoredDomains";
import { PartnerDomainsField } from "./PartnerDomainsField";
import { NewClientForm } from "./NewClientForm";
import { NewPartnerForm } from "./NewPartnerForm";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  await requireAdmin();

  const [clients, partners, ignored] = await Promise.all([
    db.client.findMany({
      include: {
        projects: { select: { id: true, name: true, status: true } },
        domains: { select: { id: true, domain: true }, orderBy: { domain: "asc" } },
      },
      orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
    }),
    db.partner.findMany({
      include: {
        projects: { select: { id: true, status: true } },
        domains: { select: { id: true, domain: true }, orderBy: { domain: "asc" } },
      },
      orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
    }),
    db.ignoredDomain.findMany({
      select: { id: true, domain: true, note: true },
      orderBy: { domain: "asc" },
    }),
  ]);

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
        title="Clients & partners"
        subtitle="A client is who the work is for; a partner is who it came through. Reports can group by either, and email domains on both are how meetings and mail find their project."
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
              // Worth shouting about only where there is live work: an
              // archived client with no domain is finished, not broken.
              const needsDomain =
                !client.archivedAt &&
                client.domains.length === 0 &&
                client.projects.length > 0;

              return (
                <section
                  key={client.id}
                  className={`card p-4 ${client.archivedAt ? "opacity-60" : ""} ${
                    needsDomain ? "border-warn-500/40" : ""
                  }`}
                >
                  {needsDomain ? (
                    <p className="mb-3 rounded-lg bg-warn-50 px-3 py-2 text-xs text-warn-700">
                      <strong>No email domain.</strong> None of this client&apos;s
                      meetings or mail will come in until one is added below.
                      This is silent otherwise — nothing errors, the work just
                      never appears.
                    </p>
                  ) : null}
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

                  <DomainsField clientId={client.id} domains={client.domains} />

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

        <div className="space-y-6">
          <section className="card p-4">
            <h2 className="mb-1 text-sm font-semibold text-ink-900">New client</h2>
            <p className="mb-3 text-xs text-ink-500">
              Sets up the company, its email domains and its first project in
              one pass — everything a client needs before meetings and mail
              will find them.
            </p>
            <Link href="/clients/new" className="btn-primary w-full justify-center">
              Set up a client
            </Link>

            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-ink-500 hover:text-ink-800">
                Just add a name for now
              </summary>
              <div className="mt-3">
                <p className="mb-3 text-xs text-warn-700">
                  A client added this way has no domain, so none of their
                  meetings or mail will come in until you add one below.
                </p>
                <NewClientForm />
              </div>
            </details>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-ink-200 bg-ink-50 px-4 py-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-600">
                Partners
              </h2>
            </div>

            {partners.length === 0 ? (
              <p className="px-4 py-4 text-sm text-ink-500">
                No partners yet — add the companies work comes through, like
                Outreach or Salesloft.
              </p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {partners.map((partner) => (
                  <li
                    key={partner.id}
                    className={`px-4 py-2.5 ${partner.archivedAt ? "opacity-60" : ""}`}
                  >
                    <form
                      action={updatePartnerAction}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="id" value={partner.id} />
                      <input
                        name="name"
                        defaultValue={partner.name}
                        aria-label="Partner name"
                        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink-900 outline-none focus:text-brand-700"
                      />
                      <span className="shrink-0 text-xs tnum text-ink-500">
                        {partner.projects.length}
                      </span>
                      <button type="submit" className="btn-ghost btn-sm shrink-0">
                        Save
                      </button>
                    </form>

                    <PartnerDomainsField
                      partnerId={partner.id}
                      domains={partner.domains}
                    />

                    <div className="mt-1 flex items-center gap-3">
                      <Link
                        href={`/reports?partners=${partner.id}&preset=this_year`}
                        className="text-xs text-brand-700 hover:underline"
                      >
                        Report →
                      </Link>
                      <form action={togglePartnerArchivedAction}>
                        <input type="hidden" name="id" value={partner.id} />
                        <button
                          type="submit"
                          className="text-xs text-ink-400 hover:text-ink-700"
                        >
                          {partner.archivedAt ? "Restore" : "Archive"}
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-ink-200 p-4">
              <NewPartnerForm />
            </div>
          </section>

          <IgnoredDomains domains={ignored} />
        </div>
      </div>
    </div>
  );
}
