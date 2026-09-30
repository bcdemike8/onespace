import { formatMonth, formatRange, monthEnd, monthStart } from "@/lib/dates";

/**
 * Which stretch of time the Timesheet's figures cover.
 *
 * The grid underneath is always one week - seven columns is what a week
 * grid is - but the numbers above it were stuck to that week too, so the
 * question everyone actually asks at month end ("how many hours did I log in
 * September, and what were they worth") meant opening Reports and rebuilding
 * a filter. These three buttons answer it in place.
 *
 * Plain module, no database: the ranges and the arithmetic are the parts
 * worth testing, and tests can't import anything server-only.
 */

export type TimesheetPeriod = "week" | "month" | "last_month";

export const TIMESHEET_PERIODS: { value: TimesheetPeriod; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "last_month", label: "Last month" },
];

export function parsePeriod(raw: string | undefined | null): TimesheetPeriod {
  return raw === "month" || raw === "last_month" ? raw : "week";
}

/**
 * The days the figures cover.
 *
 * "This week" follows the week the grid is showing, so the arrows move the
 * numbers with the sheet. The two months anchor on today instead: a button
 * labelled "Last month" has to mean last month, not "the month before
 * whichever week you happen to have scrolled to".
 */
export function periodRange(
  period: TimesheetPeriod,
  weekFrom: Date,
  weekTo: Date,
  now: Date,
): { from: Date; to: Date } {
  if (period === "month") return { from: monthStart(now), to: monthEnd(now) };
  if (period === "last_month") {
    const inLastMonth = monthStart(new Date(monthStart(now).getTime() - 1));
    return { from: inLastMonth, to: monthEnd(inLastMonth) };
  }
  return { from: weekFrom, to: weekTo };
}

/** "Sep 28 – Oct 4" for a week; "September 2026" for a month. */
export function periodLabel(period: TimesheetPeriod, from: Date, to: Date): string {
  return period === "week" ? formatRange(from, to) : formatMonth(from);
}

export interface PeriodEntry {
  minutes: number;
  billable: boolean;
  billRateCents: number;
  projectId: string;
}

export interface PeriodTotals {
  minutes: number;
  /** Of those minutes, the ones somebody can invoice for. */
  billableMinutes: number;
  /** Those billable minutes at the rate stored on each entry. */
  billableCents: number;
  /** How many distinct projects the period's time landed on. */
  projectCount: number;
}

export function summarize(entries: Iterable<PeriodEntry>): PeriodTotals {
  const projects = new Set<string>();
  let minutes = 0;
  let billableMinutes = 0;
  let billableCents = 0;

  for (const e of entries) {
    minutes += e.minutes;
    projects.add(e.projectId);
    if (e.billable) {
      billableMinutes += e.minutes;
      // Rates are per hour, so scale by minutes/60 and round once, per
      // entry - the same order the reports round in, so the two agree.
      billableCents += Math.round((e.minutes * e.billRateCents) / 60);
    }
  }

  return { minutes, billableMinutes, billableCents, projectCount: projects.size };
}

/**
 * The line under the money: what part of the period was billable.
 *
 * Worth saying on a timesheet specifically. Thirty hours logged and twenty
 * billable is the single most useful thing a consultant can notice about
 * their own week, and the total on its own hides it.
 */
export function billableSplit(t: PeriodTotals): string {
  if (t.minutes === 0) return "Nothing logged yet";
  if (t.billableMinutes === t.minutes) return "Every hour billable";
  if (t.billableMinutes === 0) return "No billable hours";
  return `${Math.round((t.billableMinutes / t.minutes) * 100)}% of hours billable`;
}
