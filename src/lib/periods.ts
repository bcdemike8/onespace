// Closing the books.
//
// A month closes on the first Friday after it ends: August closes on the first
// Friday of September, and from that Friday onwards nobody can add, edit or
// delete time dated August or earlier. That's the point at which the month has
// been invoiced, and time that has been invoiced shouldn't move underneath the
// invoice.
//
// Everything here is pure and works in calendar days (UTC midnight), so it can
// be used on the server and in the browser and agree with itself.

import { dayStart, monthEnd, toISODate } from "@/lib/dates";

const FRIDAY = 5; // Date.getUTCDay()

/** The first Friday of the given month. `month` is 0-based, as in `Date`. */
export function firstFridayOf(year: number, month: number): Date {
  const first = new Date(Date.UTC(year, month, 1));
  const shift = (FRIDAY - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, month, 1 + shift));
}

/**
 * The day the month containing `date` closes: the first Friday of the month
 * after it.
 */
export function monthClosesOn(date: Date): Date {
  const d = dayStart(date);
  return firstFridayOf(d.getUTCFullYear(), d.getUTCMonth() + 1);
}

/**
 * The last calendar day that is locked, given today — the end of the most
 * recent month whose closing Friday has arrived. Null before the very first
 * close, when nothing is locked yet.
 */
export function lockedThrough(today: Date): Date | null {
  const t = dayStart(today);

  // Walk back from this month until we find one that has already closed. At
  // most two steps: the previous month closes within the first week of this
  // one, so if it hasn't closed yet the one before it certainly has.
  for (let back = 1; back <= 2; back++) {
    const candidate = new Date(
      Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - back + 1, 0),
    );
    if (monthClosesOn(candidate) <= t) return candidate;
  }
  return null;
}

export interface LockState {
  /** Last locked day, or null when nothing is locked. */
  lockedThrough: Date | null;
  /** Admin override: dates on or after this are editable despite the rule. */
  reopenedFrom: Date | null;
}

/** Is this date inside a closed period? */
export function isLocked(date: Date, state: LockState): boolean {
  if (!state.lockedThrough) return false;
  const d = dayStart(date);
  if (d > state.lockedThrough) return false;
  if (state.reopenedFrom && d >= state.reopenedFrom) return false;
  return true;
}

/** Does this week contain any locked day? Used to grey a whole timesheet week. */
export function weekHasLockedDays(days: Date[], state: LockState): boolean {
  return days.some((d) => isLocked(d, state));
}

/**
 * Wording for the banner. Deliberately says both what is locked and when the
 * next close lands, because "why can't I edit this?" is the question people
 * actually have.
 */
export function lockSummary(today: Date, state: LockState): string {
  const t = dayStart(today);
  const prevMonthEnd = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 0));

  // Whichever close lands next: last month's, if its Friday hasn't arrived, or
  // otherwise this month's.
  const pending =
    monthClosesOn(prevMonthEnd) > t ? prevMonthEnd : monthEnd(t);
  const nextClose = monthClosesOn(pending);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  const monthName = (d: Date) =>
    d.toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "long",
      year: "numeric",
    });

  const next = `${monthName(pending)} closes on ${fmt(nextClose)}.`;
  if (!state.lockedThrough) return `Nothing is locked yet. ${next}`;

  const base = `Time up to and including ${fmt(state.lockedThrough)} is locked. ${next}`;
  if (state.reopenedFrom) {
    return `${base} An admin has reopened ${fmt(state.reopenedFrom)} onwards.`;
  }
  return base;
}

/** The message a blocked write gets back. */
export function lockedError(date: Date): string {
  return `${toISODate(date)} falls in a closed period. Ask an admin to reopen it if it needs changing.`;
}
