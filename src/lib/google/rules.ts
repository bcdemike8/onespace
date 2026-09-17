/**
 * What counts as a meeting, and what a calendar entry actually says.
 *
 * Pure: no network, no database, no `server-only`. These are the rules that
 * decide whether an entry on somebody's calendar is work worth booking, and
 * they are the answer to "why isn't my Thursday call in OneSpace" — so they
 * are tested against real events rather than reasoned about.
 */

export interface GoogleAttendee {
  email: string;
  name: string | null;
  responseStatus: string | null;
  self: boolean;
}

export interface GoogleMeeting {
  googleId: string;
  /** Zoom's numeric meeting id, lifted out of the join link if there is one. */
  zoomMeetingId: string | null;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  minutes: number;
  organizerEmail: string | null;
  isOrganizer: boolean;
  attendees: GoogleAttendee[];
}

export interface RawEvent {
  id?: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  conferenceData?: { entryPoints?: { uri?: string }[] };
  eventType?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  organizer?: { email?: string; self?: boolean; displayName?: string };
  attendees?: {
    email?: string;
    displayName?: string;
    responseStatus?: string;
    self?: boolean;
    resource?: boolean;
    organizer?: boolean;
  }[];
}

/** Longer than this and it isn't a meeting - it's an all-day block or leave. */
const MAX_MINUTES = 12 * 60;

/** Rooms and equipment, which Google models as attendees. */
const isResource = (email: string) =>
  email.endsWith("resource.calendar.google.com") ||
  email.endsWith("group.calendar.google.com");

/**
 * The Zoom meeting id in an invite, if there is one.
 *
 * Zoom puts the join link in a different place depending on how the meeting
 * was created - the location field, the description, or a conference entry
 * point - so all three are checked. This is what later lets a Zoom recording
 * find the meeting it belongs to without guessing from timestamps.
 */
function zoomIdFrom(raw: RawEvent): string | null {
  const haystack = [
    raw.location ?? "",
    raw.description ?? "",
    ...(raw.conferenceData?.entryPoints ?? []).map((e) => e.uri ?? ""),
  ].join(" ");

  const m = haystack.match(/zoom\.us\/(?:j|w|s)\/(\d{9,12})/i);
  return m ? m[1] : null;
}

/**
 * Why this calendar entry is not a meeting, or null if it is one.
 *
 * The rules live here, once, and asMeeting is a thin wrapper over them. They
 * are also what the "why isn't this here" screen reports, so an explanation
 * can never drift from the behaviour it explains. The alternative is a second
 * copy of these rules that goes wrong in a way nobody notices for a month.
 */
export function notAMeeting(raw: RawEvent): string | null {
  if (!raw.id) return "Google gave this entry no id.";
  if (raw.status === "cancelled") return "Cancelled.";

  if (raw.eventType === "outOfOffice") {
    return "An out-of-office block, not a meeting.";
  }
  if (raw.eventType === "workingLocation") {
    return "A working-location entry, not a meeting.";
  }

  const startISO = raw.start?.dateTime;
  const endISO = raw.end?.dateTime;
  if (!startISO || !endISO) {
    return "An all-day entry - a holiday, launch or reminder rather than time spent.";
  }

  const startsAt = new Date(startISO);
  const endsAt = new Date(endISO);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return "Google gave this entry an unreadable start or end.";
  }

  const minutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);
  if (minutes <= 0) return "It ends before it starts.";
  if (minutes > MAX_MINUTES) {
    return `Longer than ${MAX_MINUTES / 60} hours, so it reads as a block rather than a meeting.`;
  }

  // Declining a meeting and then being asked to book time for it is the
  // fastest way to make people stop trusting the suggestions.
  const me = (raw.attendees ?? []).find((a) => a.self);
  if (me?.responseStatus === "declined") return "You declined it.";

  return null;
}

/** One raw entry as the shape the sync works with, or null if it isn't one. */
export function asMeeting(raw: RawEvent): GoogleMeeting | null {
  if (notAMeeting(raw) !== null) return null;

  const startsAt = new Date(raw.start!.dateTime!);
  const endsAt = new Date(raw.end!.dateTime!);

  const attendees: GoogleAttendee[] = (raw.attendees ?? [])
    .filter((a) => a.email && !a.resource && !isResource(a.email))
    .map((a) => ({
      email: a.email!.toLowerCase(),
      name: a.displayName ?? null,
      responseStatus: a.responseStatus ?? null,
      self: Boolean(a.self),
    }));

  return {
    googleId: raw.id!,
    title: raw.summary?.trim() || "(no title)",
    description: raw.description?.trim() || null,
    startsAt,
    endsAt,
    minutes: Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000),
    zoomMeetingId: zoomIdFrom(raw),
    organizerEmail: raw.organizer?.email?.toLowerCase() ?? null,
    isOrganizer: Boolean(raw.organizer?.self),
    attendees,
  };
}

/**
 * Which email domains count as "us".
 *
 * Every domain any OneSpace user signs in with — minus any that a client is
 * mapped to. That subtraction is the whole point.
 *
 * The Salesforce import creates a user row for anybody it finds owning a
 * record, so one row carrying a client's email address is enough to make
 * that entire domain read as internal. A call with only that client in the
 * room then has no external guests at all: it is skipped, and it is filed
 * under no domain, because there is no external domain to file it under. It
 * disappears leaving nothing behind — no meeting, no entry in the "not
 * shown" panel, nothing to search for.
 *
 * Attaching a domain to a client is a deliberate statement about who they
 * are. A user row is an accident of an import. The deliberate one wins.
 */
export function internalDomains(
  userEmails: Iterable<string>,
  clientDomains: Iterable<string>,
): Set<string> {
  const ours = new Set<string>();
  for (const email of userEmails) {
    const d = email.split("@")[1]?.toLowerCase();
    if (d) ours.add(d);
  }
  for (const d of clientDomains) ours.delete(d.toLowerCase());
  return ours;
}

/** The outside domains in an invite — everyone not on one of ours. */
export function externalDomainsIn(
  attendees: { email: string }[],
  ours: Set<string>,
): string[] {
  return [
    ...new Set(
      attendees
        .map((a) => a.email.split("@")[1]?.toLowerCase())
        .filter((d): d is string => Boolean(d) && !ours.has(d)),
    ),
  ];
}
