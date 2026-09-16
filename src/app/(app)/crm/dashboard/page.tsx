import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  byDimension,
  dealType,
  groupByMonth,
  headline,
  seriesFor,
} from "@/lib/crm/report";
import { loadReportDeals } from "@/lib/crm/report-data";
import {
  dashboardTitle,
  ranges,
  rangeFromParams,
  typesFromParams,
} from "@/lib/crm/dashboard-filters";
import { CLOSED_WON_BY_MONTH, REVENUE_BY_TYPE } from "@/lib/crm/report-defs";
import { Donut, Figures, GroupedColumns, compact } from "@/components/crm/Chart";

export const dynamic = "force-dynamic";

/**
 * The dashboard RevOptics already reads, rebuilt.
 *
 * Two panels, the two filters above them, and under each panel a link to the
 * report it was drawn from - because "where does that number come from" is
 * the first question anybody asks of a dashboard, and the honest answer is a
 * list of the deals.
 *
 * The filters travel with those links. A dashboard filtered to Outreach opens
 * a report filtered to Outreach: both read the same loader, so they cannot
 * disagree about which deals they mean.
 *
 * Type here is Salesforce's single Type field, put back together from the two
 * OneSpace splits it into. The split is right for the database - a deal can
 * be Outreach *and* new business, which one picklist could never say - and
 * wrong for this page, which is read by people who have said "Type" to mean
 * this one thing for years.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; range?: string }>;
}) {
  await requireUser();
  const params = await searchParams;

  const range = rangeFromParams(params);
  const types = typesFromParams(params);
  const all = ranges();

  const { deals, rows, allTypes } = await loadReportDeals({
    from: range.from,
    to: range.to,
    types,
  });

  const stats = headline(deals);
  const byType = byDimension(deals, dealType);
  const series = seriesFor(deals, dealType);

  // The month axis stops at the last month with revenue rather than running
  // to December of a year that hasn't happened: eight empty columns make the
  // filled ones narrower and say nothing.
  const lastClosed = deals.reduce<Date | null>(
    (latest, d) => (d.closeDate && (!latest || d.closeDate > latest) ? d.closeDate : latest),
    null,
  );
  const to = lastClosed && lastClosed < range.to ? lastClosed : range.to;
  const months = groupByMonth(deals, range.from, to, dealType, series);

  const query = new URLSearchParams();
  if (params.range) query.set("range", params.range);
  if (params.type) query.set("type", params.type);
  const suffix = query.toString() ? `?${query}` : "";

  const link = (base: string, changes: Record<string, string | null>) => {
    const next = new URLSearchParams(query);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    const q = next.toString();
    return q ? `${base}?${q}` : base;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <p className="text-xs tracking-wide text-ink-500 uppercase">Dashboard</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          {dashboardTitle(range, types)}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Closed-won only · {stats.wonCount.toLocaleString()} deal
          {stats.wonCount === 1 ? "" : "s"} ·{" "}
          {range.from.toISOString().slice(0, 10)} to {to.toISOString().slice(0, 10)}
        </p>
      </div>

      {/* --------------------------------------------------------- filters */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Filter label="Type">
          <Chip href={link("/crm/dashboard", { type: null })} on={types.length === 0}>
            All
          </Chip>
          {allTypes.map((t) => (
            <Chip
              key={t}
              href={link("/crm/dashboard", { type: t })}
              on={types.length === 1 && types[0] === t}
            >
              {t}
            </Chip>
          ))}
        </Filter>

        <Filter label="Close date">
          {all.map((r) => (
            <Chip
              key={r.key}
              href={link("/crm/dashboard", { range: r.key === "fy" ? null : r.key })}
              on={range.key === r.key}
            >
              {r.label}
            </Chip>
          ))}
        </Filter>
      </div>

      {/* ---------------------------------------------------------- panels */}
      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <Panel
          title="Revenue by Type"
          report={REVENUE_BY_TYPE.name}
          href={`/crm/dashboard/reports/${REVENUE_BY_TYPE.slug}${suffix}`}
        >
          <Donut data={byType} total={stats.revenue} />
          <Figures rows={byType} total={stats.revenue} />
        </Panel>

        <Panel
          title="Revenue Won by Month"
          report={CLOSED_WON_BY_MONTH.name}
          href={`/crm/dashboard/reports/${CLOSED_WON_BY_MONTH.slug}${suffix}`}
        >
          <GroupedColumns data={months} series={series} />
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-ink-100">
              {months
                .filter((m) => m.total > 0)
                .map((m) => (
                  <tr key={m.key}>
                    <td className="py-1.5 pr-2 text-ink-700">{m.label}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums text-ink-500">
                      {m.count} {m.count === 1 ? "deal" : "deals"}
                    </td>
                    <td className="py-1.5 text-right font-medium tabular-nums text-ink-900">
                      ${Math.round(m.total).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* ------------------------------------------------------ the rest */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Stat label="Revenue won" value={`$${Math.round(stats.revenue).toLocaleString()}`} />
        <Stat label="Average deal" value={compact(stats.averageWon)} />
        <Stat
          label="Records"
          value={rows.length.toLocaleString()}
          note="what both reports list"
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-2 text-sm font-medium text-ink-900">Biggest clients</h2>
          <Figures
            rows={byDimension(deals, (d) => d.clientName, { top: 12 })}
            total={stats.revenue}
          />
        </section>
        <section className="card p-5">
          <h2 className="mb-2 text-sm font-medium text-ink-900">By owner</h2>
          <Figures
            rows={byDimension(deals, (d) => d.ownerName, { noneLabel: "Nobody" })}
            total={stats.revenue}
          />
        </section>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        Revenue means closed-won only, by close date. A deal with no close date
        can&apos;t be placed in a month and is outside every figure here — which is
        the same rule Salesforce applied, and the reason these totals match the
        exports rather than approximately matching them.{" "}
        <Link href="/crm/deals" className="underline">
          All deals
        </Link>
      </p>
    </div>
  );
}

function Panel({
  title,
  report,
  href,
  children,
}: {
  title: string;
  report: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card flex flex-col p-5">
      <h2 className="mb-4 text-sm font-medium text-ink-900">{title}</h2>
      <div className="flex-1">{children}</div>
      <p className="mt-4 border-t border-ink-100 pt-3 text-xs">
        <Link href={href} className="text-brand-600 underline">
          View report ({report})
        </Link>
      </p>
    </section>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="card p-3">
      <p className="mb-1.5 text-xs font-medium text-ink-600">{label}</p>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

/** A filter as links, so a view can be sent to somebody. */
function Chip({
  href,
  on,
  children,
}: {
  href: string;
  on: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={on ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}>
      {children}
    </Link>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold tabular-nums text-ink-900">{value}</p>
      {note ? <p className="text-xs text-ink-400">{note}</p> : null}
    </div>
  );
}
