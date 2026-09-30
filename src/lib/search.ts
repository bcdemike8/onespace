/**
 * Type-ahead matching for the lists in this app.
 *
 * Every word has to appear somewhere in the row, in any order. "amplify
 * shannon" finds Shannon's Amplify projects; typing the words the other way
 * round finds the same ones. A single blob to match against beats separate
 * name/client/owner fields, because nobody types with a field in mind - they
 * type the two or three words they remember.
 */

/** Split on whitespace, lowercase, drop the empties. */
export function queryWords(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

export function matchesQuery(haystack: string, query: string): boolean {
  const words = queryWords(query);
  if (words.length === 0) return true;
  const hay = haystack.toLowerCase();
  return words.every((w) => hay.includes(w));
}

/**
 * Build the blob a row is matched against.
 *
 * Nulls and blanks are dropped rather than becoming "null", which would
 * otherwise make every unassigned project match a search for "null".
 */
export function searchText(...parts: (string | null | undefined)[]): string {
  return parts
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p))
    .join(" ");
}
