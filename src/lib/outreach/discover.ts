import "server-only";
import { OutreachError } from "@/lib/outreach/errors";
import {
  outreachGet,
  outreachProbe,
  type JsonApiList,
} from "@/lib/outreach/client";
import { describeRecord, redactTokens, type Field } from "@/lib/outreach/shape";

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
        // Outreach's own words, whole. The 100-character limit elsewhere is
        // there to keep client conversation out of a report; an error body
        // from an auth endpoint is install metadata, and cutting it off is
        // how a diagnostic turns into another round trip.
        note: [e.message, e.body ? `Outreach said: ${redactTokens(e.body)}` : null]
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

/**
 * Hunt for the transcript.
 *
 * The recording list has no field holding what was said — only metadata and
 * a link to a player page. That leaves three possibilities, and guessing
 * between them has already cost this project more than asking would have:
 * the words hang off the recording as a relationship, they live at a
 * resource of their own, or the REST API simply doesn't carry them and the
 * daily export to storage is the only route.
 *
 * So this asks in the order that settles it fastest. A deliberately invalid
 * `include` comes first, because a JSON:API service answering one usually
 * lists the includes it does accept — which is the published relationship
 * list nobody published.
 */
export type Attempt = { what: string; status: number; body: string };

export async function huntTranscript(): Promise<Attempt[]> {
  const out: Attempt[] = [];
  const say = (what: string, r: { status: number; body: string }) =>
    out.push({ what, status: r.status, body: redactTokens(r.body).slice(0, 1200) });

  // The newest recording, for its id. Everything below is asked about a real
  // record rather than a placeholder.
  const listed = await outreachProbe("/kaiaRecordings", {
    "page[size]": 1,
    sort: "-createdAt",
  });
  say("newest recording", listed);

  let id: string | null = null;
  try {
    const parsed = JSON.parse(listed.body) as JsonApiList;
    const first = parsed.data?.[0]?.id;
    if (first !== undefined && first !== null) id = String(first);
  } catch {
    // Leave id null; the attempts below that need one are skipped.
  }

  // A wrong include, to make Outreach name the right ones.
  say(
    "invalid include (expect a list of valid ones)",
    await outreachProbe("/kaiaRecordings", {
      "page[size]": 1,
      include: "thisIsNotARelationship",
    }),
  );

  for (const relationship of ["transcript", "transcripts", "utterances"]) {
    say(
      `include=${relationship}`,
      await outreachProbe("/kaiaRecordings", {
        "page[size]": 1,
        include: relationship,
      }),
    );
  }

  if (id) {
    say(`single recording ${id}`, await outreachProbe(`/kaiaRecordings/${id}`));
    say(
      `sub-resource /kaiaRecordings/${id}/transcript`,
      await outreachProbe(`/kaiaRecordings/${id}/transcript`),
    );
  }

  for (const resource of [
    "/kaiaRecordingTranscripts",
    "/kaiaTranscripts",
    "/transcripts",
    "/callTranscripts",
    "/kaiaUtterances",
  ]) {
    say(`resource ${resource}`, await outreachProbe(resource, { "page[size]": 1 }));
  }

  return out;
}
