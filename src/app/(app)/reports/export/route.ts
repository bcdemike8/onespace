import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { formatMedium, toISODate } from "@/lib/dates";
import { minutesToHours } from "@/lib/format";
import {
  buildBudgetReport,
  buildReport,
  fetchEntries,
  GROUP_BY_OPTIONS,
  toCSV,
} from "@/lib/reporting";
import { parseReportParams } from "@/lib/report-params";

export const dynamic = "force-dynamic";

const money = (cents: number) => (cents / 100).toFixed(2);

/**
 * CSV for whatever the report screen is currently showing. Three shapes:
 *
 *   mode=grouped  (default) one row per grouping, one column per date bucket
 *   mode=detail             one row per time entry — the invoicing backup
 *   mode=budgets            budget vs actual per project
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Sign in first.", { status: 401 });
  }

  const url = new URL(request.url);
  const raw: Record<string, string | string[]> = {};
  for (const key of new Set(url.searchParams.keys())) {
    const all = url.searchParams.getAll(key);
    raw[key] = all.length > 1 ? all : all[0];
  }

  const params = parseReportParams(raw);
  const admin = isAdmin(user);
  const userIds = admin ? params.userIds : [user.id];
  const mode = url.searchParams.get("mode") ?? "grouped";

  const filters = {
    from: params.from,
    to: params.to,
    clientIds: params.clientIds,
    partnerIds: params.partnerIds,
    projectIds: params.projectIds,
    userIds,
    billable: params.billable,
    granularity: params.granularity,
  };

  let rows: unknown[][];
  let filename: string;

  if (mode === "budgets") {
    if (!admin) return new NextResponse("Administrators only.", { status: 403 });

    const budget = await buildBudgetReport(filters);
    rows = [
      [
        "Project",
        "Client",
        "Partner",
        "Status",
        "Billing",
        "Hours logged",
        "Hours budget",
        "Hours used %",
        "Cost",
        "Revenue budget",
        "Budget used %",
        "Billable value",
        "Revenue",
        "Margin",
      ],
      ...budget
        .filter((r) => r.actualMinutes > 0 || r.budgetHours || r.budgetCents)
        .map((r) => [
          r.projectName,
          r.clientName ?? "",
          r.partnerName ?? "",
          r.status,
          r.billingType,
          minutesToHours(r.actualMinutes),
          r.budgetHours ?? "",
          r.hoursUsedPct ?? "",
          money(r.actualCostCents),
          r.budgetCents ? money(r.budgetCents) : "",
          r.budgetUsedPct ?? "",
          money(r.billableCents),
          money(r.revenueCents),
          money(r.marginCents),
        ]),
    ];
    filename = `budget-vs-actual_${params.fromISO}_${params.toISO}.csv`;
  } else if (mode === "detail") {
    const entries = await fetchEntries(filters);
    rows = [
      [
        "Date",
        "Person",
        "Client",
        "Partner",
        "Project",
        "Task",
        "Notes",
        "Hours",
        "Billable",
        "Bill rate",
        "Billable amount",
        ...(admin ? ["Cost rate", "Cost"] : []),
      ],
      ...entries.map((e) => [
        toISODate(e.date),
        e.user.name,
        e.project.client?.name ?? "",
        e.project.partner?.name ?? "",
        e.project.name,
        e.task?.name ?? "",
        e.notes ?? "",
        minutesToHours(e.minutes),
        e.billable ? "yes" : "no",
        money(e.billRateCents),
        e.billable ? money(Math.round((e.minutes * e.billRateCents) / 60)) : "0.00",
        ...(admin
          ? [
              money(e.costRateCents),
              money(Math.round((e.minutes * e.costRateCents) / 60)),
            ]
          : []),
      ]),
    ];
    filename = `time-entries_${params.fromISO}_${params.toISO}.csv`;
  } else {
    const report = await buildReport(filters, params.groupBy, params.subGroupBy);

    const label = (g: string) =>
      GROUP_BY_OPTIONS.find((o) => o.value === g)?.label ?? g;

    const header = [
      label(params.groupBy),
      ...(params.subGroupBy ? [label(params.subGroupBy)] : []),
      ...report.columns.map((c) => c.label),
      "Total hours",
      "Billable amount",
      ...(admin ? ["Cost", "Margin"] : []),
    ];

    const body: unknown[][] = [];
    for (const row of report.rows) {
      body.push([
        row.sublabel ? `${row.label} (${row.sublabel})` : row.label,
        ...(params.subGroupBy ? [""] : []),
        ...report.columns.map((c) => minutesToHours(row.buckets[c.key]?.minutes ?? 0)),
        minutesToHours(row.minutes),
        money(row.billableCents),
        ...(admin
          ? [money(row.costCents), money(row.billableCents - row.costCents)]
          : []),
      ]);

      for (const child of row.children ?? []) {
        body.push([
          "",
          child.label,
          ...report.columns.map((c) =>
            minutesToHours(child.buckets[c.key]?.minutes ?? 0),
          ),
          minutesToHours(child.minutes),
          money(child.billableCents),
          ...(admin
            ? [money(child.costCents), money(child.billableCents - child.costCents)]
            : []),
        ]);
      }
    }

    body.push([
      "TOTAL",
      ...(params.subGroupBy ? [""] : []),
      ...report.columns.map((c) =>
        minutesToHours(
          report.rows.reduce((sum, r) => sum + (r.buckets[c.key]?.minutes ?? 0), 0),
        ),
      ),
      minutesToHours(report.totals.minutes),
      money(report.totals.billableCents),
      ...(admin
        ? [
            money(report.totals.costCents),
            money(report.totals.billableCents - report.totals.costCents),
          ]
        : []),
    ]);

    rows = [
      [`OneSpace report — ${formatMedium(params.from)} to ${formatMedium(params.to)}`],
      [],
      header,
      ...body,
    ];
    filename = `report-by-${params.groupBy}_${params.fromISO}_${params.toISO}.csv`;
  }

  // The BOM makes Excel open UTF-8 correctly instead of mangling accents.
  return new NextResponse(`﻿${toCSV(rows)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
