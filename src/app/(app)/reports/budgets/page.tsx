import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatRange } from "@/lib/dates";
import { formatHours, formatMoney } from "@/lib/format";
import { buildBudgetReport } from "@/lib/reporting";
import { parseReportParams, reportQueryString } from "@/lib/report-params";
import { BillingTypeBadge } from "@/components/BillingTypeField";
import { PageHeader, ProgressBar, Stat } from "@/components/ui";
import { ReportFilters } from "@/components/ReportFilters";

export const dynamic = "force-dynamic";

export default async function BudgetReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const raw = await searchParams;
  const params = parseReportParams(raw);

  const [rows, clients, partners, projects] = await Promise.all([
    buildBudgetReport({
      from: params.from,
      to: params.to,
      clientIds: params.clientIds,
      partnerIds: params.partnerIds,
      projectIds: params.projectIds,
    }),
    db.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.partner.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.project.findMany({
      select: { id: true, name: true, client: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  // Projects with no budget and no time in range are just noise here.
  const visible = rows.filter(
    (r) => r.actualMinutes > 0 || r.budgetHours || r.budgetCents,
  );

  const totals = visible.reduce(
    (acc, r) => ({
      minutes: acc.minutes + r.actualMinutes,
      cost: acc.cost + r.actualCostCents,
      revenue: acc.revenue + r.revenueCents,
      budget: acc.budget + (r.budgetCents ?? 0),
    }),
    { minutes: 0, cost: 0, revenue: 0, budget: 0 },
  );

  const atRisk = visible.filter((r) => r.overHours || r.overBudget);

  return (
    <div>
      <PageHeader
        title="Budget vs actual"
        subtitle={`${formatRange(params.from, params.to)} · actuals costed at each person's real hourly cost.`}
        actions={
          <>
            <Link href="/reports" className="btn-secondary">
              Time report
            </Link>
            <a
              href={`/reports/export?${reportQueryString(params, { mode: "budgets" })}`}
              className="btn-primary"
            >
              Export CSV
            </a>
          </>
        }
      />

      <ReportFilters
        params={params}
        clients={clients}
        partners={partners}
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          clientName: p.client?.name ?? null,
        }))}
        people={[]}
        action="/reports/budgets"
        showGrouping={false}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Hours" value={`${formatHours(totals.minutes)}h`} />
        <Stat label="Cost" value={formatMoney(totals.cost)} />
        <Stat
          label="Revenue"
          value={formatMoney(totals.revenue)}
          hint={`${formatMoney(totals.revenue - totals.cost)} margin`}
          tone={totals.revenue - totals.cost < 0 ? "bad" : "good"}
        />
        <Stat
          label="Over budget"
          value={atRisk.length}
          tone={atRisk.length > 0 ? "bad" : "good"}
          hint={atRisk.length === 0 ? "Everything inside its budget" : "Projects to look at"}
        />
      </div>

      {visible.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-ink-500">
          No projects with budgets or logged time in this range.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[54rem]">
              <thead className="border-b border-ink-200 bg-ink-50">
                <tr>
                  <th className="th min-w-[14rem]">Project</th>
                  <th className="th text-right">Hours</th>
                  <th className="th w-40">Hours budget</th>
                  <th className="th text-right">Cost</th>
                  <th className="th w-40">Cost vs budget</th>
                  <th className="th text-right">Revenue</th>
                  <th className="th text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {visible.map((row) => (
                    <tr key={row.projectId} className="hover:bg-ink-50/60">
                      <td className="td">
                        <Link
                          href={`/projects/${row.projectId}`}
                          className="font-medium text-ink-900 hover:text-brand-700"
                        >
                          {row.projectName}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-ink-500">
                          <span>
                            {row.clientName ?? "No client"}
                            {row.partnerName ? ` · via ${row.partnerName}` : ""}
                          </span>
                          <BillingTypeBadge type={row.billingType} />
                        </div>
                      </td>

                      <td className="td text-right tnum font-medium">
                        {formatHours(row.actualMinutes)}
                      </td>

                      <td className="td">
                        {row.budgetHours ? (
                          <ProgressBar
                            value={row.actualMinutes / 60}
                            max={row.budgetHours}
                            label={`${row.hoursUsedPct}% of ${row.budgetHours}h`}
                          />
                        ) : (
                          <span className="text-xs text-ink-400">—</span>
                        )}
                      </td>

                      <td className="td text-right tnum">
                        {formatMoney(row.actualCostCents)}
                      </td>

                      <td className="td">
                        {row.budgetCents ? (
                          <ProgressBar
                            value={row.actualCostCents}
                            max={row.budgetCents}
                            label={`${row.budgetUsedPct}% of ${formatMoney(
                              row.budgetCents,
                            )}`}
                          />
                        ) : (
                          <span className="text-xs text-ink-400">—</span>
                        )}
                      </td>

                      <td className="td text-right tnum">
                        {formatMoney(row.revenueCents)}
                        {row.revenueIsFee ? (
                          <div className="text-xs font-normal text-ink-500">
                            fixed fee
                          </div>
                        ) : null}
                      </td>

                      <td
                        className={`td text-right tnum font-medium ${
                          row.marginCents < 0 ? "text-bad-700" : "text-good-700"
                        }`}
                      >
                        {formatMoney(row.marginCents)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        Hours and cost only count time logged inside the selected date range —
        widen it to <strong className="font-medium">This year</strong> for
        lifetime burn on a long-running project.
      </p>
    </div>
  );
}
