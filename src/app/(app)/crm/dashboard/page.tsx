import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  byDimension,
  byMonth,
  byYear,
  headline,
  seriesFor,
  stackByYear,
  yearOf,
  type ReportDeal,
} from "@/lib/crm/report";
import { crmHref } from "@/lib/crm/view";
import { Columns, Figures, StackedColumns, compact } from "@/components/crm/Chart";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * What was closed, and what it was made of.
 *
 * Built around the shape of the data rather than around a Salesforce report
 * page: 98% of these deals are closed, so this is a record of what happened,
 * not a forecast. The headline is revenue won; everything under it answers
 * "made of what" - which year, which month, which platform, which client,
 * whose deal.
 *
 * Every chart is followed by its numbers written out. That is not a
 * fallback: three of the four series colours sit under 3:1 against this
 * page, so the figures are how the values are actually read, with the chart
 * carrying the shape.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    platform?: string;
    business?: string;
    owner?: string;
  }>;
}) {
  await requireUser();
  const params = await searchParams;
  const current = {
    year: params.year,
    platform: params.platform,
    business: params.business,
    owner: params.owner,
  };

  const rows = await db.deal.findMany({
    select: {
      id: true,
      amount: true,
      closeDate: true,
      isWon: true,
      isClosed: true,
      businessType: true,
      partner: { select: { name: true } },
      client: { select: { name: true } },
      owner: { select: { name: true } },
    },
  });

  const all: ReportDeal[] = rows.map((d) => ({
    id: d.id,
    amount: d.amount === null ? null : Number(d.amount),
    closeDate: d.closeDate,
    isWon: d.isWon,
    isClosed: d.isClosed,
    platform: d.partner?.name ?? null,
    businessType: d.businessType,
    clientName: d.client.name,
    ownerName: d.owner?.name ?? null,
  }));

  // Filters narrow what every figure below is computed from, so the headline
  // and the breakdowns can never disagree about which deals they mean.
  const deals = all.filter(
    (d) =>
      (!params.year || String(yearOf(d)) === params.year) &&
      (!params.platform || (d.platform ?? "Direct") === params.platform) &&
      (!params.business || (d.businessType ?? "Not recorded") === params.business) &&
      (!params.owner || (d.ownerName ?? "Nobody") === params.owner),
  );

  const stats = headline(deals);
  const years = byYear(deals);
  const platforms = seriesFor(all, (d) => d.platform, { noneLabel: "Direct" });
  const stacked = stackByYear(deals, (d) => d.platform, platforms, "Direct");

  // The month view needs a year. Default to the most recent one with revenue.
  const focusYear = params.year
    ? Number(params.year)
    : (years.at(-1)?.key ? Number(years.at(-1)!.key) : new Date().getUTCFullYear());
  const months = byMonth(deals, focusYear);

  const allYears = byYear(all).map((b) => b.label).reverse();
  const businesses = seriesFor(all, (d) => d.businessType);
  const owners = seriesFor(all, (d) => d.ownerName, { noneLabel: "Nobody" });

  const filtered = Boolean(
    params.year || params.platform || params.business || params.owner,
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Closed business"
        subtitle={
          filtered
            ? "Filtered — every figure below counts the same deals."
            : "Everything RevOptics has won, and what it was made of."
        }
      />

      {/* ------------------------------------------------------------ filters */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <Picker
          label="Year"
          base="/crm/dashboard"
          current={current}
          name="year"
          options={allYears}
          value={params.year}
        />
        <Picker
          label="Platform"
          base="/crm/dashboard"
          current={current}
          name="platform"
          options={platforms}
          value={params.platform}
        />
        <Picker
          label="Type"
          base="/crm/dashboard"
          current={current}
          name="business"
          options={businesses}
          value={params.business}
        />
        <Picker
          label="Owner"
          base="/crm/dashboard"
          current={current}
          name="owner"
          options={owners}
          value={params.owner}
        />
        {filtered ? (
          <Link
            href="/crm/dashboard"
            className="text-xs text-ink-500 underline decoration-ink-300 hover:text-ink-800"
          >
            Clear
          </Link>
        ) : null}
        <Link href="/crm/deals" className="btn-ghost btn-sm ml-auto">
          All deals
        </Link>
      </div>

      {/* ----------------------------------------------------------- headline */}
      <div className="card mb-4 p-5">
        <p className="text-sm text-ink-600">Revenue won</p>
        <p className="mt-0.5 text-5xl font-semibold tracking-tight tabular-nums text-ink-900">
          ${Math.round(stats.revenue).toLocaleString()}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <Stat label="Deals won" value={stats.wonCount.toLocaleString()} />
          <Stat label="Average deal" value={compact(stats.averageWon)} />
          <Stat
            label="Win rate"
            value={stats.winRate === null ? "—" : `${Math.round(stats.winRate * 100)}%`}
            note={`${stats.wonCount} of ${stats.wonCount + stats.lostCount} decided`}
          />
          <Stat
            label="Still open"
            value={stats.openCount.toLocaleString()}
            note={stats.openValue > 0 ? compact(stats.openValue) : undefined}
          />
        </div>
      </div>

      {/* --------------------------------------------------------- by year */}
      <section className="card mb-4 p-5">
        <h2 className="mb-1 text-sm font-medium text-ink-900">Year by year</h2>
        <p className="mb-4 text-xs text-ink-500">
          Closed-won revenue by the year the deal closed.
        </p>
        <Columns data={years} />
        <Figures rows={years} total={stats.revenue} />
      </section>

      {/* -------------------------------------------------------- by month */}
      <section className="card mb-4 p-5">
        <h2 className="mb-1 text-sm font-medium text-ink-900">
          Month by month · {focusYear}
        </h2>
        <p className="mb-4 text-xs text-ink-500">
          {params.year
            ? "The year you picked above."
            : "The most recent year with revenue. Pick a year above to change it."}
        </p>
        <Columns data={months} />
        <Figures rows={months.filter((m) => m.count > 0)} />
      </section>

      {/* ----------------------------------------------------- by platform */}
      {platforms.length > 1 ? (
        <section className="card mb-4 p-5">
          <h2 className="mb-1 text-sm font-medium text-ink-900">
            Platform, year by year
          </h2>
          <p className="mb-4 text-xs text-ink-500">
            Outreach, Salesloft and the rest, stacked within each year.
          </p>
          <StackedColumns data={stacked} series={platforms} />
          <Figures
            rows={byDimension(deals, (d) => d.platform, { noneLabel: "Direct" })}
            total={stats.revenue}
          />
        </section>
      ) : null}

      {/* ------------------------------------------------- the other splits */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="New against existing business">
          <Figures
            rows={byDimension(deals, (d) => d.businessType)}
            total={stats.revenue}
          />
        </Panel>
        <Panel title="By owner">
          <Figures
            rows={byDimension(deals, (d) => d.ownerName, { noneLabel: "Nobody" })}
            total={stats.revenue}
          />
        </Panel>
      </div>

      <section className="card mt-4 p-5">
        <h2 className="mb-1 text-sm font-medium text-ink-900">Biggest clients</h2>
        <p className="mb-2 text-xs text-ink-500">
          By revenue won. Everything past the top fifteen is folded into Other, so
          the rows still add up to the headline.
        </p>
        <Figures
          rows={byDimension(deals, (d) => d.clientName, { top: 15 })}
          total={stats.revenue}
        />
      </section>

      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        Revenue means closed-won only. Lost deals are counted in the win rate and
        nowhere else. Deals with no close date can&apos;t be placed in a year, so
        they sit outside the year and month charts while still counting towards
        the headline.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="text-lg font-medium tabular-nums text-ink-900">{value}</p>
      {note ? <p className="text-xs text-ink-400">{note}</p> : null}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-1 text-sm font-medium text-ink-900">{title}</h2>
      {children}
    </section>
  );
}

/** A filter as links, so a view can be sent to somebody. */
function Picker({
  label,
  base,
  current,
  name,
  options,
  value,
}: {
  label: string;
  base: string;
  current: Record<string, string | undefined>;
  name: string;
  options: string[];
  value: string | undefined;
}) {
  if (options.length < 2) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-xs text-ink-500">{label}</span>
      <span className="flex flex-wrap gap-1">
        <Link
          href={crmHref(base, current, { [name]: null })}
          className={value ? "btn-ghost btn-sm" : "btn-secondary btn-sm"}
        >
          All
        </Link>
        {options.slice(0, 6).map((o) => (
          <Link
            key={o}
            href={crmHref(base, current, { [name]: o })}
            className={value === o ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
          >
            {o}
          </Link>
        ))}
      </span>
    </span>
  );
}
