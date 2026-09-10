import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { dayStart } from "@/lib/dates";
import { listMeetings } from "@/lib/google/calendar";
import { GoogleApiError, GoogleAuthError, googleConfigured } from "@/lib/google/auth";
import {
  buildWeights,
  matchMeeting,
  type MatchCandidate,
} from "@/lib/google/match";

/** Where the timesheet day comes from when converting a meeting's clock time. */
export const ORG_TIMEZONE_KEY = "org.timezone";
export const DEFAULT_TIMEZONE = "America/Chicago";

/** How far back the first sync reaches. Brianna chose 1 August. */
export const SYNC_FROM_KEY = "google.calendarFrom";
export const DEFAULT_SYNC_FROM = "2026-08-01";

export async function orgTimezone(): Promise<string> {
  const row = await db.appSetting.findUnique({ where: { key: ORG_TIMEZONE_KEY } });
  return row?.value || DEFAULT_TIMEZONE;
}

export async function calendarSyncFrom(): Promise<Date> {
  const row = await db.appSetting.findUnique({ where: { key: SYNC_FROM_KEY } });
  return dayStart(row?.value || DEFAULT_SYNC_FROM);
}

export interface SyncOutcome {
  /** Meetings seen on a calendar, after filtering out non-meetings. */
  seen: number;
  created: number;
  updated: number;
  /** Already accepted or dismissed, so left exactly as they are. */
  settled: number;
  matched: number;
  /** Not stored: nobody in the room was on a domain mapped to a client. */
  skipped: number;
  /**
   * The outside domains those skipped meetings were with, most frequent
   * first. This is the discovery path now that unrecognised meetings aren't
   * kept - it says what you'd gain by mapping one more domain.
   */
  unrecognised: { domain: string; meetings: number }[];
  people: number;
  failed: { name: string; error: string }[];
}

/**
 * Everything the matcher needs about the current project list, fetched once
 * and reused for every meeting on every calendar.
 */
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
      tasks: {
        where: { status: { not: "DONE" } },
        select: { id: true, name: true },
      },
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
 * Pull everyone's calendar and turn client meetings into pending suggestions.
 *
 * Deliberately never writes a time entry. A suggestion becomes time when the
 * person whose calendar it came from says so, which is both what Brianna
 * asked for and the only version that survives a mis-match: a wrong guess
 * costs a click, not a corrected invoice.
 */
export async function syncCalendars(options?: {
  /** Limit to one person, for the "sync me" button. */
  userId?: string;
  from?: Date;
  to?: Date;
}): Promise<SyncOutcome> {
  const outcome: SyncOutcome = {
    seen: 0,
    created: 0,
    updated: 0,
    settled: 0,
    matched: 0,
    skipped: 0,
    unrecognised: [],
    people: 0,
    failed: [],
  };

  if (!googleConfigured()) {
    throw new Error("Google isn't connected yet - add the service account credentials in Railway.");
  }

  const people = await db.user.findMany({
    where: { isActive: true, ...(options?.userId ? { id: options.userId } : {}) },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  if (people.length === 0) return outcome;

  // "External" means outside every domain we sign in with, so nobody has to
  // configure their own company's domain anywhere.
  const ourDomains = new Set(
    people
      .map((p) => p.email.split("@")[1]?.toLowerCase())
      .filter((d): d is string => Boolean(d)),
  );
  const allUsers = await db.user.findMany({ select: { email: true } });
  for (const u of allUsers) {
    const d = u.email.split("@")[1]?.toLowerCase();
    if (d) ourDomains.add(d);
  }

  const candidates = await loadCandidates();
  const weights = buildWeights(candidates);
  // Domains that belong to a partner rather than a customer, so a partner
  // sitting in on a client call doesn't read as a second client.
  const partnerDomains = new Map(
    (
      await db.partnerDomain.findMany({
        select: { domain: true, partner: { select: { name: true } } },
      })
    ).map((d) => [d.domain, d.partner.name]),
  );

  // Every domain that identifies a customer. A meeting with none of these in
  // the room is not stored at all: Brianna's calendar carries roughly twice as
  // many internal, prospect and networking meetings as client ones, and a
  // suggestion list where most rows are noise is a list nobody reads.
  //
  // Read from the domain table rather than from the candidate projects. A
  // client whose only project has finished - or hasn't been created yet -
  // still has domains, and their meetings are still real client time. Taking
  // this from the live project list instead would silently drop them, which
  // is a hard thing to notice and a worse thing to discover a month later.
  const clientByDomain = new Map(
    (
      await db.clientDomain.findMany({
        select: { domain: true, client: { select: { name: true } } },
      })
    ).map((d) => [d.domain, d.client.name]),
  );

  // Domains not worth mentioning in the "you could map this" hint - already
  // decided against, or a partner, or a mail provider.
  const quiet = new Set([
    ...(await db.ignoredDomain.findMany({ select: { domain: true } })).map((d) => d.domain),
    ...partnerDomains.keys(),
    "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "yahoo.com",
    "icloud.com", "me.com", "aol.com", "calendly.com", "zoom.us",
    "chorus.ai", "gong.io", "fathom.video", "apollo.io",
  ]);
  const unrecognised = new Map<string, number>();

  const from = options?.from ?? (await calendarSyncFrom());
  // A fortnight ahead: scheduled client calls are worth seeing before they
  // happen, and they can't be accepted into a timesheet until they have.
  const to = options?.to ?? new Date(Date.now() + 14 * 86_400_000);

  for (const person of people) {
    let meetings;
    try {
      meetings = await listMeetings(person.email, from, to);
    } catch (e) {
      outcome.failed.push({ name: person.name, error: describe(e) });
      continue;
    }

    outcome.people += 1;

    for (const m of meetings) {
      outcome.seen += 1;

      const externalDomains = [
        ...new Set(
          m.attendees
            .map((a) => a.email.split("@")[1]?.toLowerCase())
            .filter((d): d is string => Boolean(d) && !ourDomains.has(d)),
        ),
      ];

      // The rule: no client in the room, no suggestion. Anything already
      // stored for it is cleared out, so mapping a domain later and
      // re-syncing brings its meetings straight back - nothing here is a
      // decision you're stuck with.
      if (!externalDomains.some((d) => clientByDomain.has(d))) {
        await db.meeting.deleteMany({
          where: { userId: person.id, googleId: m.googleId, status: "PENDING" },
        });
        outcome.skipped += 1;
        for (const d of externalDomains) {
          if (!quiet.has(d)) unrecognised.set(d, (unrecognised.get(d) ?? 0) + 1);
        }
        continue;
      }

      const match = matchMeeting(
        {
          title: m.title,
          externalDomains,
          organizerEmail: m.organizerEmail,
          userId: person.id,
        },
        candidates,
        weights,
        partnerDomains,
      );
      // A client we recognise but can't place: their project is finished, or
      // was never created. Saying which client it is turns a dead end into
      // one obvious next step.
      let reason = match.reason;
      if (!match.projectId) {
        const named = [
          ...new Set(
            externalDomains
              .map((d) => clientByDomain.get(d))
              .filter((n): n is string => Boolean(n)),
          ),
        ];
        if (named.length > 0) {
          reason = `${named.join(" and ")} were in the invite, but there's no open project for them - create one, or pick where this should go.`;
        }
      }

      if (match.projectId) outcome.matched += 1;

      const existing = await db.meeting.findUnique({
        where: { userId_googleId: { userId: person.id, googleId: m.googleId } },
      });

      // Once someone has ruled on a meeting, the sync stops having opinions
      // about it. Re-suggesting something already dismissed - or re-pointing
      // an accepted one at a different project - is how a sync becomes
      // something people turn off.
      if (existing && existing.status !== "PENDING") {
        outcome.settled += 1;
        continue;
      }

      const data = {
        title: m.title,
        description: m.description,
        startsAt: m.startsAt,
        endsAt: m.endsAt,
        minutes: m.minutes,
        organizerEmail: m.organizerEmail,
        isOrganizer: m.isOrganizer,
        // Prisma's Json input type won't take a typed interface array
        // directly; the shape is GoogleAttendee[] and read back as such.
        attendees: m.attendees as unknown as Prisma.InputJsonValue,
        externalDomains,
        suggestedClientId: match.clientId,
        suggestedProjectId: match.projectId,
        projectId: match.projectId,
        taskId: match.taskId,
        matchReason: reason,
        confidence: match.confidence,
        syncedAt: new Date(),
      };

      if (existing) {
        await db.meeting.update({ where: { id: existing.id }, data });
        outcome.updated += 1;
      } else {
        await db.meeting.create({
          data: { userId: person.id, googleId: m.googleId, ...data },
        });
        outcome.created += 1;
      }
    }
  }

  outcome.unrecognised = [...unrecognised]
    .map(([domain, meetings]) => ({ domain, meetings }))
    .sort((a, b) => b.meetings - a.meetings || a.domain.localeCompare(b.domain))
    .slice(0, 12);

  return outcome;
}

function describe(e: unknown): string {
  if (e instanceof GoogleAuthError) return e.message;
  if (e instanceof GoogleApiError) {
    if (e.status === 403) {
      return `${e.message} (the calendar scope may be missing from the delegation grant)`;
    }
    if (e.status === 404) return "No primary calendar for that address.";
    return e.message;
  }
  return e instanceof Error ? e.message : String(e);
}
