import "server-only";
import { db } from "@/lib/db";

/**
 * Whose turn it is, for a job that runs one person per request.
 *
 * The calendar, mail and Zoom syncs used to do everybody inside a single
 * HTTP call. Reading seven diaries over three weeks, with a database round
 * trip per meeting, takes minutes — and Railway's gateway gives up long
 * before that and returns a 502 with no body. The cron log said
 * "calendar failed (502)" every night, which meant the nightly sync had
 * never once completed.
 *
 * So each request now handles one person and says who is next. Every call is
 * seconds, nothing is near any timeout, and a run that dies halfway resumes
 * from where it stopped instead of starting the whole thing again.
 */
export interface Turn {
  person: { id: string; name: string } | null;
  /** Is there anybody after this one? The caller passes person.id as `after`. */
  more: boolean;
}

export async function nextTurn(after: string | null): Promise<Turn> {
  // Ordered by id rather than by name: a name can change mid-run, and an
  // order that changes under a cursor either skips somebody or loops.
  const two = await db.user.findMany({
    where: { isActive: true, ...(after ? { id: { gt: after } } : {}) },
    orderBy: { id: "asc" },
    take: 2,
    select: { id: true, name: true },
  });

  return { person: two[0] ?? null, more: two.length > 1 };
}
