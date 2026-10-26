/**
 * Cloning an opportunity, the way a renewal actually works.
 *
 * "Hex Technologies Inc. - 3 Months Managed Service" closes, and three
 * months later the same scope sells again to the same people through the
 * same partner. Retyping twenty fields is the slow way to get one of those
 * wrong.
 *
 * The rule here is carry-by-default: everything comes across except the
 * fields named below, because a field added to the schema next year
 * describes the engagement too and should follow it without anybody
 * remembering this file. What must not come across is anything that was
 * true of the *old* deal's outcome — its stage, its close date, its
 * invoices, its Salesforce id.
 *
 * Plain module, no database: the field policy is the part worth testing,
 * and tests can't import anything server-only.
 */

/**
 * Fields a clone must not inherit, and why.
 *
 * Grouped by reason rather than alphabetically, because the reason is what
 * somebody needs when they come to add a field to one of these lists.
 */
export const RESET_FIELDS = {
  /** Its own row, its own identity. Both of these are unique columns. */
  identity: ["id", "sfdcId", "projectId", "legacyId"] as const,

  /**
   * The old deal's outcome. A clone that arrived Closed Won would add its
   * amount to the closed-business dashboard the moment it was created, which
   * is the most expensive thing on this page to get wrong.
   */
  outcome: [
    "stage",
    "isWon",
    "isClosed",
    "closeDate",
    "probability",
    "expectedRevenue",
    "forecastCategory",
    "fiscalYear",
    "fiscalQuarter",
    "lostReason",
    "lostReasonDetail",
    "dealLength",
  ] as const,

  /** Where the old deal had got to, which is not where this one starts. */
  progress: [
    "nextStep",
    "isSql",
    "sqlDate",
    "partnerHold",
    "auditCompleted",
    "auditCompletedDate",
    "threeMonthAuditDate",
    "projectStartDate",
    "projectCompletionDate",
    "projectDuration",
    "invoiceSentAt",
    "invoicePaidAt",
    "csatScore",
  ] as const,

  /** Pointers at the old deal's paperwork in another system. */
  references: ["contractRef", "syncedQuoteRef", "campaignSourceRef"] as const,

  /** Written fresh by whoever is doing the cloning. */
  provenance: [
    "createdById",
    "lastModifiedById",
    "lastStageChangeAt",
    "lastActivityAt",
    "lastModifiedAt",
    "firstSeenAt",
    "createdAt",
    "updatedAt",
  ] as const,
} as const;

/** Every reset field, flattened — what the action strips. */
export const RESET: string[] = Object.values(RESET_FIELDS).flat();

/**
 * What a clone keeps: the scope, the money, the people and the paper terms.
 * Derived rather than listed, so a new column is carried by default.
 */
export function carriedFields(allColumns: string[]): string[] {
  const reset = new Set(RESET);
  return allColumns.filter((c) => !reset.has(c));
}

/**
 * "… (copy)", then "(copy 2)" and upwards.
 *
 * Deal names aren't unique in the database, which is exactly why the marker
 * matters: two identical rows in a pipeline list are indistinguishable, and
 * the one you open is a coin toss. `existing` is the names already on the
 * account, so cloning the same deal twice doesn't make two "(copy)".
 */
export function cloneName(name: string, existing: string[] = []): string {
  const taken = new Set(existing);
  // Clone a clone and you get "(copy 2)", not "(copy) (copy)".
  const base = name.replace(/\s*\(copy(?:\s+\d+)?\)\s*$/i, "").trim() || name;

  let candidate = `${base} (copy)`;
  let n = 2;
  while (taken.has(candidate)) candidate = `${base} (copy ${n++})`;
  return candidate;
}

/** What else comes with the deal, and what deliberately doesn't. */
export const CLONE_NOTES = {
  products: "Line items are copied — on a renewal they are the whole point.",
  contacts: "Contact roles are copied; the same people sign the next term.",
  files:
    "Files are not. They are the signed paperwork for the term that just " +
    "ended, and a clone carrying the old SOW is worse than an empty list.",
} as const;
