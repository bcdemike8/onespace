import { dayInZone, dayStart } from "@/lib/dates";

/**
 * Where the Meetings tab starts.
 *
 * Calls from before 1 November were tracked the old way, and the logged /
 * not billable labels on them say more about how the backlog was cleared
 * than about the work. The tab starts clean from here: nothing earlier is
 * listed, counted or offered to clear. Nothing is deleted either - the
 * meetings and any time entries made from them are all still there - so
 * moving this date back brings them straight back into view.
 *
 * The same date the client mail starts from.
 */
export const MEETINGS_FROM = "2026-11-01";

/** The first day shown, as a timesheet day (UTC midnight). */
export const meetingsFromDay = (): Date => dayStart(MEETINGS_FROM);

/**
 * A safe lower bound for a database query. A day early, because which day a
 * call falls on depends on the zone; filter with `onOrAfterStart` after.
 */
export const meetingsFromBound = (): Date =>
  new Date(meetingsFromDay().getTime() - 86_400_000);

/** Whether a call falls on or after the start day, in the org's zone. */
export const onOrAfterStart = (startsAt: Date, zone: string): boolean =>
  dayInZone(startsAt, zone) >= meetingsFromDay();
