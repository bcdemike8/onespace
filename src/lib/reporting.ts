import "server-only";
import type { BillingType } from "@prisma/client";
import { db } from "@/lib/db";
import {
  type Granularity,
  bucketOf,
  bucketsBetween,
  dayStart,
} from "@/lib/dates";

export type BillableFilter = "all" | "billable" | "nonbillable";

export type GroupBy =
  | "project"
  | "client"
  | "partner"
  | "person"
  | "task"
  | "date";

export const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "project", label: "Project" },
  { value: "client", label: "Client" },
  { value: "partner", label: "Partner" },
  { value: "person", label: "Person" },
  { value: "task", label: "Task" },
  { value: "date", label: "Date" },
];

export interface ReportFilters {
  from: Date;
  to: Date;
  clientIds?: string[];
  partnerIds?: string[];
  projectIds?: string[];
  userIds?: string[];
  billable?: BillableFilter;
  granularity?: Granularity;
}

/** Money and time for one slice of the report. */
export interface Totals {
  minutes: number;
  /** hours x that person's cost rate — what the work cost you. */
  costCents: number;
  /** hours x bill rate, counting billable entries only — what you can invoice. */
  billableCents: number;
  entryCount: number;
}

export interface ReportRow extends Totals {
  key: string;
  label: string;
  /** Context line under the label, e.g. the client a project belongs to. */
  sublabel?: string;
  /** Totals per date bucket, keyed by bucket key. Powers the columns. */
  buckets: Record<string, Totals>;
  /** Second-level breakdown of this row, when a secondary grouping is asked for. */
  children?: ReportRow[];
}

export interface ReportResult {
  rows: ReportRow[];
  totals: Totals;
  columns: { key: string; label: string }[];
  entryCount: number;
}

const emptyTotals = (): Totals => ({
  minutes: 0,
  costCents: 0,
  billableCents: 0,
  entryCount: 0,
});

function addInto(target: Totals, entry: EntryShape) {
  target.minutes += entry.minutes;
  // Rates are per hour, so scale by minutes/60 and round once, at the entry.
  target.costCents += Math.round((entry.minutes * entry.costRateCents) / 60);
  if (entry.billable) {
    target.billableCents += Math.round((entry.minutes * entry.billRateCents) / 60);
  }
  target.entryCount += 1;
}

export const margin = (t: Totals) => t.billableCents - t.costCents;

export function marginPct(t: Totals): number | null {
  if (t.billableCents === 0) return null;
  return Math.round((margin(t) / t.billableCents) * 100);
}

type EntryShape = {
  id: string;
  minutes: number;
  date: Date;
  billable: boolean;
  billRateCents: number;
  costRateCents: number;
  notes: string | null;
  user: { id: string; name: string };
  project: {
    id: string;
    name: string;
    client: { id: string; name: string } | null;
    partner: { id: string; name: string } | null;
  };
  task: { id: string; name: string } | null;
};

export async function fetchEntries(filters: ReportFilters): Promise<EntryShape[]> {
  const {
    from,
    to,
    clientIds = [],
    partnerIds = [],
    projectIds = [],
    userIds = [],
    billable = "all",
  } = filters;

  return db.timeEntry.findMany({
    where: {
      date: { gte: dayStart(from), lte: dayStart(to) },
      ...(projectIds.length ? { projectId: { in: projectIds } } : {}),
      ...(userIds.length ? { userId: { in: userIds } } : {}),
      ...(clientIds.length || partnerIds.length
        ? {
            project: {
              ...(clientIds.length ? { clientId: { in: clientIds } } : {}),
              ...(partnerIds.length ? { partnerId: { in: partnerIds } } : {}),
            },
          }
        : {}),
      ...(billable === "all" ? {} : { billable: billable === "billable" }),
    },
    select: {
      id: true,
      minutes: true,
      date: true,
      billable: true,
      billRateCents: true,
      costRateCents: true,
      notes: true,
      user: { select: { id: true, name: true } },
      project: {
        select: {
          id: true,
          name: true,
          client: { select: { id: true, name: true } },
          partner: { select: { id: true, name: true } },
        },
      },
      task: { select: { id: true, name: true } },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
}

function dimensionOf(entry: EntryShape, groupBy: GroupBy, granularity: Granularity) {
  switch (groupBy) {
    case "project":
      return {
        key: entry.project.id,
        label: entry.project.name,
        sublabel: entry.project.client?.name ?? "No client",
      };
    case "client":
      return {
        key: entry.project.client?.id ?? "__none__",
        label: entry.project.client?.name ?? "No client",
      };
    case "partner":
      return {
        key: entry.project.partner?.id ?? "__none__",
        label: entry.project.partner?.name ?? "No partner",
      };
    case "person":
      return { key: entry.user.id, label: entry.user.name };
    case "task":
      return {
        key: entry.task?.id ?? `__project__${entry.project.id}`,
        label: entry.task?.name ?? "(no task — logged to project)",
        sublabel: entry.project.name,
      };
    case "date": {
      const bucket = bucketOf(entry.date, granularity);
      return { key: bucket.key, label: bucket.label };
    }
  }
}

/**
 * The one function every report screen calls. Rows are the primary grouping,
 * columns are date buckets, and an optional secondary grouping nests inside
 * each row.
 *
 * Aggregation happens in JS rather than SQL: for a team of this size the
 * entry count per report is in the thousands at most, and doing it here keeps
 * every metric (cost, billable, margin) defined in exactly one place.
 */
export async function buildReport(
  filters: ReportFilters,
  groupBy: GroupBy,
  secondaryGroupBy?: GroupBy | null,
): Promise<ReportResult> {
  const granularity = filters.granularity ?? "week";
  const entries = await fetchEntries(filters);
  const columns = bucketsBetween(filters.from, filters.to, granularity);

  const rowMap = new Map<string, ReportRow>();
  const childMaps = new Map<string, Map<string, ReportRow>>();
  const totals = emptyTotals();

  for (const entry of entries) {
    const dim = dimensionOf(entry, groupBy, granularity);
    const bucketKey = bucketOf(entry.date, granularity).key;

    let row = rowMap.get(dim.key);
    if (!row) {
      row = { ...emptyTotals(), ...dim, buckets: {} };
      rowMap.set(dim.key, row);
      if (secondaryGroupBy) childMaps.set(dim.key, new Map());
    }

    addInto(row, entry);
    row.buckets[bucketKey] ??= emptyTotals();
    addInto(row.buckets[bucketKey], entry);

    if (secondaryGroupBy) {
      const childDim = dimensionOf(entry, secondaryGroupBy, granularity);
      const children = childMaps.get(dim.key)!;
      let child = children.get(childDim.key);
      if (!child) {
        child = { ...emptyTotals(), ...childDim, buckets: {} };
        children.set(childDim.key, child);
      }
      addInto(child, entry);
      child.buckets[bucketKey] ??= emptyTotals();
      addInto(child.buckets[bucketKey], entry);
    }

    addInto(totals, entry);
  }

  const rows = [...rowMap.values()];
  if (secondaryGroupBy) {
    for (const row of rows) {
      row.children = [...(childMaps.get(row.key)?.values() ?? [])].sort(
        (a, b) => b.minutes - a.minutes,
      );
    }
  }

  // Date rows read chronologically; every other grouping reads biggest-first.
  rows.sort((a, b) =>
    groupBy === "date" ? a.key.localeCompare(b.key) : b.minutes - a.minutes,
  );

  return { rows, totals, columns, entryCount: entries.length };
}

// ------------------------------------------------------- budget vs. actual

export interface BudgetRow {
  projectId: string;
  projectName: string;
  clientName: string | null;
  partnerName: string | null;
  status: string;
  billingType: BillingType;
  budgetHours: number | null;
  budgetCents: number | null;
  actualMinutes: number;
  /** What the logged hours actually cost you, at each person's cost rate. */
  actualCostCents: number;
  /** Hours x bill rate on billable entries. Overstates a fixed-fee project. */
  billableCents: number;
  /**
   * What the project actually earns: the agreed fee on a fixed-fee project,
   * hours x rate on an hourly one, nothing on a non-billable one.
   */
  revenueCents: number;
  /** True when revenueCents is the fee rather than a sum of hours. */
  revenueIsFee: boolean;
  /** revenueCents - actualCostCents. */
  marginCents: number;
  /** Percentage of the hours budget consumed. Null when no budget is set. */
  hoursUsedPct: number | null;
  /** Cost against the revenue budget — the number that tells you if you're underwater. */
  budgetUsedPct: number | null;
  overHours: boolean;
  overBudget: boolean;
}

/**
 * Budget burn per project. Actuals are cost-based (hours x each person's
 * real cost rate), which is the only way "are we making money on this?" has
 * a truthful answer.
 */
export async function buildBudgetReport(
  filters: Pick<
    ReportFilters,
    "from" | "to" | "clientIds" | "partnerIds" | "projectIds"
  >,
  opts: { includeArchived?: boolean } = {},
): Promise<BudgetRow[]> {
  const { from, to, clientIds = [], partnerIds = [], projectIds = [] } = filters;

  const projects = await db.project.findMany({
    where: {
      ...(projectIds.length ? { id: { in: projectIds } } : {}),
      ...(clientIds.length ? { clientId: { in: clientIds } } : {}),
      ...(partnerIds.length ? { partnerId: { in: partnerIds } } : {}),
      ...(opts.includeArchived ? {} : { status: { not: "ARCHIVED" } }),
    },
    select: {
      id: true,
      name: true,
      status: true,
      billingType: true,
      budgetHours: true,
      budgetCents: true,
      client: { select: { name: true } },
      partner: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  const actuals = await db.timeEntry.groupBy({
    by: ["projectId"],
    where: {
      date: { gte: dayStart(from), lte: dayStart(to) },
      ...(projectIds.length ? { projectId: { in: projectIds } } : {}),
      ...(clientIds.length || partnerIds.length
        ? {
            project: {
              ...(clientIds.length ? { clientId: { in: clientIds } } : {}),
              ...(partnerIds.length ? { partnerId: { in: partnerIds } } : {}),
            },
          }
        : {}),
    },
    _sum: { minutes: true },
  });

  // groupBy can't multiply columns, so cost and revenue are summed here.
  const money = await db.timeEntry.findMany({
    where: {
      date: { gte: dayStart(from), lte: dayStart(to) },
      ...(projectIds.length ? { projectId: { in: projectIds } } : {}),
      ...(clientIds.length || partnerIds.length
        ? {
            project: {
              ...(clientIds.length ? { clientId: { in: clientIds } } : {}),
              ...(partnerIds.length ? { partnerId: { in: partnerIds } } : {}),
            },
          }
        : {}),
    },
    select: {
      projectId: true,
      minutes: true,
      billable: true,
      billRateCents: true,
      costRateCents: true,
    },
  });

  const minutesByProject = new Map(
    actuals.map((a) => [a.projectId, a._sum.minutes ?? 0]),
  );
  const costByProject = new Map<string, number>();
  const billByProject = new Map<string, number>();

  for (const e of money) {
    costByProject.set(
      e.projectId,
      (costByProject.get(e.projectId) ?? 0) +
        Math.round((e.minutes * e.costRateCents) / 60),
    );
    if (e.billable) {
      billByProject.set(
        e.projectId,
        (billByProject.get(e.projectId) ?? 0) +
          Math.round((e.minutes * e.billRateCents) / 60),
      );
    }
  }

  return projects.map((p) => {
    const actualMinutes = minutesByProject.get(p.id) ?? 0;
    const actualCostCents = costByProject.get(p.id) ?? 0;
    const billableCents = billByProject.get(p.id) ?? 0;

    const hoursUsedPct =
      p.budgetHours && p.budgetHours > 0
        ? Math.round((actualMinutes / 60 / p.budgetHours) * 100)
        : null;

    const budgetUsedPct =
      p.budgetCents && p.budgetCents > 0
        ? Math.round((actualCostCents / p.budgetCents) * 100)
        : null;

    // A fixed-fee project earns its fee, not its hours. Fall back to hours x
    // rate when no fee has been set yet, so the row isn't silently zero.
    const revenueIsFee =
      p.billingType === "FIXED_FEE" && p.budgetCents !== null && p.budgetCents > 0;
    const revenueCents =
      p.billingType === "NON_BILLABLE"
        ? 0
        : revenueIsFee
          ? (p.budgetCents as number)
          : billableCents;

    return {
      projectId: p.id,
      projectName: p.name,
      clientName: p.client?.name ?? null,
      partnerName: p.partner?.name ?? null,
      status: p.status,
      billingType: p.billingType,
      budgetHours: p.budgetHours,
      budgetCents: p.budgetCents,
      actualMinutes,
      actualCostCents,
      billableCents,
      revenueCents,
      revenueIsFee,
      marginCents: revenueCents - actualCostCents,
      hoursUsedPct,
      budgetUsedPct,
      overHours: hoursUsedPct !== null && hoursUsedPct > 100,
      overBudget: budgetUsedPct !== null && budgetUsedPct > 100,
    };
  });
}

// -------------------------------------------------------------------- CSV

const csvCell = (value: unknown): string => {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCSV = (rows: unknown[][]): string =>
  rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
