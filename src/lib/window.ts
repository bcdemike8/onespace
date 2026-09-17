/**
 * How far back a sync reaches.
 *
 * Three jobs ask this question - the calendar, Zoom, and which calls get
 * written up - and they used to answer it in two different shapes: two fixed
 * dates and one rolling number of days. So "the last seven days" quietly
 * overrode "since 1 August" for write-ups, and nobody could see either value
 * because neither was surfaced anywhere.
 *
 * One setting shape now, and it accepts both: "2026-08-31" means from that
 * day, "7" means the last seven days. A date is right for a backfill that
 * should stay put; a number is right for a window that should keep moving.
 *
 * Pure - no database, no clock of its own. The reader passes `now` in.
 */

/**
 * Where everything starts until somebody says otherwise. Brianna chose
 * 31 August 2026: the day before the first month the team ran on OneSpace.
 */
export const DEFAULT_SYNC_FROM = "2026-08-31";

/**
 * The three settings rows, here rather than beside the code that reads them.
 *
 * The sync modules are `server-only`, so a script that wanted to print or
 * change these couldn't import the key names from them without dragging the
 * whole sync in. Names are not server code.
 */
export const WINDOW_KEYS = {
  /** Which meetings appear at all. */
  calendar: "google.calendarFrom",
  /** Which Zoom calls are looked at. */
  zoom: "zoom.from",
  /** Which calls get read and summarised - the one that costs money. */
  writeups: "zoom.transcriptDays",
} as const;

export type Window =
  | { kind: "date"; from: Date }
  | { kind: "days"; days: number };

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A stored setting as a window, falling back when it is missing or nonsense.
 *
 * Nonsense rather than throwing: this value comes out of a settings table
 * somebody typed into, and a bad row must not take down every sync until
 * an admin notices. The fallback is a value this file chose, so it is
 * always good.
 */
export function parseWindow(
  value: string | null | undefined,
  fallback: string = DEFAULT_SYNC_FROM,
): Window {
  return read(value) ?? read(fallback) ?? { kind: "date", from: dayUtc(DEFAULT_SYNC_FROM)! };
}

function read(value: string | null | undefined): Window | null {
  const raw = (value ?? "").trim();
  if (raw === "") return null;

  const asDay = dayUtc(raw);
  if (asDay) return { kind: "date", from: asDay };

  // A plain number of days. Fractions and negatives are not a window.
  if (/^\d+$/.test(raw)) {
    const days = Number(raw);
    return days > 0 ? { kind: "days", days } : null;
  }

  return null;
}

/** "2026-08-31" at UTC midnight, or null if it isn't a real calendar day. */
function dayUtc(value: string): Date | null {
  const m = value.match(ISO_DAY);
  if (!m) return null;

  const [, y, mo, d] = m.map(Number) as unknown as [string, number, number, number];
  const date = new Date(Date.UTC(y, mo - 1, d));
  // Date.UTC rolls 2026-02-31 into March. A date that doesn't exist is a typo,
  // not a window.
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== mo - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

/** The moment a window starts, given the current time. */
export function sinceOf(window: Window, now: Date = new Date()): Date {
  return window.kind === "date"
    ? window.from
    : new Date(now.getTime() - window.days * 86_400_000);
}

/**
 * How the window reads in a sentence: "since 31 August 2026", or "in the
 * last 7 days".
 *
 * Written out rather than left as a number, because the two kinds of window
 * need different words and a message that says "the 17-day window" about a
 * fixed start date is both true today and wrong tomorrow.
 */
export function labelOf(window: Window): string {
  if (window.kind === "days") {
    return window.days === 1 ? "in the last day" : `in the last ${window.days} days`;
  }
  return `since ${new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(window.from)}`;
}
