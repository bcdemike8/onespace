import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { dayInZone, dayStart } from "@/lib/dates";
import {
  getMeetingSummary,
  getRecording,
  listPastMeetings,
  listZoomUsers,
  zoomConfigured,
  zoomDownload,
  ZoomError,
  type ZoomPastMeeting,
} from "@/lib/zoom/client";
import {
  extractCommitments,
  fromNextSteps,
  parseVtt,
  type Commitment,
} from "@/lib/zoom/commitments";
import { dueFor } from "@/lib/when";
import { buildWeights, matchMeeting, type MatchCandidate } from "@/lib/google/match";
import { orgTimezone } from "@/lib/google/sync";

export const ZOOM_FROM_KEY = "zoom.from";
export const DEFAULT_ZOOM_FROM = "2026-08-01";

export async function zoomSyncFrom(): Promise<Date> {
  const row = await db.appSetting.findUnique({ where: { key: ZOOM_FROM_KEY } });
  return dayStart(row?.value || DEFAULT_ZOOM_FROM);
}

export interface ZoomOutcome {
  people: number;
  /** Zoom calls seen in the window. */
  seen: number;
  /** Existing calendar meetings given their real duration. */
  timed: number;
  /** Zoom calls that were never on a calendar and are now suggestions. */
  created: number;
  /** Calls skipped: no client in the room. */
  skipped: number;
  /** Transcripts read for commitments. */
  transcripts: number;
  commitments: number;
  failed: { name: string; error: string }[];
}

/** The same candidate list the calendar matcher uses. */
async function loadCandidates(): Promise<MatchCandidate[]> {
  const projects = await db.project.findMany({
    where: { status: { in: ["ACTIVE", "ON_HOLD"] } },
    select: {
      id: true,
      name: true,
      ownerId: true,
      client: {
        select: { id: true, name: true, domains: { select: { domain: true } } },
      },
      tasks: { where: { status: { not: "DONE" } }, select: { id: true, name: true } },
    },
  });
  return projects.map((p) => ({
    projectId: p.id,
    projectName: p.name,
    clientId: p.client?.id ?? null,
    clientName: p.client?.name ?? null,
    domains: p.client?.domains.map((d) => d.domain) ?? [],
    tasks: p.tasks,
    ownerId: p.ownerId,
  }));
}

/**
 * Pull what Zoom knows and fold it into the meetings OneSpace already has.
 *
 * Three jobs, in order of how much they're worth:
 *
 *   1. Real durations. A 60-minute booking that ran 43 minutes is 43 minutes
 *      of billable time. The calendar cannot know this and has been wrong
 *      about every short call since the day it was switched on.
 *   2. Commitments. The transcript is read once, the promises RevOptics people
 *      made are lifted out, and the transcript is not kept.
 *   3. Calls that never touched a calendar - instant meetings, dials into a
 *      personal room - which the calendar sync can't see at all.
 */
export async function syncZoom(options?: {
  userId?: string;
  from?: Date;
  to?: Date;
}): Promise<ZoomOutcome> {
  const outcome: ZoomOutcome = {
    people: 0,
    seen: 0,
    timed: 0,
    created: 0,
    skipped: 0,
    transcripts: 0,
    commitments: 0,
    failed: [],
  };

  if (!zoomConfigured()) {
    throw new Error("Zoom isn't connected yet - add the Server-to-Server OAuth credentials in Railway.");
  }

  // Which day a promise was made on depends on the zone the call was in.
  const zone = await orgTimezone();

  const people = await db.user.findMany({
    where: { isActive: true, ...(options?.userId ? { id: options.userId } : {}) },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  if (people.length === 0) return outcome;

  const allUsers = await db.user.findMany({ select: { name: true, email: true } });
  const ourDomains = new Set(
    allUsers.map((u) => u.email.split("@")[1]?.toLowerCase()).filter(Boolean) as string[],
  );
  // Transcript speaker names are Zoom display names, which rarely match a
  // OneSpace record exactly. Matching on the full name and on first-plus-last
  // catches "Brianna Dunbar-DeMike" and "Brianna DeMike" alike; anyone not
  // recognised is treated as the other side, which is the safe way round.
  const ourNames = new Set<string>();
  for (const u of allUsers) {
    const n = u.name.toLowerCase().trim();
    ourNames.add(n);
    const parts = n.split(/\s+/);
    if (parts.length > 1) ourNames.add(`${parts[0]} ${parts[parts.length - 1]}`);
  }
  const isOurs = (speaker: string | null) => {
    if (!speaker) return false;
    const s = speaker.toLowerCase().trim().replace(/\s*\(.*\)$/, "");
    if (ourNames.has(s)) return true;
    const parts = s.split(/\s+/);
    return parts.length > 1 && ourNames.has(`${parts[0]} ${parts[parts.length - 1]}`);
  };

  const clientByDomain = new Map(
    (
      await db.clientDomain.findMany({
        select: { domain: true, client: { select: { name: true } } },
      })
    ).map((d) => [d.domain, d.client.name]),
  );

  const partnerDomains = new Map(
    (
      await db.partnerDomain.findMany({
        select: { domain: true, partner: { select: { name: true } } },
      })
    ).map((d) => [d.domain, d.partner.name]),
  );

  const candidates = await loadCandidates();
  const weights = buildWeights(candidates);

  const from = options?.from ?? (await zoomSyncFrom());
  const to = options?.to ?? new Date();

  let zoomUsers;
  try {
    zoomUsers = await listZoomUsers();
  } catch (e) {
    throw new Error(e instanceof ZoomError ? e.message : "Couldn't list Zoom users.");
  }
  const zoomIdByEmail = new Map(zoomUsers.map((u) => [u.email, u.id]));

  for (const person of people) {
    const zoomUserId = zoomIdByEmail.get(person.email.toLowerCase());
    if (!zoomUserId) continue; // Not a Zoom user; nothing to read.

    let meetings: ZoomPastMeeting[];
    try {
      meetings = await listPastMeetings(zoomUserId, from, to);
    } catch (e) {
      outcome.failed.push({
        name: person.name,
        error: e instanceof ZoomError ? e.message : "Couldn't read their Zoom meetings.",
      });
      continue;
    }
    outcome.people += 1;

    for (const zm of meetings) {
      outcome.seen += 1;
      const startsAt = new Date(zm.start_time);
      if (Number.isNaN(startsAt.getTime())) continue;

      // Find the calendar meeting this call belongs to. The Zoom id lifted
      // from the invite is exact; failing that, the same person's meeting
      // starting within twenty minutes is the same call in practice.
      let row = await db.meeting.findFirst({
        where: {
          userId: person.id,
          OR: [
            { zoomUuid: zm.uuid },
            { zoomMeetingId: String(zm.id) },
            {
              zoomMeetingId: null,
              startsAt: {
                gte: new Date(startsAt.getTime() - 20 * 60_000),
                lte: new Date(startsAt.getTime() + 20 * 60_000),
              },
            },
          ],
        },
        orderBy: { startsAt: "asc" },
      });

      if (row) {
        // Never touch a meeting somebody has already ruled on, beyond
        // recording what Zoom knows about it.
        await db.meeting.update({
          where: { id: row.id },
          data: {
            zoomUuid: zm.uuid,
            zoomMeetingId: String(zm.id),
            actualMinutes: zm.duration,
          },
        });
        outcome.timed += 1;
      } else {
        // A call with no calendar event. Same rule as everywhere else: it
        // only becomes a suggestion if a client was in the room, which means
        // asking Zoom who was actually on it.
        const emails = await participantEmails(zm.uuid);
        const externalDomains = [
          ...new Set(
            emails
              .map((e) => e.split("@")[1]?.toLowerCase())
              .filter((d): d is string => Boolean(d) && !ourDomains.has(d)),
          ),
        ];
        if (!externalDomains.some((d) => clientByDomain.has(d))) {
          outcome.skipped += 1;
          continue;
        }

        const match = matchMeeting(
          {
            title: zm.topic,
            externalDomains,
            organizerEmail: zm.host_email?.toLowerCase() ?? null,
            userId: person.id,
          },
          candidates,
          weights,
          partnerDomains,
        );

        row = await db.meeting.create({
          data: {
            userId: person.id,
            source: "ZOOM",
            zoomUuid: zm.uuid,
            zoomMeetingId: String(zm.id),
            title: zm.topic || "(Zoom meeting)",
            startsAt,
            endsAt: new Date(startsAt.getTime() + zm.duration * 60_000),
            minutes: zm.duration,
            actualMinutes: zm.duration,
            organizerEmail: zm.host_email?.toLowerCase() ?? null,
            isOrganizer: zm.host_email?.toLowerCase() === person.email.toLowerCase(),
            attendees: emails.map((email) => ({
              email,
              name: null,
              responseStatus: null,
              self: false,
            })) as unknown as Prisma.InputJsonValue,
            externalDomains,
            suggestedClientId: match.clientId,
            suggestedProjectId: match.projectId,
            projectId: match.projectId,
            taskId: match.taskId,
            matchReason: `${match.reason} Not on anyone's calendar - Zoom only.`,
            confidence: match.confidence,
          },
        });
        outcome.created += 1;
      }

      // The recording, and the promises inside it. Read once per meeting: a
      // transcript doesn't change, and re-reading would raise every
      // commitment again after someone had dismissed it.
      if (!row.transcriptReadAt) {
        const found = await readCommitments(zm.uuid, isOurs);
        if (found) {
          await db.$transaction(async (tx) => {
            await tx.meeting.update({
              where: { id: row!.id },
              data: {
                recordingUrl: found.recordingUrl ?? undefined,
                transcriptReadAt: new Date(),
              },
            });
            if (found.commitments.length > 0) {
              // "by Friday" is read against the day of the call, not against
              // today: a promise made last Tuesday means that Friday, and
              // reading it now would push the deadline out every sync.
              const said = dayInZone(row!.startsAt, zone);
              await tx.commitment.createMany({
                data: found.commitments.map((c) => {
                  const due = dueFor(c.text, said);
                  return {
                    meetingId: row!.id,
                    source: found.fromSummary
                      ? ("ZOOM_SUMMARY" as const)
                      : ("TRANSCRIPT" as const),
                    text: c.text,
                    speaker: c.speaker,
                    atSeconds: c.atSeconds,
                    suggestedTask: c.suggestedTask,
                    dueDate: due.date,
                    dueStated: due.stated,
                    fromSummary: found.fromSummary,
                  };
                }),
              });
            }
          });
          outcome.transcripts += 1;
          outcome.commitments += found.commitments.length;
        }
      }
    }
  }

  return outcome;
}

/** Who was actually on the call, by email. */
async function participantEmails(uuid: string): Promise<string[]> {
  const encoded =
    uuid.startsWith("/") || uuid.includes("//")
      ? encodeURIComponent(encodeURIComponent(uuid))
      : encodeURIComponent(uuid);

  try {
    const { zoomRequest } = await import("@/lib/zoom/client");
    const data = await zoomRequest<{
      participants?: { user_email?: string }[];
    }>(`/report/meetings/${encoded}/participants`, { page_size: 300 });

    return [
      ...new Set(
        (data.participants ?? [])
          .map((p) => p.user_email?.toLowerCase())
          .filter((e): e is string => Boolean(e)),
      ),
    ];
  } catch {
    // No participant report is common on smaller plans. Without it there's no
    // way to know whose call it was, so it stays out.
    return [];
  }
}

interface Read {
  recordingUrl: string | null;
  commitments: Commitment[];
  fromSummary: boolean;
}

/**
 * Zoom's own next steps if the plan produced them, otherwise the transcript.
 *
 * The summary is preferred where it exists: Zoom had the audio and the speaker
 * labels, and its next steps are already phrased as actions.
 */
async function readCommitments(
  uuid: string,
  isOurs: (speaker: string | null) => boolean,
): Promise<Read | null> {
  let recordingUrl: string | null = null;
  let transcriptUrl: string | null = null;

  try {
    const rec = await getRecording(uuid);
    if (rec) {
      recordingUrl = rec.share_url ?? null;
      const transcript = rec.recording_files?.find(
        (f) => f.recording_type === "audio_transcript" || f.file_type === "TRANSCRIPT",
      );
      transcriptUrl = transcript?.download_url ?? null;
    }
  } catch {
    return null;
  }

  try {
    const summary = await getMeetingSummary(uuid);
    if (summary?.next_steps && summary.next_steps.length > 0) {
      return {
        recordingUrl,
        commitments: fromNextSteps(summary.next_steps),
        fromSummary: true,
      };
    }
  } catch {
    // AI Companion isn't on this plan, or not on this call. The transcript
    // path below is the fallback, not an error.
  }

  if (!transcriptUrl) {
    // Nothing to read, but the recording link is still worth keeping.
    return recordingUrl ? { recordingUrl, commitments: [], fromSummary: false } : null;
  }

  const vtt = await zoomDownload(transcriptUrl);
  if (!vtt) return { recordingUrl, commitments: [], fromSummary: false };

  return {
    recordingUrl,
    commitments: extractCommitments(parseVtt(vtt), isOurs),
    fromSummary: false,
  };
}
