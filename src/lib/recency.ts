import { db } from "@/lib/db";
import { DEFAULT_SYNC_FROM, WINDOW_KEYS, labelOf, parseWindow, sinceOf } from "@/lib/window";
import { QUEUE_DAYS_DEFAULT, QUEUE_WINDOW_KEY, queueStart } from "@/lib/commitments/queue";

/**
 * How recent something has to be to still be worth doing anything about.
 *
 * One number for the whole app: how far back calls get written up, and how
 * far back a suggestion is still offered as work. They answer the same
 * question and drifting apart would be worse than either value being wrong -
 * a queue offering things from calls nobody summarised is noise, and a
 * summary nobody is offered anything from is a dead end.
 *
 * It used to be a rolling seven days, which quietly undercut the sync
 * windows: the calendar and Zoom both reached back to a fixed date, and then
 * this threw away everything older than a week of it. It now takes the same
 * shape as those two - a date, or a number of days - and starts on the same
 * day they do.
 */
export const RECENT_DAYS_KEY = WINDOW_KEYS.writeups;
export const DEFAULT_RECENT = DEFAULT_SYNC_FROM;

async function window() {
  const row = await db.appSetting.findUnique({ where: { key: RECENT_DAYS_KEY } });
  return parseWindow(row?.value, DEFAULT_RECENT);
}

/** The moment before which nothing is offered any more. */
export async function recentSince(): Promise<Date> {
  return sinceOf(await window());
}

/**
 * The window in words - "since 31 August 2026", or "in the last 7 days".
 *
 * Messages take this rather than a day count. "Older than the 17-day window"
 * is true today and wrong tomorrow when the window is a fixed date.
 */
export async function recentLabel(): Promise<string> {
  return labelOf(await window());
}

/**
 * How far back My work's "You said you'd do this" reaches.
 *
 * Separate from the write-up window above on purpose: how far back calls get
 * summarised is a question about the record, this one is about what is still
 * worth a consultant's attention this week. A fortnight by default, never
 * before the clean start in QUEUE_FLOOR. An admin can set the AppSetting
 * `mywork.queueWindow` to another number of days, or to a date.
 */
export async function queueSince(now: Date = new Date()): Promise<Date> {
  const row = await db.appSetting.findUnique({ where: { key: QUEUE_WINDOW_KEY } });
  return queueStart(parseWindow(row?.value, QUEUE_DAYS_DEFAULT), now);
}
