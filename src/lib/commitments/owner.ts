/**
 * Whose action item is it?
 *
 * An action item belongs to the RevOptics person who undertook it - not to
 * whoever hosted the call. They see it on My work, and accepting it puts the
 * task on their plate. This file decides who that is, from a name as a
 * transcript, Claude or a recap email wrote it.
 *
 * Pure functions, no database: the matching is the part worth arguing with
 * and testing against real names.
 */

export interface NamedPerson {
  id: string;
  name: string;
}

/** Lowercased, punctuation and "(Guest)"-style suffixes removed. */
function clean(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\(.*\)\s*$/, "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every way a transcript might write one person's whole name. */
function fullKeys(name: string): string[] {
  const n = clean(name);
  if (!n) return [];
  const parts = n.split(" ");
  return [...new Set(parts.length > 1 ? [n, `${parts[0]} ${parts[parts.length - 1]}`] : [n])];
}

export interface NameIndex {
  /**
   * The person a name refers to.
   *
   * An id when it's one of ours and only one; null when it could be more
   * than one of ours (a wrong assignment is worse than none); undefined when
   * it's nobody we know.
   */
  match(name: string | null | undefined): string | null | undefined;
}

export function buildNameIndex(people: NamedPerson[]): NameIndex {
  // Full name and first-plus-last. Shared by two people means nobody.
  const byFull = new Map<string, string | null>();
  // First name alone - "Marcus", "Marcus C" - only ever as a last resort.
  const byFirst = new Map<string, { id: string; last: string } | null>();

  for (const p of people) {
    for (const key of fullKeys(p.name)) {
      byFull.set(key, byFull.has(key) ? null : p.id);
    }
    const parts = clean(p.name).split(" ").filter(Boolean);
    if (parts.length === 0) continue;
    const first = parts[0];
    const last = parts.length > 1 ? parts[parts.length - 1] : "";
    byFirst.set(first, byFirst.has(first) ? null : { id: p.id, last });
  }

  return {
    match(name) {
      if (!name) return undefined;
      for (const key of fullKeys(name)) {
        if (byFull.has(key)) return byFull.get(key);
      }

      const parts = clean(name).split(" ").filter(Boolean);
      if (parts.length === 0) return undefined;
      const hit = byFirst.get(parts[0]);
      if (hit === undefined) return undefined;
      if (hit === null) return null;

      // "Marcus" on its own, or "Marcus C" / "Marcus Call" where what
      // follows is the start of their surname. "Marcus Brown" is somebody
      // else who happens to share a first name with one of ours.
      if (parts.length === 1) return hit.id;
      const rest = parts[parts.length - 1];
      return hit.last && hit.last.startsWith(rest) ? hit.id : undefined;
    },
  };
}

/** Who an item is assigned to, and whether the name was one we could place. */
export interface Ownership {
  ownerId: string | null;
  ownerUnrecognised: boolean;
}

/**
 * The owner of something Claude says a RevOptics person undertook.
 *
 * Matched: theirs. Named but not matched - a Zoom display name like "iPhone",
 * or two of ours with that name - goes to the host, marked so the host can
 * hand it on. Claude is asked to always name the owner; an item without one
 * isn't a RevOptics undertaking anybody can be held to, so it's dropped.
 */
export function aiOwnership(index: NameIndex, owner: string | null): Ownership | null {
  const name = owner?.trim();
  if (!name) return null;
  const id = index.match(name);
  return id ? { ownerId: id, ownerUnrecognised: false } : { ownerId: null, ownerUnrecognised: true };
}

/**
 * Which of a reading's action items are RevOptics', and whose.
 *
 * The step after Claude, for calls and recap emails alike: only items Claude
 * marked as ours, only with a named owner, matched to a OneSpace person where
 * possible. Everything the client owes, or nobody took on, stops here.
 */
export function ourActionItems<T extends { owner: string | null; ours: boolean }>(
  items: T[],
  index: NameIndex,
): (T & Ownership)[] {
  return items.flatMap((item) => {
    if (!item.ours) return [];
    const owner = aiOwnership(index, item.owner);
    return owner ? [{ ...item, ...owner }] : [];
  });
}
