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

export type TimesheetPeriod = "week" | "month" | "last_month" | "custom";

export const TIMESHEET_PERIODS: { value: TimesheetPeriod; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "custom", label: "Custom" },
];

export function parsePeriod(raw: string | undefined | null): TimesheetPeriod {
  return raw === "month" || raw === "last_month" || raw === "custom" ? raw : "week";
}

/** A date somebody typed, or null if it wasn't one. */
export function parseDay(raw: string | undefined | null): Date | null {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * The two ends of a custom range, in order.
 *
 * Reversed dates are swapped rather than rejected. Somebody who typed the
 * end into the start box meant the range between them, and an error message
 * that makes them retype both is pedantry about a mistake the machine can
 * see through.
 */
export function customRange(
  fromRaw: string | undefined | null,
  toRaw: string | undefined | null,
): { from: Date; to: Date } | null {
  const a = parseDay(fromRaw);
  const b = parseDay(toRaw);
  if (!a || !b) return null;
  return a <= b ? { from: a, to: b } : { from: b, to: a };
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
  custom?: { from: Date; to: Date } | null,
): { from: Date; to: Date } {
  // A half-filled custom range falls back to the week rather than showing
  // nothing: the figures are never blank because of a box nobody finished.
  if (period === "custom") return custom ?? { from: weekFrom, to: weekTo };
  if (period === "month") return { from: monthStart(now), to: monthEnd(now) };
  if (period === "last_month") {
    const inLastMonth = monthStart(new Date(monthStart(now).getTime() - 1));
    return { from: inLastMonth, to: monthEnd(inLastMonth) };
  }
  return { from: weekFrom, to: weekTo };
}

/** "Sep 28 – Oct 4" for a week or a custom span; "Sep 2026" for a month. */
export function periodLabel(period: TimesheetPeriod, from: Date, to: Date): string {
  if (period === "month" || period === "last_month") return formatMonth(from);
  return formatRange(from, to);
}

/** How many days the figures cover, both ends included. */
export function daysInRange(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
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
