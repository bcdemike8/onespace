import "server-only";
import { db } from "@/lib/db";
import { recentLabel, recentSince } from "@/lib/recency";
import { pickTranscript } from "@/lib/zoom/files";
import {
  ZoomError,
  getMeetingSummary,
  getRecording,
  listPastMeetings,
  listZoomUsers,
  recordingSettings,
} from "@/lib/zoom/client";

/**
 * Why there is no write-up, per call, from Zoom's own mouth.
 *
 * Everything tried so far has been a fix aimed at a guess. This asks
 * instead, in the order the pipeline actually runs, and prints what came
 * back at each step:
 *
 *   1. Is the account even set to record to the cloud and transcribe? If not,
 *      no code change can produce a transcript and everything below is noise.
 *   2. Did the call happen, and did Zoom keep a recording of it?
 *   3. Among that recording's files, is there a transcript — and if not,
 *      what is there instead?
 *   4. What does OneSpace hold for it, and what did it last say went wrong?
 *
 * The four answers together identify the failure. Any one of them alone has
 * been mistaken for the others all week.
 */

/** A stop, so a diagnostic can't outrun the request that asked for it. */
const MAX_CALLS = 40;
const BUDGET_MS = 90_000;

export type CallDiag = {
  topic: string;
  startedAt: string;
  uuid: string;
  /** What Zoom holds: a recording, nothing, or a refusal. */
  recording: string;
  /** Every file on it, with the state Zoom reports. */
  files: string[];
  /** What the transcript picker made of those files. */
  transcript: string;
  /** Zoom's own AI summary, where the plan has one. */
  aiSummary: string;
  /** What OneSpace has for this call. */
  onespace: string;
};

export type PersonDiag = {
  email: string;
  settings: string[];
  calls: CallDiag[];
  note?: string;
};

export type ZoomDiagnosis = {
  /** The window in words - "since 31 August 2026", or "in the last 7 days". */
  window: string;
  people: PersonDiag[];
  truncated: boolean;
  note?: string;
};

/**
 * The recording settings that decide whether a transcript can exist.
 *
 * Matched by meaning rather than by an exact field name, because those names
 * differ by plan and API version. Anything mentioning recording, transcript
 * or caption is shown with its value, and the caller reads it.
 */
function settingsLines(recording: Record<string, unknown>): string[] {
  const interesting = /record|transcript|caption|archive/i;
  const out: string[] = [];

  for (const [key, value] of Object.entries(recording)) {
    if (!interesting.test(key)) continue;
    if (value !== null && typeof value === "object") {
      for (const [k2, v2] of Object.entries(value as Record<string, unknown>)) {
        if (interesting.test(k2) && typeof v2 !== "object") {
          out.push(`${key}.${k2} = ${String(v2)}`);
        }
      }
      continue;
    }
    out.push(`${key} = ${String(value)}`);
  }
  return out.sort();
}

const when = (iso: string) => iso.slice(0, 16).replace("T", " ");

export async function diagnoseZoom(): Promise<ZoomDiagnosis> {
  const deadline = Date.now() + BUDGET_MS;
  const [since, window] = await Promise.all([recentSince(), recentLabel()]);
  const now = new Date();

  const users = await listZoomUsers();
  const people: PersonDiag[] = [];
  let seen = 0;
  let truncated = false;

  for (const user of users) {
    if (Date.now() > deadline) {
      truncated = true;
      break;
    }

    const person: PersonDiag = { email: user.email, settings: [], calls: [] };

    try {
      person.settings = settingsLines(await recordingSettings(user.id));
    } catch (e) {
      person.settings = [
        e instanceof ZoomError
          ? `Couldn't read settings: ${e.message}`
          : "Couldn't read settings.",
      ];
    }

    let meetings: Awaited<ReturnType<typeof listPastMeetings>> = [];
    try {
      meetings = await listPastMeetings(user.id, since, now);
    } catch (e) {
      person.note =
        e instanceof ZoomError
          ? `Couldn't list meetings: ${e.message}`
          : "Couldn't list meetings.";
      people.push(person);
      continue;
    }

    // Newest first: the recent ones are the ones being complained about.
    meetings.sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
    );

    for (const m of meetings) {
      if (seen >= MAX_CALLS || Date.now() > deadline) {
        truncated = true;
        break;
      }
      seen++;
      person.calls.push(await oneCall(m));
    }

    people.push(person);
  }

  return {
    window,
    people,
    truncated,
    note: users.length === 0 ? "Zoom returned no active users." : undefined,
  };
}

async function oneCall(
  m: Awaited<ReturnType<typeof listPastMeetings>>[number],
): Promise<CallDiag> {
  const base = {
    topic: m.topic,
    startedAt: when(m.start_time),
    uuid: m.uuid,
  };

  let recording = "";
  let files: string[] = [];
  let transcript = "";

  try {
    const rec = await getRecording(m.uuid);
    if (!rec) {
      recording = "Zoom has no recording for this call.";
      transcript = "Nothing to read — the call wasn't recorded to the cloud.";
    } else {
      const list = rec.recording_files ?? [];
      recording = `Recording present, ${list.length} file(s).`;
      files = list.map(
        (f) =>
          `${f.recording_type ?? f.file_type ?? "unknown"}` +
          `${f.file_type ? ` (${f.file_type})` : ""}` +
          `${f.status ? ` — ${f.status}` : ""}` +
          `${f.download_url ? "" : " — no download url"}`,
      );

      const pick = pickTranscript(list);
      transcript = pick.url
        ? `Transcript available (${pick.kind ?? "unknown kind"}).`
        : `No transcript. ${pick.reason ?? "No reason given."}`;
    }
  } catch (e) {
    recording =
      e instanceof ZoomError
        ? `Zoom refused: ${e.message}`
        : "Couldn't ask Zoom about the recording.";
    transcript = "Not reached.";
  }

  let aiSummary: string;
  try {
    const s = await getMeetingSummary(m.uuid);
    aiSummary = s?.summary_overview
      ? "Zoom has its own AI summary for this call."
      : "No Zoom AI summary.";
  } catch (e) {
    aiSummary =
      e instanceof ZoomError
        ? `AI summary unavailable: ${e.message}`
        : "AI summary unavailable.";
  }

  const row = await db.meeting.findFirst({
    where: { zoomUuid: m.uuid },
    select: {
      summary: true,
      transcriptNote: true,
      transcriptReadAt: true,
      title: true,
    },
  });

  const onespace = !row
    ? "OneSpace has no meeting linked to this call."
    : row.summary
      ? "OneSpace has a write-up."
      : row.transcriptNote
        ? `OneSpace tried and recorded: ${row.transcriptNote}`
        : row.transcriptReadAt
          ? "OneSpace read it and kept nothing."
          : "OneSpace has the meeting but has never tried to read it.";

  return { ...base, recording, files, transcript, aiSummary, onespace };
}
