/**
 * Reading an unfamiliar record and saying what is in it.
 *
 * Pure, and separate from the code that fetches, so it can be tested against
 * made-up records without pretending to be Outreach. What it is for: nobody
 * has published the attribute list for a Kaia recording, so the first thing
 * OneSpace does is describe whatever comes back and let a person look at it.
 */

/** How much of a value to show. Enough to recognise, not enough to be a copy. */
export const SAMPLE = 100;

export type Field = { name: string; type: string; sample: string };

export const preview = (s: string) =>
  s.length > SAMPLE ? `${s.slice(0, SAMPLE)}…` : s;

export function describeValue(value: unknown): { type: string; sample: string } {
  if (value === null || value === undefined) return { type: "null", sample: "" };
  if (Array.isArray(value))
    return {
      type: `array(${value.length})`,
      sample: preview(JSON.stringify(value)),
    };
  if (typeof value === "object")
    return { type: "object", sample: preview(JSON.stringify(value)) };
  if (typeof value === "string")
    // Length is the tell. A transcript runs to thousands of characters; a URL,
    // a timestamp and a title do not.
    return { type: `string(${value.length})`, sample: preview(value) };
  return { type: typeof value, sample: preview(String(value)) };
}

export function describeRecord(attributes: Record<string, unknown>): Field[] {
  return Object.entries(attributes)
    .map(([name, value]) => ({ name, ...describeValue(value) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const BY_NAME = /transcript|summary|caption|utterance|note|text|body|content/i;

/** A long string counts however it is named. */
const LONG_ENOUGH = 400;

/**
 * Which fields, if any, look like they hold what was said.
 *
 * Deliberately looser than a name test alone: the whole point is to find a
 * transcript that turned out to be called something nobody predicted, so
 * length is treated as evidence in its own right.
 */
export function transcriptCandidates(fields: Field[] | undefined): string[] {
  if (!fields) return [];
  return fields
    .filter((f) => {
      const long = /^string\((\d+)\)$/.exec(f.type);
      return (long ? Number(long[1]) >= LONG_ENOUGH : false) || BY_NAME.test(f.name);
    })
    .map((f) => `${f.name} ${f.type}`);
}
