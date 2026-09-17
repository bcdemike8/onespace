import "server-only";
import { db } from "@/lib/db";
import { googleConfigured } from "@/lib/google/auth";
import { asMeeting, listRawEvents, notAMeeting } from "@/lib/google/calendar";
import { matchContext, externalDomainsIn } from "@/lib/google/sync";
import { matchMeeting } from "@/lib/google/match";

/**
 * "Where is my Thursday call?"
 *
 * Reads one person's calendar for one day and says, for every entry on it,
 * what the sync did and why. Including the entries the sync threw away —
 * which is the whole point, because the missing meeting is by definition not
 * in the list of meetings that are there.
 *
 * It runs the sync's own context and the sync's own rules rather than a
 * description of them. An explanation built from a second copy of the logic
 * is worse than no explanation: it is confident, and it is wrong in exactly
 * the cases somebody is looking into.
 */

export type Verdict =
  /** Stored, and pointed at a project. */
  | { kind: "matched"; detail: string }
  /** Stored, but nobody could say which project. */
  | { kind: "unplaced"; detail: string }
  /** Not stored: no client in the room. */
  | { kind: "no-client"; detail: string; domains: string[] }
  /** Not stored: not a meeting at all. */
  | { kind: "not-a-meeting"; detail: string }
  /** Stored earlier and already decided on, so left alone. */
  | { kind: "settled"; detail: string };

export interface ExplainedEvent {
  title: string;
  startsAt: Date | null;
  minutes: number | null;
  guests: string[];
  externalDomains: string[];
  verdict: Verdict;
  /** The stored meeting, where there is one, so the page can link to it. */
  meetingId: string | null;
}

export interface Explanation {
  personName: string;
  personEmail: string;
  events: ExplainedEvent[];
  /** Set when the calendar couldn't be read at all — the real answer then. */
  error: string | null;
}

export async function explainDay(
  userId: string,
  day: Date,
): Promise<Explanation> {
  const person = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!person) {
    return { personName: "", personEmail: "", events: [], error: "No such person." };
  }

  const base = { personName: person.name, personEmail: person.email };

  if (!googleConfigured()) {
    return {
      ...base,
      events: [],
      error: "Google isn't connected on this service, so no calendar can be read.",
    };
  }

  const from = new Date(day);
  const to = new Date(day.getTime() + 86_400_000);

  let raw;
  try {
    raw = await listRawEvents(person.email, from, to);
  } catch (e) {
    return {
      ...base,
      events: [],
      error: e instanceof Error ? e.message : "Couldn't read that calendar.",
    };
  }

  const ctx = await matchContext();

  // What is already stored for this person that day, so a settled decision
  // can be reported as a decision rather than as a mystery.
  const stored = await db.meeting.findMany({
    where: { userId: person.id, startsAt: { gte: from, lt: to } },
    select: { id: true, googleId: true, status: true, project: { select: { name: true } } },
  });
  const storedByGoogleId = new Map(stored.map((m) => [m.googleId, m]));

  const events: ExplainedEvent[] = [];

  for (const event of raw) {
    const title = event.summary?.trim() || "(no title)";
    const why = notAMeeting(event);

    if (why !== null) {
      events.push({
        title,
        startsAt: event.start?.dateTime ? new Date(event.start.dateTime) : null,
        minutes: null,
        guests: (event.attendees ?? []).map((a) => a.email ?? "").filter(Boolean),
        externalDomains: [],
        verdict: { kind: "not-a-meeting", detail: why },
        meetingId: null,
      });
      continue;
    }

    const m = asMeeting(event)!;
    const externalDomains = externalDomainsIn(m.attendees, ctx.ourDomains);
    const guests = m.attendees.map((a) => a.email);
    const existing = storedByGoogleId.get(m.googleId);

    const common = {
      title: m.title,
      startsAt: m.startsAt,
      minutes: m.minutes,
      guests,
      externalDomains,
      meetingId: existing?.id ?? null,
    };

    const clientNames = [
      ...new Set(
        externalDomains
          .map((d) => ctx.clientByDomain.get(d))
          .filter((n): n is string => Boolean(n)),
      ),
    ];

    if (clientNames.length === 0) {
      const archived = externalDomains
        .map((d) => ctx.archivedByDomain.get(d))
        .find((c) => c);

      events.push({
        ...common,
        verdict: {
          kind: "no-client",
          domains: externalDomains,
          detail: archived
            ? `${archived.name} is archived, so ${externalDomains.join(", ")} stops matching. Bring them back on the Clients page.`
            : externalDomains.length === 0
              ? "Nobody outside RevOptics was invited, so there is no client to bill it to."
              : `No client has ${externalDomains.join(" or ")} as an email domain, so this isn't kept.`,
        },
      });
      continue;
    }

    if (existing && existing.status !== "PENDING") {
      events.push({
        ...common,
        verdict: {
          kind: "settled",
          detail:
            existing.status === "ACCEPTED"
              ? `Already logged${existing.project ? ` to ${existing.project.name}` : ""}, so the sync leaves it alone.`
              : "Set aside as not billable, so the sync leaves it alone. It's under Not billable on this page.",
        },
      });
      continue;
    }

    const match = matchMeeting(
      {
        title: m.title,
        externalDomains,
        organizerEmail: m.organizerEmail,
        userId: person.id,
      },
      ctx.candidates,
      ctx.weights,
      ctx.partnerDomains,
    );

    events.push({
      ...common,
      verdict: match.projectId
        ? { kind: "matched", detail: match.reason }
        : {
            kind: "unplaced",
            detail: `${clientNames.join(" and ")} were in the invite, but there's no open project for them. It is in your list, waiting for you to pick one.`,
          },
    });
  }

  events.sort(
    (a, b) => (a.startsAt?.getTime() ?? 0) - (b.startsAt?.getTime() ?? 0),
  );

  return { ...base, events, error: null };
}
