import "server-only";
import { OutreachError } from "@/lib/outreach/errors";
import { outreachGet, type JsonApiList } from "@/lib/outreach/client";
import { describeRecord, preview, type Field } from "@/lib/outreach/shape";

/**
 * Ask Outreach what a Kaia recording actually is, before anything is built
 * on an assumption about it.
 *
 * Two things are unknown and neither can be settled from documentation:
 * Outreach's API reference is generated behind a login, and the attribute
 * list for this resource isn't published anywhere public.
 *
 *   - Whether a kaiaRecording carries the words people said, or only a link
 *     to a recording and some metadata. Everything downstream depends on it:
 *     OneSpace summarises transcripts, and a media URL is not one.
 *   - Whether the endpoint accepts a server-to-server token at all. Only a
 *     subset of Outreach endpoints do, and a scope being tickable in the
 *     developer portal is not a promise that the endpoint behind it is in
 *     that subset.
 *
 * So this asks, once, and prints what came back.
 */

export type Probe = {
  path: string;
  status: number;
  ok: boolean;
  count?: number;
  fields?: Field[];
  relationships?: string[];
  note?: string;
};

/**
 * The resources worth asking about.
 *
 * `users` first and deliberately: it is the control. It proves the app token,
 * the installation id and the access token all work, so that a failure
 * further down the list means something specific rather than "Outreach said
 * no". The two Kaia spellings are both tried because the data dictionary and
 * the scope list don't agree on which one the REST API exposes.
 */
const CANDIDATES = [
  "/users",
  "/kaiaRecordings",
  "/kaiaMeetings",
  "/calls",
  "/meetings",
] as const;

async function probe(path: string): Promise<Probe> {
  try {
    const json = await outreachGet<JsonApiList>(path, { "page[size]": 2 });
    const records = json.data ?? [];
    const first = records[0];

    return {
      path,
      status: 200,
      ok: true,
      count: records.length,
      fields: first?.attributes ? describeRecord(first.attributes) : undefined,
      relationships: first?.relationships
        ? Object.keys(first.relationships).sort()
        : undefined,
      note:
        records.length === 0 ? "Endpoint works, but returned nothing." : undefined,
    };
  } catch (e) {
    if (e instanceof OutreachError) {
      return {
        path,
        status: e.status,
        ok: false,
        note: [e.message, e.body ? `Outreach said: ${preview(e.body)}` : null]
          .filter(Boolean)
          .join(" "),
      };
    }
    return {
      path,
      status: 0,
      ok: false,
      note: e instanceof Error ? e.message : "Unknown failure.",
    };
  }
}

export async function discoverOutreach(): Promise<Probe[]> {
  const out: Probe[] = [];
  // One at a time, on purpose. Outreach rate limits, and a burst of five
  // would make a 429 look like a scope problem.
  for (const path of CANDIDATES) {
    out.push(await probe(path));
  }
  return out;
}
