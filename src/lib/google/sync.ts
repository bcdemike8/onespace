import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  DEFAULT_SYNC_FROM,
  WINDOW_KEYS,
  labelOf,
  parseWindow,
  sinceOf,
} from "@/lib/window";
import { asMeeting, listRawEvents, notAMeeting } from "@/lib/google/calendar";
import { externalDomainsIn, internalDomains } from "@/lib/google/rules";
import { GoogleApiError, GoogleAuthError, googleConfigured } from "@/lib/google/auth";
import {
  buildWeights,
  matchMeeting,
  type MatchCandidate,
} from "@/lib/google/match";

/** Where the timesheet day comes from when converting a meeting's clock time. */
export const ORG_TIMEZONE_KEY = "org.timezone";
export const DEFAULT_TIMEZONE = "America/Chicago";

/** How far back the calendar is read. Brianna chose 31 August 2026. */
export const SYNC_FROM_KEY = WINDOW_KEYS.calendar;
export const DEFAULT_CALENDAR_FROM = DEFAULT_SYNC_FROM;

export async function orgTimezone(): Promise<string> {
  const row = await db.appSetting.findUnique({ where: { key: ORG_TIMEZONE_KEY } });
  return row?.value || DEFAULT_TIMEZONE;
}

async function calendarWindow() {
  const row = await db.appSetting.findUnique({ where: { key: SYNC_FROM_KEY } });
  return parseWindow(row?.value, DEFAULT_CALENDAR_FROM);
}

/** A date, or a number of days. See lib/window. */
export async function calendarSyncFrom(): Promise<Date> {
  return sinceOf(await calendarWindow());
}

/** The same window in words, for saying so on a screen. */
export async function calendarWindowLabel(): Promise<string> {
  return labelOf(await calendarWindow());
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
   * How many client domains exist at all. Zero means nothing can ever match,
   * which is a completely different problem from "these particular meetings
   * were with strangers" and needs saying differently.
   */
  mappedDomains: number;
  /**
   * The outside domains those skipped meetings were with, most frequent
   * first. This is the discovery path now that unrecognised meetings aren't
   * kept - it says what you'd gain by mapping one more domain.
   */
  unrecognised: {
    domain: string;
    meetings: number;
    example: string | null;
    people: string[];
    /** Set when the domain belongs to an archived client - a different fix. */
    archivedClientId: string | null;
    archivedClientName: string | null;
  }[];
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
 * Everything the "is this a client meeting" decision needs.
 *
 * Lifted out of the sync so the screen that explains a decision runs the
 * same code that made it. An explanation assembled from a second copy of
 * these rules is worse than none: it is confidently wrong, and it stays
 * wrong until somebody spends an afternoon proving it.
 */
export async function matchContext() {
  // "External" means outside every domain we sign in with, so nobody has to
  // configure their own company's domain anywhere. Every user, not just the
  // ones being synced right now: whose calendar is being read must not change
  // who counts as a colleague.
  const userEmails = (await db.user.findMany({ select: { email: true } })).map(
    (u) => u.email,
  );

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
        // Archived clients are finished. Their domains stay on record, so
        // nothing already logged loses its client and un-archiving brings
        // them straight back, but no new meeting is suggested for them.
        where: { client: { archivedAt: null } },
        select: { domain: true, client: { select: { name: true } } },
      })
    ).map((d) => [d.domain, d.client.name]),
  );

  // Domains that ARE attached to a client, but an archived one. Archiving
  // deliberately stops a client's meetings being suggested — and looks
  // exactly like never having mapped them, right up until you try to map
  // them and are told the domain is already taken.
  const archivedByDomain = new Map(
    (
      await db.clientDomain.findMany({
        where: { client: { archivedAt: { not: null } } },
        select: { domain: true, client: { select: { id: true, name: true } } },
      })
    ).map((d) => [d.domain, d.client]),
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
  /**
   * What we passed over, by domain.
   *
   * More than a count, because a count is not enough to act on: a real
   * meeting title makes a domain recognisable, and knowing whose calendar it
   * was on separates "a client the team works with" from "somebody's
   * recruiter".
   */
  /**
   * A client's own domain can never be one of ours.
   *
   * ourDomains is built from every User row, and the Salesforce import
   * creates a User for anybody it finds owning a record. The moment one of
   * those carries a client's email address, that whole domain counts as
   * internal — so a call with only that client in the room has no external
   * guests at all, is skipped, and is filed under no domain because there is
   * no external domain to file it under. It disappears without trace, which
   * is exactly what happened to Marcus's Epiq and Sikich calls.
   *
   * The client mapping is the deliberate statement and wins.
   */
  const mappedToAClient = [...clientByDomain.keys(), ...archivedByDomain.keys()];
  const ourDomains = internalDomains(userEmails, mappedToAClient);

  /** Both a colleague's domain and a client's — a stray row, worth naming. */
  const alsoAClient = mappedToAClient.filter((d) =>
    userEmails.some((e) => e.split("@")[1]?.toLowerCase() === d),
  );

  return {
    ourDomains,
    candidates,
    weights,
    partnerDomains,
    clientByDomain,
    archivedByDomain,
    quiet,
    /** Domains that were both — worth saying, because it means a stray user row. */
    alsoAClient,
  };
}

export type MatchContext = Awaited<ReturnType<typeof matchContext>>;

export { externalDomainsIn } from "@/lib/google/rules";

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
    mappedDomains: 0,
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

  const ctx = await matchContext();
  const {
    ourDomains,
    candidates,
    weights,
    partnerDomains,
    clientByDomain,
    archivedByDomain,
    quiet,
  } = ctx;

  outcome.mappedDomains = clientByDomain.size;

  const unrecognised = new Map<
    string,
    {
      meetings: number;
      example: string | null;
      people: Set<string>;
      archived: { id: string; name: string } | null;
    }
  >();

  const from = options?.from ?? (await calendarSyncFrom());
  // A fortnight ahead: scheduled client calls are worth seeing before they
  // happen, and they can't be accepted into a timesheet until they have.
  const to = options?.to ?? new Date(Date.now() + 14 * 86_400_000);

  const skipped: {
    userId: string;
    googleId: string;
    title: string;
    startsAt: Date;
    code: string;
    reason: string;
    guests: string[];
    externalDomains: string[];
  }[] = [];

  for (const person of people) {
    let raw;
    try {
      raw = await listRawEvents(person.email, from, to);
    } catch (e) {
      outcome.failed.push({ name: person.name, error: describe(e) });
      continue;
    }

    outcome.people += 1;

    // This person's record describes the run that just happened.
    await db.skippedMeeting.deleteMany({ where: { userId: person.id } });

    for (const event of raw) {
      // Entries that are not meetings at all - declined, all-day, out of
      // office. Recorded too: "you declined it" is a complete answer, and
      // until now it was one nothing could give.
      const why = notAMeeting(event);
      if (why !== null) {
        if (event.id && event.start?.dateTime) {
          skipped.push({
            userId: person.id,
            googleId: event.id,
            title: event.summary?.trim() || "(no title)",
            startsAt: new Date(event.start.dateTime),
            code: "not-a-meeting",
            reason: why,
            guests: (event.attendees ?? []).map((a) => a.email ?? "").filter(Boolean),
            externalDomains: [],
          });
        }
        continue;
      }

      const m = asMeeting(event)!;
      outcome.seen += 1;

      const externalDomains = externalDomainsIn(m.attendees, ourDomains);

      // The rule: no client in the room, no suggestion. Anything already
      // stored for it is cleared out, so mapping a domain later and
      // re-syncing brings its meetings straight back - nothing here is a
      // decision you're stuck with.
      if (!externalDomains.some((d) => clientByDomain.has(d))) {
        await db.meeting.deleteMany({
          where: { userId: person.id, googleId: m.googleId, status: "PENDING" },
        });
        outcome.skipped += 1;

        // By name, always. The loop below files it under a domain, and a
        // meeting with no external guests has no domain to be filed under —
        // which is how one used to vanish leaving nothing behind at all.
        skipped.push({
          userId: person.id,
          googleId: m.googleId,
          title: m.title,
          startsAt: m.startsAt,
          code: externalDomains.length === 0 ? "all-internal" : "no-client",
          reason:
            externalDomains.length === 0
              ? "Nobody outside RevOptics was in the invite, so there is no client to bill it to."
              : `No client has ${externalDomains.join(" or ")} as an email domain.`,
          guests: m.attendees.map((a) => a.email),
          externalDomains,
        });

        for (const d of externalDomains) {
          if (quiet.has(d) && !archivedByDomain.has(d)) continue;
          const seen = unrecognised.get(d) ?? {
            meetings: 0,
            example: null,
            people: new Set<string>(),
            archived: archivedByDomain.get(d) ?? null,
          };
          seen.meetings += 1;
          // The first real title wins. "(no title)" is not a clue.
          if (!seen.example && m.title && m.title !== "(no title)") {
            seen.example = m.title;
          }
          seen.people.add(person.name);
          unrecognised.set(d, seen);
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
        zoomMeetingId: m.zoomMeetingId,
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

  const tally = [...unrecognised]
    .map(([domain, seen]) => ({
      domain,
      meetings: seen.meetings,
      example: seen.example,
      people: [...seen.people].sort(),
      archivedClientId: seen.archived?.id ?? null,
      archivedClientName: seen.archived?.name ?? null,
    }))
    .sort((a, b) => b.meetings - a.meetings || a.domain.localeCompare(b.domain));

  if (skipped.length > 0) {
    await db.skippedMeeting.createMany({ data: skipped, skipDuplicates: true });
  }

  await recordUnmapped(tally, {
    // A one-person sync only looked at one calendar, so it can add to the
    // list but must not decide that anything has gone away. Only a run over
    // everybody has seen enough to clear a row.
    replace: !options?.userId,
    from,
  });

  outcome.unrecognised = tally.slice(0, 12);

  return outcome;
}

/**
 * Write down what the sync passed over.
 *
 * Counts are the last full sync's view rather than a running total. The sync
 * re-reads the same window every night, so adding up would say a domain
 * appeared in four hundred meetings by Christmas - and the number people
 * actually want is "how many meetings would I get back if I mapped this".
 */
async function recordUnmapped(
  tally: {
    domain: string;
    meetings: number;
    example: string | null;
    people: string[];
    archivedClientId: string | null;
    archivedClientName: string | null;
  }[],
  options: { replace: boolean; from: Date },
) {
  const now = new Date();

  for (const row of tally) {
    await db.unmappedDomain.upsert({
      where: { domain: row.domain },
      create: {
        domain: row.domain,
        meetings: row.meetings,
        example: row.example,
        people: row.people,
        archivedClientId: row.archivedClientId,
        archivedClientName: row.archivedClientName,
        lastSeenAt: now,
      },
      update: {
        meetings: row.meetings,
        example: row.example,
        people: row.people,
        archivedClientId: row.archivedClientId,
        archivedClientName: row.archivedClientName,
        lastSeenAt: now,
      },
    });
  }

  if (!options.replace) return;

  // Gone from a run that read every calendar: the domain was mapped, or
  // ignored, or those meetings fell out of the window. Either way it is no
  // longer something to act on, and a list that only grows is a list nobody
  // reads.
  await db.unmappedDomain.deleteMany({
    where: { domain: { notIn: tally.map((t) => t.domain) } },
  });
}

/**
 * Stop listing a domain the moment it is dealt with.
 *
 * Called when a domain is attached to a client or ignored, so the panel
 * stops naming it straight away rather than until the next nightly run.
 */
export async function forgetUnmapped(domains: string[]): Promise<void> {
  if (domains.length === 0) return;
  await db.unmappedDomain.deleteMany({ where: { domain: { in: domains } } });
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
