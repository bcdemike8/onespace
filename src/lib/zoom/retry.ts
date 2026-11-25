/**
 * Which calls the sync goes back to, and which counts the health panel shows.
 *
 * Pure functions over a meeting's stored fields, so both can be tested.
 */

/** How long a call waits between automatic attempts at a write-up. */
export const DAILY_RETRY_MS = 20 * 60 * 60 * 1000;

/**
 * Reasons that won't change by trying again, so they're never retried:
 * a transcript too short to read, a reading Claude ran out of room for or
 * declined, and a call outside the write-up window on purpose.
 */
export const SETTLED_NOTE =
  /^(The transcript for this call is only|Claude ran out of room|Claude declined|Write-ups only cover calls)/;

export interface StoredCall {
  startsAt: Date;
  transcriptReadAt: Date | null;
  transcriptFailedAt: Date | null;
  summarisedAt: Date | null;
  transcriptNote: string | null;
}

/**
 * A recent call that was looked at but has no write-up - read before Claude
 * was connected, before the transcript existed, before a Zoom permission was
 * fixed. The sync used to skip these for good once they were marked read,
 * so the only way back was clicking "Read this call now". Now each is tried
 * again, at most once a day, while it's within My work's window.
 *
 * Asking Zoom is cheap; Claude is only used when Zoom has a transcript.
 */
export function retryWithoutWriteUp(call: StoredCall, since: Date, now: Date = new Date()): boolean {
  if (!call.transcriptReadAt || call.summarisedAt) return false;
  if (call.startsAt < since) return false;
  if (call.transcriptNote && SETTLED_NOTE.test(call.transcriptNote)) return false;
  const t = now.getTime();
  if (t - call.transcriptReadAt.getTime() < DAILY_RETRY_MS) return false;
  if (call.transcriptFailedAt && t - call.transcriptFailedAt.getTime() < DAILY_RETRY_MS) return false;
  return true;
}

// ------------------------------------------------------------ health panel

export interface CallRow extends StoredCall {
  userId: string;
  zoomUuid: string | null;
}

export interface PersonHealth {
  id: string;
  name: string;
  /** Meetings on their calendar or Zoom in the window. */
  calls: number;
  /** Not linked to any Zoom call of theirs - hosted elsewhere, or not on Zoom. */
  notOnZoom: number;
  writtenUp: number;
  /** Linked to Zoom, not read yet. */
  waiting: number;
  /** Linked to Zoom, read, no write-up. */
  noWriteUp: number;
  /** The commonest reason given for those, if any. */
  topReason: string | null;
}

/** Per person: what happened to their recent calls. */
export function callHealth(rows: CallRow[], people: { id: string; name: string }[]): PersonHealth[] {
  return people.map((p) => {
    const mine = rows.filter((r) => r.userId === p.id);
    const onZoom = mine.filter((r) => r.zoomUuid);
    const noWriteUp = onZoom.filter((r) => r.transcriptReadAt && !r.summarisedAt);
    const reasons = new Map<string, number>();
    for (const r of noWriteUp) {
      const why = (r.transcriptNote ?? "No reason recorded").trim();
      reasons.set(why, (reasons.get(why) ?? 0) + 1);
    }
    const top = [...reasons.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      id: p.id,
      name: p.name,
      calls: mine.length,
      notOnZoom: mine.length - onZoom.length,
      writtenUp: onZoom.filter((r) => r.summarisedAt).length,
      waiting: onZoom.filter((r) => !r.transcriptReadAt).length,
      noWriteUp: noWriteUp.length,
      topReason: top ? top[0] : null,
    };
  });
}
