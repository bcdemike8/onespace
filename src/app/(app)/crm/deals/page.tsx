import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMedium } from "@/lib/dates";
import {
  DEAL_TABS,
  STAGE_LABEL,
  asDealFilter,
  crmHref,
  dealWhere,
  money,
  searchWhere,
} from "@/lib/crm/view";
import { EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const LIMIT = 100;

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; q?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const filter = asDealFilter(params.show);
  const q = (params.q ?? "").trim();
  const current = { show: params.show, q: params.q };

  const where = {
    ...dealWhere(filter),
    ...searchWhere(q, ["name"]),
  };

  const [rows, total, sum] = await Promise.all([
    db.deal.findMany({
      where,
      orderBy: [{ closeDate: "desc" }],
      take: LIMIT,
      select: {
        id: true,
        name: true,
        stage: true,
        amount: true,
        closeDate: true,
        isWon: true,
        isClosed: true,
        client: { select: { id: true, name: true } },
        partner: { select: { name: true } },
        leadConsultant: { select: { name: true } },
      },
    }),
    db.deal.count({ where }),
    db.deal.aggregate({ where, _sum: { amount: true } }),
  ]);

  const value = Number(sum._sum.amount ?? 0);

  return (
    <>
      <PageHeader
        title="Deals"
        subtitle={`${total.toLocaleString()} ${total === 1 ? "deal" : "deals"} · ${money(value)}`}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        {DEAL_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={crmHref("/crm/deals", current, {
              show: tab.key === "open" ? null : tab.key,
            })}
            className={filter === tab.key ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
          >
            {tab.label}
          </Link>
        ))}
        <span className="ml-auto flex gap-2">
          <Link href="/crm/dashboard" className="btn-ghost btn-sm">
            Dashboard
          </Link>
          <Link href="/crm" className="btn-ghost btn-sm">
            Accounts
          </Link>
        </span>
      </div>

      <form className="mb-4 flex gap-2" action="/crm/deals">
        {filter !== "open" ? <input type="hidden" name="show" value={filter} /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search deal names"
          className="input max-w-md"
        />
        <button type="submit" className="btn-secondary btn-sm">
          Search
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title={filter === "open" ? "Nothing open" : "Nothing here"}
          body={
            filter === "open"
              ? "No deal is currently in play. Won and Lost hold the history."
              : "No deal matches that. Try another tab or a shorter search."
          }
        />
      ) : (
        <>
          {total > rows.length ? (
            <p className="mb-2 text-xs text-ink-500">
              Showing {rows.length} of {total.toLocaleString()}, newest first.
            </p>
          ) : null}
          <ul className="card divide-y divide-ink-100">
            {rows.map((d) => (
              <li key={d.id} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <Link
                    href={`/crm/deals/${d.id}`}
                    className="text-sm font-medium text-ink-900 underline decoration-ink-200 hover:decoration-ink-500"
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
                  <span className="ml-auto shrink-0 text-sm tnum text-ink-800">
                    {money(d.amount === null ? null : Number(d.amount))}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-baseline gap-2 text-xs text-ink-500">
                  <Link href={`/crm/${d.client.id}`} className="underline">
                    {d.client.name}
                  </Link>
                  {d.partner ? <span>{d.partner.name}</span> : null}
                  {d.leadConsultant ? <span>{d.leadConsultant.name}</span> : null}
                  <span className="ml-auto tnum text-ink-400">
                    {d.closeDate ? formatMedium(d.closeDate) : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
