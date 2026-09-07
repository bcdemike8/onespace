import {
  type Granularity,
  type RangePreset,
  resolveRange,
  toISODate,
} from "@/lib/dates";
import type { BillableFilter, GroupBy } from "@/lib/reporting";

/**
 * Report filters live entirely in the URL. That means every view is a
 * bookmarkable, shareable link — "the report I run every month" is just a
 * saved bookmark, and the CSV endpoint reads exactly the same query string.
 */
export interface ParsedReportParams {
  preset: RangePreset;
  from: Date;
  to: Date;
  fromISO: string;
  toISO: string;
  granularity: Granularity;
  groupBy: GroupBy;
  subGroupBy: GroupBy | null;
  clientIds: string[];
  projectIds: string[];
  userIds: string[];
  billable: BillableFilter;
}

export type RawParams = Record<string, string | string[] | undefined>;

const asArray = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.flatMap((v) => v.split(",")).filter(Boolean);
};

const PRESETS = new Set<RangePreset>([
  "today",
  "yesterday",
  "this_week",
  "last_week",
  "this_month",
  "last_month",
  "last_30",
  "this_quarter",
  "last_quarter",
  "this_year",
  "custom",
]);

const GROUPS = new Set<GroupBy>(["project", "client", "person", "task", "date"]);

export function parseReportParams(raw: RawParams): ParsedReportParams {
  const presetRaw = String(raw.preset ?? "this_month") as RangePreset;
  const preset = PRESETS.has(presetRaw) ? presetRaw : "this_month";

  const fromParam = typeof raw.from === "string" ? raw.from : null;
  const toParam = typeof raw.to === "string" ? raw.to : null;
  const { from, to } = resolveRange(preset, fromParam, toParam);

  const granularityRaw = String(raw.granularity ?? "week");
  const granularity: Granularity = ["day", "week", "month"].includes(granularityRaw)
    ? (granularityRaw as Granularity)
    : "week";

  const groupRaw = String(raw.group ?? "project") as GroupBy;
  const groupBy: GroupBy = GROUPS.has(groupRaw) ? groupRaw : "project";

  const subRaw = String(raw.subgroup ?? "");
  const subGroupBy: GroupBy | null =
    GROUPS.has(subRaw as GroupBy) && subRaw !== groupBy ? (subRaw as GroupBy) : null;

  const billableRaw = String(raw.billable ?? "all");
  const billable: BillableFilter = ["all", "billable", "nonbillable"].includes(
    billableRaw,
  )
    ? (billableRaw as BillableFilter)
    : "all";

  return {
    preset,
    from,
    to,
    fromISO: toISODate(from),
    toISO: toISODate(to),
    granularity,
    groupBy,
    subGroupBy,
    clientIds: asArray(raw.clients),
    projectIds: asArray(raw.projects),
    userIds: asArray(raw.people),
    billable,
  };
}

/** Rebuild the query string, e.g. for the CSV link or a changed grouping. */
export function reportQueryString(
  p: ParsedReportParams,
  overrides: Partial<Record<string, string>> = {},
): string {
  const q = new URLSearchParams();
  q.set("preset", p.preset);
  if (p.preset === "custom") {
    q.set("from", p.fromISO);
    q.set("to", p.toISO);
  }
  q.set("granularity", p.granularity);
  q.set("group", p.groupBy);
  if (p.subGroupBy) q.set("subgroup", p.subGroupBy);
  if (p.billable !== "all") q.set("billable", p.billable);
  for (const id of p.clientIds) q.append("clients", id);
  for (const id of p.projectIds) q.append("projects", id);
  for (const id of p.userIds) q.append("people", id);

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) q.delete(key);
    else q.set(key, value);
  }

  return q.toString();
}
