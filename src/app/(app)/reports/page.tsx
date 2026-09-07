import Link from "next/link";
import { requireUser, isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRange } from "@/lib/dates";
import { formatHours, formatMoney } from "@/lib/format";
import {
  buildReport,
  GROUP_BY_OPTIONS,
  margin,
  marginPct,
  type ReportRow,
} from "@/lib/reporting";
import { parseReportParams, reportQueryString } from "@/lib/report-params";
import { PageHeader, Stat } from "@/components/ui";
import { ReportFilters } from "@/components/ReportFilters";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireUser();
  const raw = await searchParams;
  const params = parseReportParams(raw);
  const admin = isAdmin(viewer);

  // Members only ever see their own time; admins see the whole workspace.
  const scoped = admin
    ? params
    : { ...params, userIds: [viewer.id] };

  const [report, clients, projects, people] = await Promise.all([
    buildReport(
      {
        from: scoped.from,
        to: scoped.to,
        clientIds: scoped.clientIds,
        projectIds: scoped.projectIds,
        userIds: scoped.userIds,
        billable: scoped.billable,
        granularity: scoped.granularity,
      },
      scoped.groupBy,
      scoped.subGroupBy,
    ),
    db.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.project.findMany({
      select: { id: true, name: true, client: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    admin
      ? db.user.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([{ id: viewer.id, name: viewer.name }]),
  ]);

  const csvHref = `/reports/export?${reportQueryString(params)}`;
  const groupLabel =
    GROUP_BY_OPTIONS.find((g) => g.value === params.groupBy)?.label ??
    params.groupBy;
  const totalMargin = margin(report.totals);
  const totalMarginPct = marginPct(report.totals);

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle={
          admin
            ? `${formatRange(params.from, params.to)} · ${report.entryCount} time entries`
            : `Your time · ${formatRange(params.from, params.to)}`
        }
        actions={
          <>
            {admin ? (
              <Link href="/reports/budgets" className="btn-secondary">
                Budget vs actual
              </Link>
            ) : null}
            <a href={`${csvHref}&mode=detail`} className="btn-secondary">
              Export entries
            </a>
            <a href={csvHref} className="btn-primary">
              Export CSV
            </a>
          </>
        }
      />

      <ReportFilters
        params={params}
        clients={clients}
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          clientName: p.client?.name ?? null,
        }))}
        people={people}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Hours" value={`${formatHours(report.totals.minutes)}h`} />
        <Stat
          label="Billable value"
          value={formatMoney(report.totals.billableCents)}
          hint="Hours × bill rate, billable entries only"
        />
        {admin ? (
          <>
            <Stat
              label="Cost"
              value={formatMoney(report.totals.costCents)}
              hint="Hours × each person's cost rate"
            />
            <Stat
              label="Margin"
              value={formatMoney(totalMargin)}
              hint={totalMarginPct === null ? "No billable time" : `${totalMarginPct}%`}
              tone={totalMargin < 0 ? "bad" : "good"}
            />
          </>
        ) : null}
      </div>

      {report.rows.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink-700">
            No time logged in this range.
          </p>
          <p className="mt-1 text-sm text-ink-500">
            Try widening the dates or clearing a filter.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem]">
              <thead className="border-b border-ink-200 bg-ink-50">
                <tr>
                  <th className="th sticky left-0 z-10 bg-ink-50 min-w-[14rem]">
                    {groupLabel}
                  </th>
                  {report.columns.map((col) => (
                    <th key={col.key} className="th text-right whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                  <th className="th text-right">Hours</th>
                  <th className="th text-right">Billable</th>
                  {admin ? (
                    <>
                      <th className="th text-right">Cost</th>
                      <th className="th text-right">Margin</th>
                    </>
                  ) : null}
                </tr>
              </thead>

              <tbody className="divide-y divide-ink-100">
                {report.rows.map((row) => (
                  <RowGroup
                    key={row.key}
                    row={row}
                    columns={report.columns}
                    admin={admin}
                  />
                ))}
              </tbody>

              <tfoot>
                <tr className="border-t-2 border-ink-200 bg-ink-50 font-semibold">
                  <td className="td sticky left-0 z-10 bg-ink-50">Total</td>
                  {report.columns.map((col) => {
                    const minutes = report.rows.reduce(
                      (sum, r) => sum + (r.buckets[col.key]?.minutes ?? 0),
                      0,
                    );
                    return (
                      <td key={col.key} className="td text-right tnum">
                        {minutes ? formatHours(minutes) : "—"}
                      </td>
                    );
                  })}
                  <td className="td text-right tnum">
                    {formatHours(report.totals.minutes)}
                  </td>
                  <td className="td text-right tnum">
                    {formatMoney(report.totals.billableCents)}
                  </td>
                  {admin ? (
                    <>
                      <td className="td text-right tnum">
                        {formatMoney(report.totals.costCents)}
                      </td>
                      <td
                        className={`td text-right tnum ${
                          totalMargin < 0 ? "text-bad-700" : "text-good-700"
                        }`}
                      >
                        {formatMoney(totalMargin)}
                      </td>
                    </>
                  ) : null}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function RowGroup({
  row,
  columns,
  admin,
}: {
  row: ReportRow;
  columns: { key: string; label: string }[];
  admin: boolean;
}) {
  const rowMargin = margin(row);

  return (
    <>
      <tr className="hover:bg-ink-50/60">
        <td className="td sticky left-0 z-10 bg-white">
          <div className="font-medium text-ink-900">{row.label}</div>
          {row.sublabel ? (
            <div className="text-xs text-ink-500">{row.sublabel}</div>
          ) : null}
        </td>
        {columns.map((col) => {
          const minutes = row.buckets[col.key]?.minutes ?? 0;
          return (
            <td key={col.key} className="td text-right tnum text-ink-600">
              {minutes ? formatHours(minutes) : "—"}
            </td>
          );
        })}
        <td className="td text-right font-medium tnum">
          {formatHours(row.minutes)}
        </td>
        <td className="td text-right tnum">{formatMoney(row.billableCents)}</td>
        {admin ? (
          <>
            <td className="td text-right tnum">{formatMoney(row.costCents)}</td>
            <td
              className={`td text-right tnum ${
                rowMargin < 0 ? "text-bad-700" : "text-ink-800"
              }`}
            >
              {formatMoney(rowMargin)}
            </td>
          </>
        ) : null}
      </tr>

      {row.children?.map((child) => (
        <tr key={`${row.key}-${child.key}`} className="bg-ink-50/40 text-xs">
          <td className="td sticky left-0 z-10 bg-ink-50/40 pl-8 text-ink-600">
            {child.label}
          </td>
          {columns.map((col) => {
            const minutes = child.buckets[col.key]?.minutes ?? 0;
            return (
              <td key={col.key} className="td text-right tnum text-ink-500">
                {minutes ? formatHours(minutes) : "—"}
              </td>
            );
          })}
          <td className="td text-right tnum text-ink-700">
            {formatHours(child.minutes)}
          </td>
          <td className="td text-right tnum text-ink-600">
            {formatMoney(child.billableCents)}
          </td>
          {admin ? (
            <>
              <td className="td text-right tnum text-ink-600">
                {formatMoney(child.costCents)}
              </td>
              <td className="td text-right tnum text-ink-600">
                {formatMoney(margin(child))}
              </td>
            </>
          ) : null}
        </tr>
      ))}
    </>
  );
}
