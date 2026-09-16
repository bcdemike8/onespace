import { STAGE_LABEL } from "@/lib/crm/view";
import { bandOf, type Band, type PipelineDeal } from "@/lib/crm/pipeline";

/**
 * The flat, sortable table behind every figure on the Deals page.
 *
 * Pure: deals in, sorted rows out. No database, no markup. Sorting is the
 * kind of thing that looks obviously right and is quietly wrong on the
 * eleventh row - blanks leading, a text sort putting "$9,000" above
 * "$10,000" - so it is written where it can be tested against real cases.
 *
 * The grouped report on the Deals page answers "how are we doing". This
 * answers "show me the rows", which is a different question and wants a
 * different shape: one table, every column sortable, nothing folded away.
 */

export type SortKey =
  | "name"
  | "account"
  | "type"
  | "owner"
  | "stage"
  | "close"
  | "amount"
  | "probability"
  | "created";

export type Direction = "asc" | "desc";

export interface Column {
  key: SortKey;
  label: string;
  align?: "right";
  /** Which way a first click should sort. */
  first: Direction;
}

/**
 * The columns, in the order they read.
 *
 * Each says which way a first click sorts it, because the useful first
 * answer differs: names want A-Z, money and dates want biggest and most
 * recent. Making every column default to ascending means half of them need
 * two clicks to say anything.
 */
export const COLUMNS: Column[] = [
  { key: "name", label: "Deal", first: "asc" },
  { key: "account", label: "Account", first: "asc" },
  { key: "type", label: "Type", first: "asc" },
  { key: "owner", label: "Owner", first: "asc" },
  { key: "stage", label: "Stage", first: "asc" },
  { key: "close", label: "Close date", first: "desc" },
  { key: "probability", label: "%", align: "right", first: "desc" },
  { key: "amount", label: "Amount", align: "right", first: "desc" },
];

export const isSortKey = (v: string | undefined): v is SortKey =>
  COLUMNS.some((c) => c.key === v) || v === "created";

export const asDirection = (v: string | undefined): Direction =>
  v === "asc" ? "asc" : "desc";

/** The stage's place in the process, so sorting by stage isn't alphabetical. */
const STAGE_RANK: Record<string, number> = {
  QUALIFICATION: 1,
  DISCOVERY: 2,
  ASSIGNED: 3,
  INTRODUCTION: 4,
  PROPOSAL: 5,
  CONTRACT: 6,
  CLOSED_WON: 7,
  CLOSED_LOST: 8,
};

/**
 * What a column sorts on. `null` means blank, and blanks go last whichever
 * way the sort runs - the same bargain a spreadsheet makes, and the right
 * one: a deal with no close date is not the oldest deal.
 */
function sortValue(d: PipelineDeal, key: SortKey): string | number | null {
  switch (key) {
    case "name":
      return d.name.toLowerCase();
    case "account":
      return d.clientName.toLowerCase();
    case "type":
      return (d.partnerName ?? "Direct").toLowerCase();
    case "owner":
      return d.ownerName?.toLowerCase() ?? null;
    case "stage":
      return STAGE_RANK[d.stage] ?? 99;
    case "close":
      return d.closeDate?.getTime() ?? null;
    case "amount":
      return d.amount;
    case "probability":
      return d.probability;
    case "created":
      return d.createdAt.getTime();
  }
}

/**
 * Sorted, with blanks last and ties broken by close date then name.
 *
 * The tie-break matters more than it sounds: sorting 357 won deals by owner
 * with no second key gives a different order every time the database feels
 * like it, and a report that reshuffles on refresh is one nobody trusts.
 */
export function sortDeals(
  deals: PipelineDeal[],
  key: SortKey,
  direction: Direction,
): PipelineDeal[] {
  const sign = direction === "asc" ? 1 : -1;

  return [...deals].sort((a, b) => {
    const av = sortValue(a, key);
    const bv = sortValue(b, key);

    if (av === null && bv === null) return tieBreak(a, b);
    if (av === null) return 1;
    if (bv === null) return -1;
    if (av < bv) return -1 * sign;
    if (av > bv) return 1 * sign;
    return tieBreak(a, b);
  });
}

function tieBreak(a: PipelineDeal, b: PipelineDeal): number {
  const at = a.closeDate?.getTime() ?? 0;
  const bt = b.closeDate?.getTime() ?? 0;
  if (at !== bt) return bt - at;
  return a.name.localeCompare(b.name);
}

export interface ReportFilters {
  band?: Band | "all";
  /** Won within this many days of today. The "recently" tile. */
  withinDays?: number;
  account?: string;
  type?: string;
  owner?: string;
  stage?: string;
}

/**
 * Narrow the rows the way a spreadsheet's column filters would.
 *
 * Every filter is exact-match on a value the table already shows, so what
 * you picked and what you see are the same words. Applied here rather than
 * in the query because the page has already loaded the deals to total them -
 * filtering twice, once in SQL and once in memory, is how the header and the
 * rows end up disagreeing.
 */
export function filterDeals(
  deals: PipelineDeal[],
  f: ReportFilters,
  today = new Date(),
): PipelineDeal[] {
  const since =
    f.withinDays === undefined
      ? null
      : new Date(today.getTime() - f.withinDays * 86_400_000);

  return deals.filter((d) => {
    if (f.band && f.band !== "all" && bandOf(d) !== f.band) return false;
    if (since && !(d.closeDate && d.closeDate >= since)) return false;
    if (f.account && d.clientName !== f.account) return false;
    if (f.type && (d.partnerName ?? "Direct") !== f.type) return false;
    if (f.owner && (d.ownerName ?? "") !== f.owner) return false;
    if (f.stage && d.stage !== f.stage) return false;
    return true;
  });
}

/** The distinct values a column holds, for its filter dropdown. */
export function choicesFor(
  deals: PipelineDeal[],
  key: "account" | "type" | "owner" | "stage",
): string[] {
  const seen = new Set<string>();
  for (const d of deals) {
    const v =
      key === "account"
        ? d.clientName
        : key === "type"
          ? (d.partnerName ?? "Direct")
          : key === "owner"
            ? (d.ownerName ?? "")
            : d.stage;
    if (v) seen.add(v);
  }
  const out = [...seen];
  // Stage sorts by the process, everything else alphabetically.
  return key === "stage"
    ? out.sort((a, b) => (STAGE_RANK[a] ?? 99) - (STAGE_RANK[b] ?? 99))
    : out.sort((a, b) => a.localeCompare(b));
}

export const BAND_LABEL: Record<Band | "all", string> = {
  PIPELINE: "In pipeline",
  WON: "Closed won",
  LOST: "Closed lost",
  all: "Every deal",
};

export const asBand = (v: string | undefined): Band | "all" =>
  v === "pipeline"
    ? "PIPELINE"
    : v === "won"
      ? "WON"
      : v === "lost"
        ? "LOST"
        : "all";

export const bandParam = (b: Band | "all"): string =>
  b === "PIPELINE" ? "pipeline" : b === "WON" ? "won" : b === "LOST" ? "lost" : "all";

// ----------------------------------------------------------------------- CSV

const csvCell = (v: string | number | null): string => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // Quote anything that would otherwise break a column, and double the
  // quotes inside - which is the whole of CSV escaping, and the part
  // everybody skips until a deal name contains a comma.
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const isoDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

/**
 * The same rows, as a spreadsheet.
 *
 * Because "filters like Excel" eventually means Excel. The columns are the
 * ones on screen plus the few a person reaches for once the file is open -
 * business type, lead consultant, next step - and the dates are ISO so they
 * sort as dates rather than as American text.
 */
export function toCsv(deals: PipelineDeal[]): string {
  const header = [
    "Deal",
    "Account",
    "Type",
    "Business type",
    "Owner",
    "Lead consultant",
    "Stage",
    "Status",
    "Close date",
    "Probability",
    "Amount",
    "Next step",
  ];

  const rows = deals.map((d) => [
    d.name,
    d.clientName,
    d.partnerName ?? "Direct",
    d.businessType ?? "",
    d.ownerName ?? "",
    d.consultantName ?? "",
    STAGE_LABEL[d.stage],
    bandOf(d) === "PIPELINE" ? "Open" : bandOf(d) === "WON" ? "Won" : "Lost",
    isoDate(d.closeDate),
    d.probability === null ? "" : d.probability,
    d.amount === null ? "" : d.amount,
    d.nextStep ?? "",
  ]);

  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}
