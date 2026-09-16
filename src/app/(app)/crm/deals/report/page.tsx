import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatMedium } from "@/lib/dates";
import { STAGE_LABEL, money } from "@/lib/crm/view";
import { loadDeals } from "@/lib/crm/deal-data";
import { bandOf } from "@/lib/crm/pipeline";
import {
  BAND_LABEL,
  COLUMNS,
  asBand,
  asDirection,
  bandParam,
  choicesFor,
  filterDeals,
  isSortKey,
  sortDeals,
  type Direction,
  type SortKey,
} from "@/lib/crm/deal-report";
import { EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * The rows behind a figure, sortable and filterable.
 *
 * Every number on the Deals page links here with the filters that produced
 * it already applied, so "where does that come from" is one click and the
 * answer is the deals themselves.
 *
 * Column headings sort. Clicking the one already sorted flips it; clicking a
 * new one starts it the way that column is usually read - money and dates
 * biggest and most recent first, names A to Z. All of it is links and a
 * plain form, so it works with the keyboard, survives a refresh, and can be
 * sent to somebody as a URL.
 */

/** Sorting happens in memory, so this is the honest ceiling. */
const LIMIT = 3000;

export default async function DealReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser();
  const params = await searchParams;

  const band = asBand(params.band);
  const sort: SortKey = isSortKey(params.sort) ? params.sort : "close";
  const dir: Direction = asDirection(params.dir);
  const withinDays = params.within ? Number(params.within) : undefined;

  const loaded = await loadDeals(
    { q: params.q, owner: params.owner, type: params.type, year: params.year },
    LIMIT,
  );

  // The band and the column filters narrow what was loaded; the query
  // filters already narrowed what was loaded. Both end up in the same list,
  // which is the one that gets totalled and the one that gets shown.
  const inBand = filterDeals(loaded.deals, {
    band,
    withinDays: Number.isFinite(withinDays) ? withinDays : undefined,
  });
  const rows = sortDeals(
    filterDeals(inBand, {
      account: params.account,
      type: params.ptype,
      owner: params.powner,
      stage: params.stage,
    }),
    sort,
    dir,
  );

  const total = rows.reduce((s, d) => s + (d.amount ?? 0), 0);

  const keep = {
    band: params.band,
    within: params.within,
    q: params.q,
    owner: params.owner,
    type: params.type,
    year: params.year,
    account: params.account,
    ptype: params.ptype,
    powner: params.powner,
    stage: params.stage,
  };

  const href = (changes: Record<string, string | undefined | null>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...keep, ...changes })) {
      if (v) next.set(k, v);
    }
    // Sort belongs in the URL too, so a sorted view can be sent to somebody.
    if (changes.sort === undefined) {
      if (params.sort) next.set("sort", params.sort);
      if (params.dir) next.set("dir", params.dir);
    }
    const q = next.toString();
    return q ? `/crm/deals/report?${q}` : "/crm/deals/report";
  };

  const sortHref = (key: SortKey) => {
    const column = COLUMNS.find((c) => c.key === key)!;
    // Clicking the sorted column flips it; a new column starts the way that
    // column is usually read.
    const nextDir: Direction =
      sort === key ? (dir === "asc" ? "desc" : "asc") : column.first;
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(keep)) if (v) next.set(k, v);
    next.set("sort", key);
    next.set("dir", nextDir);
    return `/crm/deals/report?${next}`;
  };

  const csvHref = () => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(keep)) if (v) next.set(k, v);
    next.set("sort", sort);
    next.set("dir", dir);
    return `/crm/deals/report/csv?${next}`;
  };

  const title =
    withinDays !== undefined
      ? `${BAND_LABEL[band]} — last ${withinDays} days`
      : BAND_LABEL[band];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Report"
        title={title}
        subtitle={
          <>
            {rows.length.toLocaleString()} {rows.length === 1 ? "deal" : "deals"} ·{" "}
            {money(total)} ·{" "}
            <Link href="/crm/deals" className="underline">
              back to Deals
            </Link>
          </>
        }
        actions={
          <a href={csvHref()} className="btn-secondary btn-sm">
            Download CSV
          </a>
        }
      />

      {/* ---------------------------------------------------- band and filters */}
      <div className="card mb-4 p-4">
        <div className="mb-3 flex flex-wrap gap-1">
          {(["all", "PIPELINE", "WON", "LOST"] as const).map((b) => (
            <Link
              key={b}
              href={href({ band: b === "all" ? null : bandParam(b), within: null })}
              className={band === b ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
            >
              {BAND_LABEL[b]}
            </Link>
          ))}
        </div>

        {/* A plain GET form: the dropdowns are the column filters, Apply is
            the only thing a browser needs to submit them. Auto-submitting on
            change would want JavaScript and would fight the back button. */}
        <form action="/crm/deals/report" className="flex flex-wrap items-end gap-3">
          {Object.entries({
            band: params.band,
            within: params.within,
            sort: params.sort,
            dir: params.dir,
          }).map(([k, v]) =>
            v ? <input key={k} type="hidden" name={k} value={v} /> : null,
          )}

          <Field label="Search">
            <input name="q" defaultValue={params.q ?? ""} className="input" placeholder="Deal or account" />
          </Field>
          <Choice label="Account" name="account" value={params.account} options={choicesFor(inBand, "account")} />
          <Choice label="Type" name="ptype" value={params.ptype} options={choicesFor(inBand, "type")} />
          <Choice label="Owner" name="powner" value={params.powner} options={choicesFor(inBand, "owner")} />
          <Choice
            label="Stage"
            name="stage"
            value={params.stage}
            options={choicesFor(inBand, "stage")}
            labels={STAGE_LABEL}
          />
          <Choice label="Close year" name="year" value={params.year} options={loaded.years.map(String)} />

          <button type="submit" className="btn-secondary">
            Apply
          </button>
          <Link href={href({ account: null, ptype: null, powner: null, stage: null, q: null, year: null })} className="btn-ghost btn-sm">
            Clear filters
          </Link>
        </form>
      </div>

      {loaded.total > loaded.deals.length ? (
        <p className="mb-3 rounded-lg border border-warn-500/30 bg-warn-50 px-4 py-2.5 text-sm text-warn-700">
          {loaded.total.toLocaleString()} deals match before the cap; the most recent{" "}
          {LIMIT.toLocaleString()} are loaded. Narrow by close year for the rest.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title="Nothing matches" body="Clear a filter and try again." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[56rem] text-sm">
            <thead>
              <tr className="border-b border-ink-200">
                {COLUMNS.map((c) => {
                  const on = sort === c.key;
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={on ? (dir === "asc" ? "ascending" : "descending") : "none"}
                      className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${
                        c.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      <Link
                        href={sortHref(c.key)}
                        className={`inline-flex items-center gap-1 hover:text-ink-900 ${
                          on ? "text-ink-900" : "text-ink-600"
                        }`}
                      >
                        {c.label}
                        <span aria-hidden className={on ? "text-brand-600" : "text-ink-300"}>
                          {on ? (dir === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      </Link>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-ink-100/70 hover:bg-ink-50/50">
                  <td className="px-3 py-2">
                    <Link href={`/crm/deals/${d.id}`} className="text-ink-900 underline">
                      {d.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/crm/${d.clientId}`} className="text-ink-700 underline">
                      {d.clientName}
                    </Link>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-ink-600">
                    {d.partnerName ?? "Direct"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-ink-600">
                    {d.ownerName ?? "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`chip ${
                        bandOf(d) === "WON"
                          ? "bg-brand-100 text-brand-700"
                          : bandOf(d) === "LOST"
                            ? "bg-ink-100 text-ink-600"
                            : "bg-warn-50 text-warn-700"
                      }`}
                    >
                      {STAGE_LABEL[d.stage]}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-ink-600">
                    {d.closeDate ? formatMedium(d.closeDate) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-ink-600">
                    {d.probability === null ? "—" : `${d.probability}%`}
                  </td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums whitespace-nowrap text-ink-900">
                    {money(d.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink-300 font-medium">
                <td colSpan={COLUMNS.length - 1} className="px-3 py-2 text-ink-900">
                  {rows.length.toLocaleString()} {rows.length === 1 ? "deal" : "deals"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-ink-900">
                  {money(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

function Choice({
  label,
  name,
  value,
  options,
  labels,
}: {
  label: string;
  name: string;
  value: string | undefined;
  options: string[];
  labels?: Record<string, string>;
}) {
  if (options.length < 2) return null;
  return (
    <Field label={label}>
      <select name={name} defaultValue={value ?? ""} className="input">
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {labels?.[o] ?? o}
          </option>
        ))}
      </select>
    </Field>
  );
}
