/**
 * Closed business, counted.
 *
 * Pure: deals in, totals out. No database, no formatting, no colour. That is
 * what lets the numbers be checked against the real export - a revenue
 * report that is merely plausible is worse than none, because people act on
 * it.
 *
 * "Closed" here means closed-won. Lost deals are counted separately where
 * they are asked for and never folded into a revenue total.
 */

export interface ReportDeal {
  id: string;
  amount: number | null;
  closeDate: Date | null;
  isWon: boolean;
  isClosed: boolean;
  platform: string | null;
  businessType: string | null;
  clientName: string;
  ownerName: string | null;
}

export interface Bucket {
  key: string;
  label: string;
  amount: number;
  count: number;
}

const value = (d: ReportDeal) => d.amount ?? 0;

/** Every deal's year, from its close date. Deals with no date can't be dated. */
export const yearOf = (d: ReportDeal): number | null =>
  d.closeDate ? d.closeDate.getUTCFullYear() : null;

export const monthOf = (d: ReportDeal): number | null =>
  d.closeDate ? d.closeDate.getUTCMonth() : null;

export const won = (deals: ReportDeal[]) => deals.filter((d) => d.isWon);

/**
 * Totals by year, oldest first, with no gaps.
 *
 * Gaps matter: a year with no closed business is a fact about the business,
 * and leaving it out of the chart makes the bars lie about the spacing.
 */
export function byYear(deals: ReportDeal[]): Bucket[] {
  const dated = won(deals).filter((d) => yearOf(d) !== null);
  if (dated.length === 0) return [];

  const years = dated.map((d) => yearOf(d)!);
  const first = Math.min(...years);
  const last = Math.max(...years);

  const out: Bucket[] = [];
  for (let y = first; y <= last; y++) {
    const inYear = dated.filter((d) => yearOf(d) === y);
    out.push({
      key: String(y),
      label: String(y),
      amount: inYear.reduce((s, d) => s + value(d), 0),
      count: inYear.length,
    });
  }
  return out;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** All twelve months, always - an empty month is information. */
export function byMonth(deals: ReportDeal[], year: number): Bucket[] {
  const inYear = won(deals).filter((d) => yearOf(d) === year);
  return MONTHS.map((label, i) => {
    const rows = inYear.filter((d) => monthOf(d) === i);
    return {
      key: `${year}-${String(i + 1).padStart(2, "0")}`,
      label,
      amount: rows.reduce((s, d) => s + value(d), 0),
      count: rows.length,
    };
  });
}

/**
 * Totals by any dimension, biggest first.
 *
 * A tail beyond `top` is folded into "Other" rather than dropped, so the
 * parts still add up to the whole. A chart whose segments don't sum to the
 * headline is the fastest way to lose someone's trust in a dashboard.
 */
export function byDimension(
  deals: ReportDeal[],
  pick: (deal: ReportDeal) => string | null,
  options: { top?: number; noneLabel?: string } = {},
): Bucket[] {
  const { top, noneLabel = "Not recorded" } = options;

  const totals = new Map<string, Bucket>();
  for (const d of won(deals)) {
    const label = pick(d) ?? noneLabel;
    const bucket = totals.get(label) ?? { key: label, label, amount: 0, count: 0 };
    bucket.amount += value(d);
    bucket.count += 1;
    totals.set(label, bucket);
  }

  const sorted = [...totals.values()].sort(
    (a, b) => b.amount - a.amount || a.label.localeCompare(b.label),
  );
  if (!top || sorted.length <= top) return sorted;

  const head = sorted.slice(0, top);
  const tail = sorted.slice(top);
  head.push({
    key: "__other",
    label: `Other (${tail.length})`,
    amount: tail.reduce((s, b) => s + b.amount, 0),
    count: tail.reduce((s, b) => s + b.count, 0),
  });
  return head;
}

export interface Stack {
  /** The x-axis band - a year. */
  label: string;
  total: number;
  /** One entry per series, in the series order given. */
  parts: { series: string; amount: number }[];
}

/**
 * Years on the x-axis, one dimension stacked within each.
 *
 * The series order is fixed by the caller and the same in every band - so a
 * colour means the same thing across the whole chart, and a series missing
 * from one year leaves a gap rather than shifting the ones above it.
 */
export function stackByYear(
  deals: ReportDeal[],
  pick: (deal: ReportDeal) => string | null,
  series: string[],
  noneLabel = "Not recorded",
): Stack[] {
  return byYear(deals).map((year) => {
    const inYear = won(deals).filter((d) => String(yearOf(d)) === year.key);
    return {
      label: year.label,
      total: year.amount,
      parts: series.map((s) => ({
        series: s,
        amount: inYear
          .filter((d) => (pick(d) ?? noneLabel) === s)
          .reduce((sum, d) => sum + value(d), 0),
      })),
    };
  });
}

/** The series present, biggest first, so colour order follows importance. */
export function seriesFor(
  deals: ReportDeal[],
  pick: (deal: ReportDeal) => string | null,
  options: { top?: number; noneLabel?: string } = {},
): string[] {
  return byDimension(deals, pick, options).map((b) => b.label);
}

export interface Headline {
  revenue: number;
  wonCount: number;
  lostCount: number;
  openCount: number;
  openValue: number;
  averageWon: number;
  /** Of the deals that reached a decision, the share that were won. */
  winRate: number | null;
}

export function headline(deals: ReportDeal[]): Headline {
  const wonDeals = won(deals);
  const lost = deals.filter((d) => d.isClosed && !d.isWon);
  const open = deals.filter((d) => !d.isClosed);
  const revenue = wonDeals.reduce((s, d) => s + value(d), 0);
  const decided = wonDeals.length + lost.length;

  return {
    revenue,
    wonCount: wonDeals.length,
    lostCount: lost.length,
    openCount: open.length,
    openValue: open.reduce((s, d) => s + value(d), 0),
    averageWon: wonDeals.length ? revenue / wonDeals.length : 0,
    winRate: decided ? wonDeals.length / decided : null,
  };
}

// ------------------------------------------------------ Salesforce's own shapes

/**
 * Salesforce's Type field, put back together.
 *
 * The import split it in two on purpose: Outreach and Salesloft say which
 * platform, New Business and Existing Business say what kind of deal, and one
 * picklist could only ever answer one of those. That split is right for the
 * database and wrong for this page - the dashboard RevOptics reads has a
 * single Type axis with Outreach, New Business and Salesloft side by side,
 * because that is how the business talks.
 *
 * Reversible because the split was lossless: a deal carried a platform or a
 * business type, never both.
 */
export const dealType = (d: ReportDeal): string =>
  d.platform ?? d.businessType ?? "Not recorded";

/**
 * The fiscal quarter a deal closed in - "Q1-2026".
 *
 * RevOptics' fiscal year is the calendar year, which the export confirms:
 * "Current FY (1/1/2026 to 12/31/2026)". Written as a function anyway, so the
 * day that stops being true there is one place to change.
 */
export const FISCAL_YEAR_STARTS_IN_MONTH = 0;

export function fiscalPeriodOf(d: ReportDeal): string | null {
  if (!d.closeDate) return null;
  const quarter = Math.floor(d.closeDate.getUTCMonth() / 3) + 1;
  return `Q${quarter}-${d.closeDate.getUTCFullYear()}`;
}

export const fiscalYearOf = (d: ReportDeal): number | null => yearOf(d);

/** The first and last instant of a fiscal year, as UTC. */
export function fiscalYearRange(year: number): { from: Date; to: Date } {
  return {
    from: new Date(Date.UTC(year, FISCAL_YEAR_STARTS_IN_MONTH, 1)),
    to: new Date(Date.UTC(year + 1, FISCAL_YEAR_STARTS_IN_MONTH, 1) - 1),
  };
}

export interface Group {
  key: string;
  label: string;
  total: number;
  count: number;
  /** One entry per series, in the order given - always, even at zero. */
  parts: { series: string; amount: number; count: number }[];
}

/**
 * Months across, one dimension grouped within each - side by side, not
 * stacked.
 *
 * Every month between the bounds appears whether or not anything closed in
 * it, and every series appears in every month. Both are the same rule: a
 * chart that omits the empty ones makes the spacing lie, and a series that
 * appears only where it is non-zero changes colour position between bands.
 */
export function groupByMonth(
  deals: ReportDeal[],
  from: Date,
  to: Date,
  pick: (d: ReportDeal) => string,
  series: string[],
): Group[] {
  const inRange = won(deals).filter(
    (d) => d.closeDate && d.closeDate >= from && d.closeDate <= to,
  );

  const out: Group[] = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  const last = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));

  while (cursor <= last) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();
    const rows = inRange.filter(
      (d) =>
        d.closeDate!.getUTCFullYear() === year && d.closeDate!.getUTCMonth() === month,
    );

    out.push({
      key: `${year}-${String(month + 1).padStart(2, "0")}`,
      label: `${MONTHS[month]} ${String(year).slice(2)}`,
      total: rows.reduce((s, d) => s + value(d), 0),
      count: rows.length,
      parts: series.map((s) => {
        const mine = rows.filter((d) => pick(d) === s);
        return {
          series: s,
          amount: mine.reduce((sum, d) => sum + value(d), 0),
          count: mine.length,
        };
      }),
    });

    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return out;
}
