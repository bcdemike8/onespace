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

/**
 * Find the access token in a reply, whatever Outreach decided to call it.
 *
 * The documented example and the live response don't agree, and the endpoint
 * answers 200 either way — so insisting on one field name turns a working
 * connection into a dead end with no clue in it. This looks for any key that
 * plausibly names a token, at the top level or inside a JSON:API
 * `data.attributes`, and takes the first that holds a string long enough to
 * be one.
 */
const TOKEN_KEY = /^(access_?token|token|api_?token|bearer_?token|jwt)$/i;

/** Shorter than this and it is a flag or an id, not a bearer token. */
const TOKEN_MIN = 20;

export function findAccessToken(
  json: unknown,
): { token: string; via: string } | null {
  const places: Array<[string, unknown]> = [];

  const branch = (prefix: string, node: unknown) => {
    if (!node || typeof node !== "object") return;
    places.push([prefix, node]);
    for (const child of ["attributes", "meta"] as const) {
      const sub = (node as Record<string, unknown>)[child];
      if (sub && typeof sub === "object") places.push([`${prefix}${child}.`, sub]);
    }
  };

  if (json && typeof json === "object") {
    branch("", json);
    branch("data.", (json as { data?: unknown }).data);
  }

  for (const [prefix, object] of places) {
    for (const [key, value] of Object.entries(object as Record<string, unknown>)) {
      if (TOKEN_KEY.test(key) && typeof value === "string" && value.length >= TOKEN_MIN) {
        return { token: value, via: `${prefix}${key}` };
      }
    }
  }
  return null;
}

/**
 * Every field name a reply contained, so an error can say what was actually
 * there instead of only what was missing. One round trip rather than two.
 */
export function keysSeen(json: unknown): string[] {
  const out: string[] = [];
  if (!json || typeof json !== "object") return out;

  out.push(...Object.keys(json as object));
  const data = (json as { data?: unknown }).data;
  if (data && typeof data === "object") {
    out.push(...Object.keys(data as object).map((k) => `data.${k}`));
    const attrs = (data as { attributes?: unknown }).attributes;
    if (attrs && typeof attrs === "object") {
      out.push(...Object.keys(attrs as object).map((k) => `data.attributes.${k}`));
    }
  }
  return out;
}

/**
 * Blank out anything shaped like a JWT before a diagnostic is shown.
 *
 * The report exists to be pasted to somebody who can read it, and the reply
 * that revealed where the token lives contained a live one. It expires in an
 * hour, but an hour is enough, and a diagnostic should never be the reason a
 * credential leaves the building.
 */
export function redactTokens(text: string): string {
  return text.replace(
    /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
    "[token redacted]",
  );
}

/**
 * Where this organisation's API actually lives.
 *
 * Outreach shards orgs across hosts — the token calls it a "bento" — and
 * hands the right base URL back with every token, under the org
 * relationship. Hardcoding api.outreach.io works in documentation and fails
 * against a real org, which is the whole argument for reading what a service
 * tells you rather than what you remember about it.
 */
export function apiBaseFrom(json: unknown): string | null {
  const link = (json as {
    data?: { relationships?: { org?: { links?: { api?: unknown } } } };
  })?.data?.relationships?.org?.links?.api;
  return typeof link === "string" && link.startsWith("https://") ? link : null;
}
