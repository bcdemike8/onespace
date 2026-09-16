import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  ACCOUNT_LABEL,
  ACCOUNT_TABS,
  accountWhere,
  asAccountFilter,
  crmHref,
  searchWhere,
} from "@/lib/crm/view";
import { EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

/** Enough to scan, few enough to render. Search is how you find the rest. */
const LIMIT = 100;

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const filter = asAccountFilter(params.type);
  const q = (params.q ?? "").trim();
  const current = { type: params.type, q: params.q };

  const where = {
    ...accountWhere(filter),
    ...searchWhere(q, ["name", "legalName", "website", "industry"]),
  };

  const [rows, total, counts] = await Promise.all([
    db.client.findMany({
      where,
      orderBy: { name: "asc" },
      take: LIMIT,
      select: {
        id: true,
        name: true,
        accountType: true,
        industry: true,
        website: true,
        employees: true,
        partner: { select: { name: true } },
        _count: { select: { deals: true, contacts: true, projects: true } },
      },
    }),
    db.client.count({ where }),
    db.client.groupBy({ by: ["accountType"], _count: { _all: true } }),
  ]);

  const byType = new Map(counts.map((c) => [c.accountType, c._count._all]));

  return (
    <>
      <PageHeader
        title="Accounts"
        subtitle={`${total.toLocaleString()} ${
          total === 1 ? "company" : "companies"
        }${filter === "working" ? " you work with" : ""}.`}
        actions={
          <Link href="/crm/new" className="btn-primary btn-sm">
            New account
          </Link>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        {ACCOUNT_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={crmHref("/crm", current, { type: tab.key === "working" ? null : tab.key })}
            className={filter === tab.key ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
          >
            {tab.label}
            {tab.key === "customers" ? ` · ${byType.get("CURRENT_CUSTOMER") ?? 0}` : ""}
            {tab.key === "prospects" ? ` · ${byType.get("PROSPECT") ?? 0}` : ""}
          </Link>
        ))}
        <span className="ml-auto flex gap-2">
          <Link href="/crm/dashboard" className="btn-ghost btn-sm">
            Dashboard
          </Link>
          <Link href="/crm/deals" className="btn-ghost btn-sm">
            Deals
          </Link>
          <Link href="/crm/contacts" className="btn-ghost btn-sm">
            Contacts
          </Link>
        </span>
      </div>

      <form className="mb-4 flex gap-2" action="/crm">
        {filter !== "working" ? (
          <input type="hidden" name="type" value={filter} />
        ) : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name, website or industry"
          className="input max-w-md"
        />
        <button type="submit" className="btn-secondary btn-sm">
          Search
        </button>
        {q ? (
          <Link href={crmHref("/crm", current, { q: null })} className="btn-ghost btn-sm">
            Clear
          </Link>
        ) : null}
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title={q ? "Nothing matches that" : "No accounts yet"}
          body={
            q
              ? "No company here matches that search. Try a shorter term, or a different tab."
              : "Once the Salesforce import has run, your accounts appear here."
          }
        />
      ) : (
        <>
          {total > rows.length ? (
            <p className="mb-2 text-xs text-ink-500">
              Showing the first {rows.length} of {total.toLocaleString()} — search to narrow it.
            </p>
          ) : null}
          <ul className="card divide-y divide-ink-100">
            {rows.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/crm/${c.id}`}
                  className="block px-4 py-3 transition-colors hover:bg-ink-50"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium text-ink-900">{c.name}</span>
                    <span className="chip bg-ink-100 text-ink-600">
                      {ACCOUNT_LABEL[c.accountType]}
                    </span>
                    {c.partner ? (
                      <span className="text-xs text-ink-500">{c.partner.name}</span>
                    ) : null}
                    <span className="ml-auto shrink-0 text-xs text-ink-400">
                      {c._count.deals > 0 ? `${c._count.deals} deals` : ""}
                      {c._count.projects > 0 ? ` · ${c._count.projects} projects` : ""}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {[
                      c.industry,
                      c.employees ? `${c.employees.toLocaleString()} staff` : null,
                      c.website,
                      c._count.contacts > 0 ? `${c._count.contacts} contacts` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No detail recorded"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
