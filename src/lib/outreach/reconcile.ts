/**
 * What Kaia recorded, against what OneSpace wrote up.
 *
 * All week the answer to "why is there no summary" has been the same
 * sentence for every cause: no write-up. That covers a call nobody recorded,
 * a call Zoom refused to hand over, a call the model was never asked about,
 * and a call that worked. They need different fixes, and only one of them is
 * a bug.
 *
 * Kaia settles the first of those. It knows, independently of Zoom, which
 * calls actually had a bot in the room. Lining its list up against the
 * meetings OneSpace holds turns a vague complaint into a list with a reason
 * per row.
 *
 * Pure: rows in, verdicts out. The point of this is to be trusted, so it is
 * testable without a database or an API behind it.
 */

export type MeetingRow = {
  id: string;
  title: string;
  startsAt: Date;
  googleId: string | null;
  zoomUuid: string | null;
  summary: string | null;
  transcriptNote: string | null;
  transcriptReadAt: Date | null;
  ownerName: string | null;
};

export type RecordingRow = {
  id: string;
  title: string;
  startTime: Date;
  sourceId: string | null;
  seconds: number | null;
  hostName: string | null;
};

export type Verdict =
  /** There is a write-up. Nothing to do. */
  | "written-up"
  /** Read, and the model found nothing worth keeping. Not a fault. */
  | "read-empty"
  /** Read and refused, with a reason Zoom or the model gave. */
  | "read-failed"
  /** Matched a meeting, but nothing has tried to read it yet. */
  | "never-read"
  /** Kaia recorded a call OneSpace has no meeting for at all. */
  | "no-meeting";

export type Line = {
  title: string;
  when: Date;
  host: string | null;
  verdict: Verdict;
  detail: string;
  meetingId: string | null;
};

/** How far apart a recording and a meeting can start and still be the same call. */
const CLOCK_MS = 30 * 60_000;

/**
 * The join, in order of how much it can be trusted.
 *
 * The calendar event id is exact when Kaia carries one and OneSpace stored
 * the same event. Falling back to the clock is a guess, so it is only taken
 * when the titles are recognisably the same call.
 */
export function matchMeeting(
  rec: RecordingRow,
  meetings: MeetingRow[],
): MeetingRow | null {
  if (rec.sourceId) {
    const exact = meetings.find((m) => m.googleId === rec.sourceId);
    if (exact) return exact;
  }

  const near = meetings
    .filter(
      (m) =>
        Math.abs(m.startsAt.getTime() - rec.startTime.getTime()) <= CLOCK_MS &&
        sameish(m.title, rec.title),
    )
    .sort(
      (a, b) =>
        Math.abs(a.startsAt.getTime() - rec.startTime.getTime()) -
        Math.abs(b.startsAt.getTime() - rec.startTime.getTime()),
    );

  return near[0] ?? null;
}

/** Titles the same call would plausibly have on two systems. */
function sameish(a: string, b: string): boolean {
  const key = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const x = key(a);
  const y = key(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
}

export function reconcile(
  recordings: RecordingRow[],
  meetings: MeetingRow[],
): Line[] {
  return recordings.map((rec) => {
    const meeting = matchMeeting(rec, meetings);
    const base = {
      title: rec.title,
      when: rec.startTime,
      host: rec.hostName,
      meetingId: meeting?.id ?? null,
    };

    if (!meeting) {
      return {
        ...base,
        verdict: "no-meeting" as const,
        detail:
          "Kaia recorded this but OneSpace has no meeting for it — it was never on a synced calendar, or the sync hasn't reached it.",
      };
    }

    if (meeting.summary) {
      return { ...base, verdict: "written-up" as const, detail: "Has a write-up." };
    }

    if (meeting.transcriptNote) {
      return {
        ...base,
        verdict: "read-failed" as const,
        detail: meeting.transcriptNote,
      };
    }

    if (meeting.transcriptReadAt) {
      return {
        ...base,
        verdict: "read-empty" as const,
        detail:
          "Read, but nothing was written. Usually a call with no real content — worth opening if that seems wrong.",
      };
    }

    return {
      ...base,
      verdict: "never-read" as const,
      detail: meeting.zoomUuid
        ? "Matched to a Zoom call, but nothing has tried to read it yet."
        : "No Zoom recording is linked to this meeting, so there's nothing to read. Kaia recorded it, so the call happened — this is the gap worth chasing.",
    };
  });
}

/** How many of each, for a line somebody can act on without reading the table. */
export function tally(lines: Line[]): Record<Verdict, number> {
  const out: Record<Verdict, number> = {
    "written-up": 0,
    "read-empty": 0,
    "read-failed": 0,
    "never-read": 0,
    "no-meeting": 0,
  };
  for (const line of lines) out[line.verdict]++;
  return out;
}
