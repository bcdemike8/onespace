/**
 * How many hours a deal bought, and what that worked out to per hour.
 *
 * The Salesforce export carried the money and never the hours, so a closed
 * deal said $7,000 and left the consultant delivering it to guess whether
 * that was twenty hours or sixty. `Deal.hoursSold` is where the number goes;
 * this works out what to show when it hasn't been filled in yet.
 *
 * Plain module, no database: the fallback order and the rate arithmetic are
 * the parts worth testing, and tests can't import anything server-only.
 */

export interface DealHoursInput {
  /** What the statement of work allows for, as recorded on the deal. */
  hoursSold: number | null;
  /** The hours budget on the project this deal became, if it has one. */
  projectBudgetHours: number | null;
  /** The deal amount in dollars. */
  amount: number | null;
  /** Minutes logged against the linked project. */
  loggedMinutes: number | null;
}

export interface DealHours {
  /** The hours allowed, or null when nobody has recorded any. */
  hours: number | null;
  /**
   * True when `hours` came from the linked project rather than the deal
   * itself. Worth saying out loud on the page: the project's budget can be
   * revised during delivery, and then it no longer answers "what did we
   * sell" - only "what are we working to".
   */
  fromProject: boolean;
  /** Dollars per hour, rounded to the nearest dollar. */
  rate: number | null;
  /** Hours logged so far, to a quarter hour. */
  logged: number | null;
}

export function dealHours({
  hoursSold,
  projectBudgetHours,
  amount,
  loggedMinutes,
}: DealHoursInput): DealHours {
  // The deal's own figure wins. A project budget is a delivery decision and
  // can be revised; what was sold cannot.
  const own = usable(hoursSold);
  const fallback = usable(projectBudgetHours);
  const hours = own ?? fallback;

  const money = amount !== null && Number.isFinite(amount) ? amount : null;

  return {
    hours,
    fromProject: own === null && fallback !== null,
    // A rate only means something when both halves are real. Zero hours
    // would divide to Infinity, and a zero-dollar deal reads $0/h, which is
    // noise rather than information.
    rate: hours && hours > 0 && money ? Math.round(money / hours) : null,
    logged:
      loggedMinutes !== null && loggedMinutes > 0
        ? Math.round((loggedMinutes / 60) * 4) / 4
        : null,
  };
}

/** Null, NaN and nonsense all mean "nobody recorded this". */
function usable(n: number | null): number | null {
  return n !== null && Number.isFinite(n) && n > 0 ? n : null;
}

/** "40", "7.5" - never "40.0". */
export function hoursLabel(hours: number): string {
  return String(Math.round(hours * 100) / 100);
}

/**
 * The line under the Hours figure: how delivery is tracking against what was
 * sold, or failing that what the deal worked out to per hour.
 */
export function hoursNote(h: DealHours): string | null {
  if (h.hours === null) return null;
  if (h.logged !== null) {
    return `${hoursLabel(h.logged)} logged · ${Math.round(
      (h.logged / h.hours) * 100,
    )}% used`;
  }
  if (h.rate !== null) return `$${h.rate.toLocaleString()}/hour`;
  return null;
}
