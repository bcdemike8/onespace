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
  const byFirst = new Map<string, { id: string; last: string }[]>();

  for (const p of people) {
    for (const key of fullKeys(p.name)) {
      byFull.set(key, byFull.has(key) ? null : p.id);
    }
    const parts = clean(p.name).split(" ").filter(Boolean);
    if (parts.length === 0) continue;
    const first = parts[0];
    const last = parts.length > 1 ? parts[parts.length - 1] : "";
    byFirst.set(first, [...(byFirst.get(first) ?? []), { id: p.id, last }]);
  }

  return {
    match(name) {
      if (!name) return undefined;
      for (const key of fullKeys(name)) {
        if (byFull.has(key)) return byFull.get(key);
      }

      const parts = clean(name).split(" ").filter(Boolean);
      if (parts.length === 0) return undefined;
      const hits = byFirst.get(parts[0]) ?? [];
      if (hits.length === 0) return undefined;

      // "Marcus" on its own: ours if only one of ours is called that.
      if (parts.length === 1) return hits.length === 1 ? hits[0].id : null;

      // "Marcus C" / "Marcus Call": whoever's surname that starts. "Marcus
      // Brown" is somebody else who happens to share a first name with ours.
      const rest = parts[parts.length - 1];
      const fits = hits.filter((h) => h.last && h.last.startsWith(rest));
      if (fits.length === 0) return undefined;
      return fits.length === 1 ? fits[0].id : null;
    },
  };
}
