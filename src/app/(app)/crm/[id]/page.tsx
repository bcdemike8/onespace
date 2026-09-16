import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMedium } from "@/lib/dates";
import { ACCOUNT_LABEL, STAGE_LABEL, money } from "@/lib/crm/view";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * Everything about one company, in one place.
 *
 * This is the whole argument for a CRM living inside the delivery tool
 * rather than beside it: the deals, the projects those deals became, and the
 * hours actually worked are three views of one relationship, and in two
 * separate systems nobody ever sees them together.
 */
export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const client = await db.client.findUnique({
    where: { id },
    include: {
      partner: { select: { name: true } },
      owner: { select: { name: true } },
      domains: { select: { domain: true }, orderBy: { domain: "asc" } },
      projects: {
        select: { id: true, name: true, status: true },
        orderBy: { name: "asc" },
      },
      deals: {
        orderBy: [{ closeDate: "desc" }],
        select: {
          id: true,
          name: true,
          stage: true,
          amount: true,
          closeDate: true,
          isWon: true,
          isClosed: true,
          partner: { select: { name: true } },
          leadConsultant: { select: { name: true } },
        },
      },
      contacts: {
        orderBy: [{ noLongerHere: "asc" }, { lastName: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          title: true,
          noLongerHere: true,
        },
      },
    },
  });

  if (!client) notFound();

  const minutes = await db.timeEntry.aggregate({
    where: { project: { clientId: client.id } },
    _sum: { minutes: true },
  });
  const hours = Math.round((minutes._sum.minutes ?? 0) / 60);

  const won = client.deals.filter((d) => d.isWon);
  const revenue = won.reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
  const open = client.deals.filter((d) => !d.isClosed);

  const facts = [
    client.industry,
    client.employees ? `${client.employees.toLocaleString()} staff` : null,
    client.annualRevenue ? `${money(Number(client.annualRevenue))} revenue` : null,
    [client.city, client.state, client.country].filter(Boolean).join(", ") || null,
    client.partner ? `via ${client.partner.name}` : null,
    client.owner ? `owned by ${client.owner.name}` : null,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={client.name}
        subtitle={`${ACCOUNT_LABEL[client.accountType]}${
          client.legalName && client.legalName !== client.name
            ? ` · ${client.legalName}`
            : ""
        }`}
      />

      <div className="card mb-4 flex flex-wrap gap-x-6 gap-y-2 p-4 text-sm text-ink-700">
        <span>
          <strong className="font-medium text-ink-900">{money(revenue)}</strong> won
          across {won.length} {won.length === 1 ? "deal" : "deals"}
        </span>
        <span>
          <strong className="font-medium text-ink-900">{hours.toLocaleString()}h</strong>{" "}
          logged
        </span>
        {open.length > 0 ? (
          <span>
            <strong className="font-medium text-ink-900">{open.length}</strong> open
          </span>
        ) : null}
        {client.website ? (
          <a
            href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-brand-600 underline"
          >
            {client.website}
          </a>
        ) : null}
      </div>

      {facts.length > 0 ? (
        <p className="mb-4 text-sm text-ink-600">{facts.join(" · ")}</p>
      ) : null}

      {/* ------------------------------------------------------------ deals */}
      <h2 className="mb-2 text-sm font-medium text-ink-900">
        Deals {client.deals.length > 0 ? `(${client.deals.length})` : ""}
      </h2>
      {client.deals.length === 0 ? (
        <p className="card mb-6 p-4 text-sm text-ink-500">No deals recorded.</p>
      ) : (
        <ul className="card mb-6 divide-y divide-ink-100">
          {client.deals.slice(0, 40).map((d) => (
            <li key={d.id} className="flex flex-wrap items-baseline gap-2 px-4 py-2.5">
              <Link
                href={`/crm/deals/${d.id}`}
                className="text-sm text-ink-900 underline decoration-ink-200 hover:decoration-ink-500"
              >
                {d.name}
              </Link>
              <span
                className={`chip ${
                  d.isWon
                    ? "bg-brand-100 text-brand-700"
                    : d.isClosed
                      ? "bg-ink-100 text-ink-500"
                      : "bg-warn-50 text-warn-700"
                }`}
              >
                {STAGE_LABEL[d.stage]}
              </span>
              {d.leadConsultant ? (
                <span className="text-xs text-ink-500">{d.leadConsultant.name}</span>
              ) : null}
              <span className="ml-auto shrink-0 text-sm tnum text-ink-700">
                {money(d.amount === null ? null : Number(d.amount))}
              </span>
              <span className="w-24 shrink-0 text-right text-xs tnum text-ink-400">
                {d.closeDate ? formatMedium(d.closeDate) : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* --------------------------------------------------------- projects */}
      {client.projects.length > 0 ? (
        <>
          <h2 className="mb-2 text-sm font-medium text-ink-900">
            Projects ({client.projects.length})
          </h2>
          <ul className="card mb-6 divide-y divide-ink-100">
            {client.projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="flex items-baseline gap-2 px-4 py-2.5 transition-colors hover:bg-ink-50"
                >
                  <span className="text-sm text-ink-900">{p.name}</span>
                  <span className="ml-auto text-xs text-ink-500">{p.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {/* --------------------------------------------------------- contacts */}
      <h2 className="mb-2 text-sm font-medium text-ink-900">
        Contacts {client.contacts.length > 0 ? `(${client.contacts.length})` : ""}
      </h2>
      {client.contacts.length === 0 ? (
        <p className="card p-4 text-sm text-ink-500">No contacts recorded.</p>
      ) : (
        <ul className="card divide-y divide-ink-100">
          {client.contacts.slice(0, 60).map((p) => (
            <li key={p.id} className="flex flex-wrap items-baseline gap-2 px-4 py-2.5">
              <span
                className={`text-sm ${p.noLongerHere ? "text-ink-400 line-through" : "text-ink-900"}`}
              >
                {[p.firstName, p.lastName].filter(Boolean).join(" ")}
              </span>
              {p.title ? <span className="text-xs text-ink-500">{p.title}</span> : null}
              {p.noLongerHere ? (
                <span className="chip bg-ink-100 text-ink-500">Left</span>
              ) : null}
              {p.email ? (
                <a
                  href={`mailto:${p.email}`}
                  className="ml-auto shrink-0 text-xs text-brand-600 underline"
                >
                  {p.email}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {client.domains.length > 0 ? (
        <p className="mt-4 text-xs text-ink-500">
          Email from {client.domains.map((d) => d.domain).join(", ")} is filed here.
        </p>
      ) : null}
    </div>
  );
}
