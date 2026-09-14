import { db } from "@/lib/db";

/**
 * How recent something has to be to still be worth doing anything about.
 *
 * One number for the whole app: how far back calls get written up, and how
 * far back a suggestion is still offered as work. They answer the same
 * question and drifting apart would be worse than either value being wrong -
 * a queue offering things from calls nobody summarised is noise, and a
 * summary nobody is offered anything from is a dead end.
 */
export const RECENT_DAYS_KEY = "zoom.transcriptDays";
export const DEFAULT_RECENT_DAYS = 7;

export async function recentDays(): Promise<number> {
  const row = await db.appSetting.findUnique({ where: { key: RECENT_DAYS_KEY } });
  const days = Number(row?.value);
  return Number.isFinite(days) && days > 0 ? Math.floor(days) : DEFAULT_RECENT_DAYS;
}

/** The moment before which nothing is offered any more. */
export async function recentSince(): Promise<Date> {
  return new Date(Date.now() - (await recentDays()) * 86_400_000);
}
