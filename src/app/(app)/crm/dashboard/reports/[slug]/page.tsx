import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { loadReportDeals } from "@/lib/crm/report-data";
import { reportBySlug, type Column, type ReportDef } from "@/lib/crm/report-defs";
import {
  flatten,
  group,
  total,
  ROW_CAP,
  type ReportGroup,
  type ReportRow,
} from "@/lib/crm/reports";
import { rangeFromParams, TYPE_PARAM } from "@/lib/crm/dashboard-filters";

export const dynamic = "force-dynamic";

/**
 * A Salesforce report, as a report.
 *
 * Grouped rows with a subtotal at every level and a grand total at the end -
 * which is the structure of the answer, not decoration on a table. Both of
 * these came from RevOptics' own exports and are transcribed rather than
 * invented, down to the "Filtered By" block and the order of the columns.
 *
 * The filters arrive in the URL, which is how the dashboard hands them over:
 * clicking "View report" from a filtered dashboard opens the same deals, and
 * the two can never quietly disagree about what they are counting.
 */
export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; range?: string; year?: string }>;
}) {
  await requireUser();
  const { slug } = await params;
  const report = reportBySlug(slug);
  if (!report) notFound();

  const query = await searchParams;
  const range = rangeFromParams(query);
  const types = query[TYPE_PARAM] ? query[TYPE_PARAM]!.split(",").filter(Boolean) : [];

  const { rows, allTypes } = await loadReportDeals({
    from: range.from,
    to: range.to,
    types,
  });

  const shown = rows.slice(0, ROW_CAP);
  const groups = group(shown, report.levels);
  const grand = total(shown);

  const filters = report.filters({
    from: range.from,
    to: range.to,
    types: types.length ? types : allTypes,
  });

  // Group columns first, then the record columns - the same order Salesforce
  // printed, which is what makes the indent read as a hierarchy.
  const width = report.levels.length + report.columns.length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <p className="text-xs tracking-wide text-ink-500 uppercase">Report</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          {report.name}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          As of {new Date().toISOString().slice(0, 16).replace("T", " ")} UTC ·{" "}
          {grand.count.toLocaleString()} record{grand.count === 1 ? "" : "s"} ·{" "}
          <Link href="/crm/dashboard" className="underline">
            back to the dashboard
          </Link>
        </p>
      </div>

      <section className="card mb-4 p-4">
        <h2 className="mb-2 text-sm font-medium text-ink-900">Filtered by</h2>
        <ul className="space-y-1 text-sm text-ink-600">
          {filters.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>

      {shown.length < rows.length ? (
        <p className="mb-3 rounded-lg border border-warn-500/30 bg-warn-50 px-4 py-2.5 text-sm text-warn-700">
          Showing the first {ROW_CAP.toLocaleString()} of {rows.length.toLocaleString()}{" "}
          records. Narrow the filters to see the rest — the totals below count only
          what is shown.
        </p>
      ) : null}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[60rem] text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left">
              {report.levels.map((l) => (
                <th
                  key={l.label}
                  className="px-3 py-2 text-xs font-medium whitespace-nowrap text-ink-600"
                >
                  {l.label} ↑
                </th>
              ))}
              {report.columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-3 py-2 text-xs font-medium whitespace-nowrap text-ink-600 ${
                    c.align === "right" ? "text-right" : ""
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan={width} className="px-3 py-6 text-center text-ink-500">
                  No records match these filters.
                </td>
              </tr>
            ) : (
              groups.map((g) => (
                <GroupRows key={g.key} group={g} report={report} width={width} />
              ))
            )}
          </tbody>
          {groups.length > 0 ? (
            <tfoot>
              <tr className="border-t-2 border-ink-300 font-medium">
                <td
                  colSpan={report.levels.length}
                  className="px-3 py-2 whitespace-nowrap text-ink-900"
                >
                  Total ({grand.count.toLocaleString()} records)
                </td>
                {report.columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-3 py-2 tabular-nums whitespace-nowrap text-ink-900 ${
                      c.align === "right" ? "text-right" : ""
                    }`}
                  >
                    {c.money ? money(grand.sum) : ""}
                  </td>
                ))}
              </tr>
              {report.showAverage ? (
                <tr className="text-ink-600">
                  <td colSpan={report.levels.length} className="px-3 py-1.5">
                    Average
                  </td>
                  {report.columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-3 py-1.5 tabular-nums ${
                        c.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {c.money ? money(grand.average) : ""}
                    </td>
                  ))}
                </tr>
              ) : null}
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

/**
 * One group: its heading, then whatever is inside it, then its subtotal.
 *
 * Returns a fragment of rows rather than a nested table, so every column
 * stays aligned down the whole report however deep the grouping goes.
 */
function GroupRows({
  group: g,
  report,
  width,
}: {
  group: ReportGroup;
  report: ReportDef;
  width: number;
}) {
  const heading = (
    <tr key={`${g.key}-head`} className="bg-ink-50/70">
      <td
        colSpan={width}
        className="px-3 py-1.5 text-sm font-medium whitespace-nowrap text-ink-900"
        style={{ paddingLeft: 12 + g.level * 20 }}
      >
        {g.label || "—"}{" "}
        <span className="font-normal text-ink-500">
          ({g.count.toLocaleString()} {g.count === 1 ? "record" : "records"})
        </span>
      </td>
    </tr>
  );

  const body = g.rows.length
    ? g.rows.map((row) => (
        <Row key={row.id} row={row} report={report} indent={g.level + 1} />
      ))
    : g.groups.map((child) => (
        <GroupRows key={child.key} group={child} report={report} width={width} />
      ));

  const subtotal = (
    <tr key={`${g.key}-sum`} className="border-b border-ink-100 text-ink-700">
      <td
        colSpan={report.levels.length}
        className="px-3 py-1.5 text-xs whitespace-nowrap"
        style={{ paddingLeft: 12 + g.level * 20 }}
      >
        Subtotal — {g.label}
        {report.showAverage ? " · Sum / Avg" : ""}
      </td>
      {report.columns.map((c) => (
        <td
          key={c.key}
          className={`px-3 py-1.5 text-xs tabular-nums whitespace-nowrap ${
            c.align === "right" ? "text-right" : ""
          }`}
        >
          {c.money
            ? report.showAverage
              ? `${money(g.sum)} / ${money(g.average)}`
              : money(g.sum)
            : ""}
        </td>
      ))}
    </tr>
  );

  return (
    <>
      {heading}
      {body}
      {subtotal}
    </>
  );
}

function Row({
  row,
  report,
  indent,
}: {
  row: ReportRow;
  report: ReportDef;
  indent: number;
}) {
  return (
    <tr className="border-b border-ink-100/70 hover:bg-ink-50/50">
      {report.levels.map((l, i) => (
        <td key={l.label} style={i === 0 ? { paddingLeft: 12 + indent * 20 } : undefined} />
      ))}
      {report.columns.map((c) => {
        const raw = row.values[c.key] ?? "";
        const text = c.money ? money(Number(raw || 0)) : raw;
        const isName = c.key === "name";

        return (
          <td
            key={c.key}
            className={`px-3 py-1.5 whitespace-nowrap text-ink-700 ${
              c.align === "right" ? "text-right tabular-nums" : ""
            }`}
          >
            {isName && row.href ? (
              <Link href={row.href} className="text-ink-900 underline">
                {text}
              </Link>
            ) : (
              text || <span className="text-ink-300">—</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}
