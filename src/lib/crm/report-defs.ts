import type { GroupLevel, ReportRow } from "@/lib/crm/reports";

/**
 * The two reports the dashboard links to, defined once.
 *
 * Both were sent as Salesforce exports, so these are transcriptions rather
 * than inventions: the same filters, the same grouping, the same columns in
 * the same order. Where the export's header row says "Close Month  ↑", the
 * arrow is Salesforce's sort marker and the grouping is ascending; that is
 * reproduced too.
 *
 * Kept apart from the pages because the dashboard needs the filters (so the
 * chart and the report it links to can never disagree about which deals they
 * mean) and the pages need the columns.
 */

export interface Column {
  key: string;
  label: string;
  align?: "right";
  /** Rendered as money rather than text. */
  money?: boolean;
}

export interface ReportDef {
  slug: string;
  name: string;
  /** The filter lines Salesforce prints under "Filtered By". */
  filters: (context: { from: Date; to: Date; types: string[] }) => string[];
  levels: GroupLevel[];
  columns: Column[];
  /** Salesforce shows Avg alongside Sum on Revenue by Type, and not on the other. */
  showAverage: boolean;
}

const at = (row: ReportRow, key: string) => row.values[key] ?? "";

const usDate = (d: Date) =>
  `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;

/**
 * A month grouping sorts by date, not by the text of its label.
 *
 * "1/1/2026" sorts before "12/1/2025" as a string, which would put January
 * of this year ahead of December of last. The rows carry a sortable key for
 * exactly this.
 */
const byRowKey = (key: string) => (_label: string, rows: ReportRow[]) =>
  rows[0] ? (rows[0].values[key] ?? "") : "";

export const CLOSED_WON_BY_MONTH: ReportDef = {
  slug: "closed-won-by-month",
  name: "Closed Won by Month",
  filters: ({ from, to, types }) => [
    `Date Field: Close Date equals Custom (${usDate(from)} to ${usDate(to)})`,
    "Show: All opportunities",
    "Opportunity Status: Closed Won",
    "Probability: All",
    `Type equals ${types.join(",")}`,
  ],
  levels: [
    { label: "Close Month", of: (r) => at(r, "closeMonth"), sortKey: byRowKey("monthKey") },
    { label: "Type", of: (r) => at(r, "type") },
  ],
  columns: [
    { key: "owner", label: "Opportunity Owner" },
    { key: "name", label: "Opportunity Name" },
    { key: "amount", label: "Amount", align: "right", money: true },
    { key: "closeDate", label: "Close Date" },
    { key: "projectCompletionDate", label: "Project Completion Date" },
    { key: "stage", label: "Stage" },
    { key: "createdDate", label: "Created Date" },
    { key: "productName", label: "Product Name" },
    { key: "subcontract", label: "Subcontract" },
    { key: "accountName", label: "Account Name" },
    { key: "billingContact", label: "Billing Contact" },
  ],
  showAverage: false,
};

export const REVENUE_BY_TYPE: ReportDef = {
  slug: "revenue-by-type",
  name: "Revenue by Type",
  filters: ({ from, to, types }) => [
    `Date Field: Close Date equals Current FY (${usDate(from)} to ${usDate(to)})`,
    "Show: All opportunities",
    "Opportunity Status: Closed Won",
    "Probability: All",
    `Type equals ${types.join(",")}`,
  ],
  levels: [
    { label: "Fiscal Period", of: (r) => at(r, "fiscalPeriod") },
    { label: "Type", of: (r) => at(r, "type") },
    { label: "Account Name", of: (r) => at(r, "accountName") },
  ],
  columns: [
    { key: "name", label: "Opportunity Name" },
    { key: "leadSource", label: "Lead Source" },
    { key: "amount", label: "Amount", align: "right", money: true },
    { key: "closeDate", label: "Close Date" },
    { key: "nextStep", label: "Next Step" },
    { key: "stage", label: "Stage" },
    { key: "probability", label: "Probability (%)", align: "right" },
    { key: "age", label: "Age", align: "right" },
    { key: "createdDate", label: "Created Date" },
    { key: "owner", label: "Opportunity Owner" },
  ],
  showAverage: true,
};

export const REPORTS: ReportDef[] = [CLOSED_WON_BY_MONTH, REVENUE_BY_TYPE];

export const reportBySlug = (slug: string): ReportDef | undefined =>
  REPORTS.find((r) => r.slug === slug);
