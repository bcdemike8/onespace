import type { AccountType, DealStage } from "@prisma/client";

/**
 * How the CRM is looked at, kept in one place.
 *
 * The filters are in the URL rather than in component state so a view can be
 * sent to somebody. Everything here is pure, so the rules about which
 * accounts are "ours" are testable rather than scattered through three pages.
 */

export type AccountFilter = "working" | "customers" | "prospects" | "partners" | "all";

/**
 * "Working" is the default and the only opinionated one: the companies
 * RevOptics actually has a relationship with. 618 of the 1,037 accounts are
 * prospects, most of them cold, and a client list that opens on them is a
 * list nobody reads.
 */
const ACCOUNT_TYPES: Record<AccountFilter, AccountType[] | null> = {
  working: ["CURRENT_CUSTOMER", "PREVIOUS_CUSTOMER", "PARTNER"],
  customers: ["CURRENT_CUSTOMER"],
  prospects: ["PROSPECT"],
  partners: ["PARTNER"],
  all: null,
};

export const asAccountFilter = (value: string | undefined): AccountFilter =>
  value && value in ACCOUNT_TYPES ? (value as AccountFilter) : "working";

export function accountWhere(filter: AccountFilter): { accountType?: { in: AccountType[] } } {
  const types = ACCOUNT_TYPES[filter];
  return types ? { accountType: { in: types } } : {};
}

export const ACCOUNT_TABS: { key: AccountFilter; label: string }[] = [
  { key: "working", label: "Ours" },
  { key: "customers", label: "Customers" },
  { key: "prospects", label: "Prospects" },
  { key: "partners", label: "Partners" },
  { key: "all", label: "Everyone" },
];

export const ACCOUNT_LABEL: Record<AccountType, string> = {
  PROSPECT: "Prospect",
  CURRENT_CUSTOMER: "Customer",
  PREVIOUS_CUSTOMER: "Previous customer",
  PARTNER: "Partner",
  COMPETITOR: "Competitor",
};

/**
 * The same five, under the names Salesforce's record types actually carry.
 *
 * ACCOUNT_LABEL is shortened for chips and filter tabs, where "Customer" is
 * plenty and "Current Customer" is two words too many in a 90px pill. But a
 * field labelled "Account record type" is quoting Salesforce, and quoting it
 * loosely is how a page stops being trusted.
 */
export const ACCOUNT_RECORD_TYPE: Record<AccountType, string> = {
  PROSPECT: "Prospect",
  CURRENT_CUSTOMER: "Current Customer",
  PREVIOUS_CUSTOMER: "Previous Customer",
  PARTNER: "Partner",
  COMPETITOR: "Competitor",
};

export type DealFilter = "open" | "won" | "lost" | "all";

export const asDealFilter = (value: string | undefined): DealFilter =>
  value === "won" || value === "lost" || value === "all" ? value : "open";

export function dealWhere(filter: DealFilter) {
  if (filter === "open") return { isClosed: false };
  if (filter === "won") return { isWon: true };
  if (filter === "lost") return { isClosed: true, isWon: false };
  return {};
}

export const DEAL_TABS: { key: DealFilter; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
  { key: "all", label: "All" },
];

export const STAGE_LABEL: Record<DealStage, string> = {
  QUALIFICATION: "Qualification",
  DISCOVERY: "Discovery",
  ASSIGNED: "Assigned",
  INTRODUCTION: "Introduction",
  PROPOSAL: "Proposal",
  CONTRACT: "Contract",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

/**
 * The path a deal walks, in order.
 *
 * Six open stages and then one of two endings. Salesforce drew this as a row
 * of chevrons across the top of every opportunity, and it is the one part of
 * that page people read without meaning to: it answers "where is this" before
 * you have finished looking at it.
 */
export const OPEN_STAGES: DealStage[] = [
  "QUALIFICATION",
  "DISCOVERY",
  "ASSIGNED",
  "INTRODUCTION",
  "PROPOSAL",
  "CONTRACT",
];

export type StageStep = {
  stage: DealStage;
  label: string;
  state: "done" | "current" | "todo";
};

/**
 * A won deal walked the whole road, so every stage behind it is ticked.
 *
 * A lost one did not, and nothing in the export says where it stopped -
 * Salesforce overwrites StageName with "Closed Lost" and keeps no trail. So
 * the stages before it are left plain rather than ticked: a tick on Contract
 * would be the page asserting the deal reached contract, which for 472 lost
 * deals is a claim nobody can stand behind.
 *
 * Won and Lost never appear together, because Salesforce replaced the final
 * chevron rather than adding one.
 */
export function stagePath(current: DealStage): StageStep[] {
  const lost = current === "CLOSED_LOST";
  const won = current === "CLOSED_WON";
  const ending: DealStage = lost ? "CLOSED_LOST" : "CLOSED_WON";
  const at = OPEN_STAGES.indexOf(current);

  const steps: StageStep[] = OPEN_STAGES.map((stage, i) => ({
    stage,
    label: STAGE_LABEL[stage],
    state: won || (at >= 0 && i < at) ? "done" : i === at ? "current" : "todo",
  }));

  steps.push({
    stage: ending,
    label: STAGE_LABEL[ending],
    state: won || lost ? "current" : "todo",
  });
  return steps;
}

/** A search box that does nothing until it has something to go on. */
export const searchWhere = (q: string | undefined, fields: string[]) => {
  const term = (q ?? "").trim();
  if (term.length < 2) return {};
  return {
    OR: fields.map((f) => ({ [f]: { contains: term, mode: "insensitive" } })),
  } as Record<string, unknown>;
};

/** Money, at the scale a deal list needs it. */
export function money(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `$${Math.round(value).toLocaleString()}`;
}

/** Keep the current query string while changing one part of it. */
export function crmHref(
  base: string,
  current: Record<string, string | undefined>,
  changes: Record<string, string | null>,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...changes })) {
    if (v) params.set(k, v);
  }
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}
