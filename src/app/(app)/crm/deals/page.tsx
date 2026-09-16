import { Fragment } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMedium } from "@/lib/dates";
import { crmHref, money, searchWhere } from "@/lib/crm/view";
import { sections, summary, type PipelineDeal, type Section } from "@/lib/crm/pipeline";
import { EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * Every deal, as one report.
 *
 * Not four filtered lists behind tabs. "How are we doing" is answered by
 * seeing the pipeline and the recent wins on the same screen, and a tab that
 * shows one at a time makes you hold the other in your head while you look.
 *
 * Three sections in reading order - what is still live, what was won, what
 * was lost - with the pipeline grouped by stage and the closed work grouped
 * by month, newest first. Pipeline is the one place that isn't newest-first:
 * it leads with what is closest to signing, because that is the order
 * somebody works down it. The stages there are the stage path reversed.
 *
 * The filters narrow every section and every total at once, so the headline
 * and the rows below it can never be counting different deals.
 */

/** Enough to read; past this the page is a data export, not a report. */
const LIMIT = 600;

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; owner?: string; type?: string; year?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const current = {
    q: params.q,
    owner: params.owner,
    type: params.type,
    year: params.year,
  };

  const year = params.year && /^\d{4}$/.test(params.year) ? Number(params.year) : null;

  const where = {
    ...searchWhere(q, ["name"]),
    ...(params.owner ? { owner: { name: params.owner } } : {}),
    ...(params.type === "Direct"
      ? { partnerId: null }
      : params.type
        ? { partner: { name: params.type } }
        : {}),
    ...(year
      ? {
          closeDate: {
            gte: new Date(Date.UTC(year, 0, 1)),
            lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
          },
        }
      : {}),
  };

  const [rows, total, owners, partners, years] = await Promise.all([
    db.deal.findMany({
      where,
      // Ordered again in the report, but ordering here decides which deals
      // survive the cap - and the newest are the ones worth keeping.
      orderBy: [{ closeDate: "desc" }, { createdAt: "desc" }],
      take: LIMIT,
      select: {
        id: true,
        name: true,
        stage: true,
        amount: true,
        closeDate: true,
        isWon: true,
        isClosed: true,
        probability: true,
        nextStep: true,
        businessType: true,
        createdAt: true,
        client: { select: { id: true, name: true } },
        owner: { select: { name: true } },
        partner: { select: { name: true } },
        leadConsultant: { select: { name: true } },
      },
    }),
    db.deal.count({ where }),
    db.user.findMany({
      where: { ownedDeals: { some: {} } },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    db.partner.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    db.deal.findMany({
      where: { closeDate: { not: null } },
      select: { closeDate: true },
      orderBy: { closeDate: "desc" },
      distinct: ["closeDate"],
      take: 2000,
    }),
  ]);

  const deals: PipelineDeal[] = rows.map((d) => ({
    id: d.id,
    name: d.name,
    stage: d.stage,
    amount: d.amount === null ? null : Number(d.amount),
    closeDate: d.closeDate,
    isWon: d.isWon,
    isClosed: d.isClosed,
    probability: d.probability,
    clientId: d.client.id,
    clientName: d.client.name,
    ownerName: d.owner?.name ?? null,
    partnerName: d.partner?.name ?? null,
    businessType: d.businessType,
    consultantName: d.leadConsultant?.name ?? null,
    nextStep: d.nextStep,
    createdAt: d.createdAt,
  }));

  const stats = summary(deals);
  const report = sections(deals);
  const allYears = [
    ...new Set(years.map((y) => y.closeDate!.getUTCFullYear())),
  ].sort((a, b) => b - a);

  const filtered = Boolean(q || params.owner || params.type || params.year);

  /**
   * A link into the report, carrying whatever the page is already filtered
   * to. Clicking a figure has to open the deals that made that figure - not
   * a similar set that happens to be lying around.
   */
  const reportHref = (extra: Record<string, string>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({
      q: params.q,
      owner: params.owner,
      type: params.type,
      year: params.year,
      ...extra,
    })) {
      if (v) next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `/crm/deals/report?${qs}` : "/crm/deals/report";
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Deals"
        subtitle={
          filtered
            ? `${total.toLocaleString()} matching. Every figure below counts the same deals.`
            : `${total.toLocaleString()} deals — the pipeline, then everything closed, newest first.`
        }
        actions={
          <Link href="/crm/deals/new" className="btn-primary btn-sm">
            New deal
          </Link>
        }
      />

      {/* ------------------------------------------------------------ figures */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* The overdue part is the warning, not the whole pipeline. Colouring
            the headline would say every one of these deals is late. */}
        <Tile
          href={reportHref({ band: "pipeline" })}
          label="In pipeline"
          value={money(stats.openValue)}
          note={`${stats.openCount} open`}
          alert={
            stats.overdueCount
              ? `${stats.overdueCount} past ${
                  stats.overdueCount === 1 ? "its" : "their"
                } close date · ${money(stats.overdueValue)}`
              : undefined
          }
        />
        <Tile
          href={reportHref({ band: "won", within: "90" })}
          label="Won in the last 90 days"
          value={money(stats.recentWonValue)}
          note={`${stats.recentWonCount} deal${stats.recentWonCount === 1 ? "" : "s"}`}
          tone="good"
        />
        <Tile
          href={reportHref({ band: "won" })}
          label="Won, all shown"
          value={money(stats.wonValue)}
          note={`${stats.wonCount} deals · ${money(stats.averageWon)} average`}
        />
        <Tile
          href={reportHref({ band: "all" })}
          label="Win rate"
          value={stats.winRate === null ? "—" : `${Math.round(stats.winRate * 100)}%`}
          note={
            stats.winRate === null
              ? "Nothing has been decided yet"
              : `${stats.wonCount} of ${stats.wonCount + stats.lostCount} decided`
          }
        />
      </div>

      {/* ------------------------------------------------------------ filters */}
      <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <form className="flex items-end gap-2" action="/crm/deals">
          {params.owner ? <input type="hidden" name="owner" value={params.owner} /> : null}
          {params.type ? <input type="hidden" name="type" value={params.type} /> : null}
          {params.year ? <input type="hidden" name="year" value={params.year} /> : null}
          <div>
            <label className="label" htmlFor="q">
              Search
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Deal name"
              className="input"
            />
          </div>
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>

        <Picker
          label="Type"
          name="type"
          current={current}
          value={params.type}
          options={["Direct", ...partners.map((p) => p.name)]}
        />
        <Picker
          label="Owner"
          name="owner"
          current={current}
          value={params.owner}
          options={owners.map((o) => o.name)}
        />
        <Picker
          label="Close year"
          name="year"
          current={current}
          value={params.year}
          options={allYears.map(String)}
        />

        {filtered ? (
          <Link href="/crm/deals" className="btn-ghost btn-sm">
            Clear
          </Link>
        ) : null}
      </div>

      {total > rows.length ? (
        <p className="mb-3 rounded-lg border border-warn-500/30 bg-warn-50 px-4 py-2.5 text-sm text-warn-700">
          Showing the {LIMIT.toLocaleString()} most recent of {total.toLocaleString()}{" "}
          deals. The figures above count only what is shown — narrow by close year
          to see the rest.
        </p>
      ) : null}

      {deals.length === 0 ? (
        <EmptyState
          title="No deals match that"
          body="Try a shorter search, or clear the filters."
        />
      ) : (
        report
          .filter((s) => s.count > 0)
          .map((s) => (
            <Band key={s.band} section={s} reportHref={reportHref} />
          ))
      )}
    </div>
  );
}

function Band({
  section,
  reportHref,
}: {
  section: Section;
  reportHref: (extra: Record<string, string>) => string;
}) {
  const band =
    section.band === "PIPELINE" ? "pipeline" : section.band === "WON" ? "won" : "lost";

  return (
    <section className="card mb-4 overflow-hidden p-0">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-ink-200 px-4 py-3">
        <h2 className="text-sm font-medium text-ink-900">{section.label}</h2>
        <span className="text-xs text-ink-500">
          {section.count.toLocaleString()} {section.count === 1 ? "deal" : "deals"}
        </span>
        <span className="ml-auto text-sm font-medium tabular-nums text-ink-900">
          {money(section.total)}{" "}
          <span className="text-xs font-normal text-ink-500">
            {section.totalLabel}
          </span>
        </span>
      </header>

      <table className="w-full text-sm">
        <tbody>
          {section.groups.map((group) => (
            // A keyed Fragment, because a group is a heading row plus its
            // deals and a table cannot nest a wrapper around them.
            <Fragment key={group.key}>
              <tr className="bg-ink-50/70">
                <th
                  colSpan={5}
                  className="px-4 py-1.5 text-left text-xs font-medium text-ink-700"
                >
                  {/* A stage heading opens that stage; a month heading has no
                      filter of its own, so it opens the section sorted by
                      close date, which lands the month at the top. */}
                  {section.band === "PIPELINE" ? (
                    <Link
                      href={reportHref({ band, stage: group.key })}
                      className="underline"
                    >
                      {group.label}
                    </Link>
                  ) : (
                    group.label
                  )}{" "}
                  <span className="font-normal text-ink-500">
                    · {group.deals.length}{" "}
                    {group.deals.length === 1 ? "deal" : "deals"} ·{" "}
                    {money(group.total)}
                  </span>
                  {group.note ? (
                    <span className="block font-normal text-ink-500">{group.note}</span>
                  ) : null}
                </th>
              </tr>

              {group.deals.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-ink-100/70 align-baseline hover:bg-ink-50/50"
                >
                  <td className="px-4 py-2">
                    <Link href={`/crm/deals/${d.id}`} className="text-ink-900 underline">
                      {d.name}
                    </Link>
                    {d.nextStep && section.band === "PIPELINE" ? (
                      <p className="text-xs text-ink-500">Next: {d.nextStep}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/crm/${d.clientId}`}
                      className="text-xs text-ink-600 underline"
                    >
                      {d.clientName}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap text-ink-500">
                    {[d.partnerName ?? "Direct", d.ownerName].filter(Boolean).join(" · ")}
                  </td>
                  <td className="px-3 py-2 text-right text-xs whitespace-nowrap text-ink-500">
                    {d.closeDate ? formatMedium(d.closeDate) : "no close date"}
                    {section.band === "PIPELINE" && d.probability !== null ? (
                      <span className="block">{d.probability}%</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-right font-medium tabular-nums whitespace-nowrap text-ink-900">
                    {money(d.amount)}
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>

      <footer className="border-t border-ink-100 px-4 py-2.5 text-xs">
        <Link href={reportHref({ band })} className="text-brand-600 underline">
          View report ({section.label})
        </Link>
        <span className="text-ink-400"> — every row, sortable, with a CSV.</span>
      </footer>
    </section>
  );
}

function Tile({
  href,
  label,
  value,
  note,
  alert,
  tone,
}: {
  /** Where the rows behind this figure live. */
  href: string;
  label: string;
  value: string;
  note: string;
  /** A second line that is the thing to act on, coloured as such. */
  alert?: string;
  tone?: "good";
}) {
  return (
    <Link href={href} className="card block p-4 transition-colors hover:border-brand-300">
      <p className="text-xs text-ink-500">{label}</p>
      <p
        className={`mt-0.5 text-2xl font-semibold tabular-nums ${
          tone === "good" ? "text-brand-700" : "text-ink-900"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-ink-500">{note}</p>
      {alert ? <p className="text-xs font-medium text-warn-700">{alert}</p> : null}
      <p className="mt-2 text-xs text-brand-600 underline">View report</p>
    </Link>
  );
}

/** A filter as links, so a view can be sent to somebody. */
function Picker({
  label,
  name,
  current,
  value,
  options,
}: {
  label: string;
  name: string;
  current: Record<string, string | undefined>;
  value: string | undefined;
  options: string[];
}) {
  if (options.length === 0) return null;
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-1">
        <Link
          href={crmHref("/crm/deals", current, { [name]: null })}
          className={value ? "btn-ghost btn-sm" : "btn-secondary btn-sm"}
        >
          All
        </Link>
        {options.slice(0, 8).map((o) => (
          <Link
            key={o}
            href={crmHref("/crm/deals", current, { [name]: o })}
            className={value === o ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
          >
            {o}
          </Link>
        ))}
      </div>
    </div>
  );
}
