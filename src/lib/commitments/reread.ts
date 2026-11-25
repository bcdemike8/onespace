/**
 * What a reading of a call changes about the items already stored for it.
 *
 * A call can be read more than once - "Re-read transcripts", "Read this
 * call now", or the sync retrying. Each reading may word things differently,
 * so it has to be merged with what's there, not laid over it:
 *
 *  - Only the host's own items, and items whose owner couldn't be
 *    established, are replaced by a new reading. The host chose to re-read
 *    the call; a colleague's commitment on it is theirs, and stays exactly
 *    as it is until they decide about it.
 *  - Nothing anyone has added or dismissed comes back.
 *  - Nothing already waiting for somebody is offered twice.
 *
 * The caller applies this only after a reading that actually happened. A
 * reading that failed, or found no transcript to read, changes nothing - so
 * a re-read can never lose items on the way.
 *
 * Pure, so it can be tested with several consultants on one call.
 */
import { normalTask, sameUndertaking } from "@/lib/commitments/queue";

export interface StoredItem {
  id: string;
  ownerId: string | null;
  status: "PENDING" | "ACCEPTED" | "DISMISSED";
  title: string;
  quote: string;
}

export interface NewItem {
  ownerId: string | null;
  suggestedTask: string;
  text: string;
}

export function planReading<T extends NewItem>(
  stored: StoredItem[],
  reading: T[],
  hostId: string,
): { remove: string[]; add: T[] } {
  const replaceable = (s: StoredItem) =>
    s.status === "PENDING" && (s.ownerId === hostId || s.ownerId === null);

  const remove = stored.filter(replaceable).map((s) => s.id);
  // What stays, and so mustn't be repeated: every decision, and every
  // colleague's waiting item.
  const staying = stored.filter((s) => !replaceable(s));

  const seen = new Set<string>();
  const add = reading.filter((item) => {
    const key = `${item.ownerId ?? ""}|${normalTask(item.suggestedTask)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return !staying.some((s) =>
      sameUndertaking(
        { title: item.suggestedTask, quote: item.text },
        { title: s.title, quote: s.quote },
      ),
    );
  });

  return { remove, add };
}
