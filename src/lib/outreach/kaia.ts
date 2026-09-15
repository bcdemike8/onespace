import "server-only";
import { outreachGet, type JsonApiList } from "@/lib/outreach/client";

/**
 * Kaia recordings, newest first, back as far as asked.
 *
 * No server-side date filter. Outreach supports filtering, but the exact
 * syntax for a date range on this resource isn't published, and a filter
 * guessed wrong either errors or - far worse - silently returns the wrong
 * set. Sorting is documented and sufficient: ask newest-first and stop
 * reading when the dates fall out of the window.
 */

export type KaiaRecording = {
  id: string;
  title: string;
  startTime: Date;
  /** What Kaia rode along on. Every one seen so far has been Zoom. */
  provider: string;
  /** Kaia's own player page. Not media, and not a transcript. */
  recordingUrl: string | null;
  /**
   * The calendar event this recording came from - a Google Calendar event id
   * in the calls seen so far, which is the same id OneSpace stores against a
   * meeting. That makes it the join, when it holds.
   */
  sourceId: string | null;
  seconds: number | null;
  hostName: string | null;
};

const PAGE = 50;
/** Enough for a fortnight of a busy team; a stop, not a target. */
const MAX_PAGES = 10;

function one(raw: NonNullable<JsonApiList["data"]>[number]): KaiaRecording | null {
  const a = (raw.attributes ?? {}) as Record<string, unknown>;
  const started = typeof a.startTime === "string" ? new Date(a.startTime) : null;
  if (!started || Number.isNaN(started.getTime())) return null;

  const host = a.host as { displayName?: unknown } | undefined;
  const seconds = Number(a.mediaDurationSeconds ?? a.botInMeetingSeconds);

  return {
    id: String(raw.id ?? ""),
    title: typeof a.title === "string" ? a.title : "Untitled call",
    startTime: started,
    provider: typeof a.provider === "string" ? a.provider : "unknown",
    recordingUrl: typeof a.recordingUrl === "string" ? a.recordingUrl : null,
    sourceId: typeof a.sourceId === "string" ? a.sourceId : null,
    seconds: Number.isFinite(seconds) ? seconds : null,
    hostName:
      host && typeof host.displayName === "string" ? host.displayName : null,
  };
}

export async function recentRecordings(since: Date): Promise<KaiaRecording[]> {
  const out: KaiaRecording[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const json = await outreachGet<JsonApiList>("/kaiaRecordings", {
      "page[size]": PAGE,
      "page[offset]": page * PAGE,
      sort: "-startTime",
    });

    const rows = (json.data ?? []).map(one).filter((r): r is KaiaRecording => r !== null);
    if (rows.length === 0) break;

    for (const row of rows) {
      if (row.startTime < since) return out;
      out.push(row);
    }

    if (rows.length < PAGE) break;
  }

  return out;
}
