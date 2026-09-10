import "server-only";
import { googleRequest, SCOPES } from "@/lib/google/auth";

// Reading meetings off a Google Calendar.
//
// Only the primary calendar. Secondary calendars people subscribe to are other
// people's diaries and holiday feeds, and booking time against someone else's
// meeting is exactly the sort of thing that quietly corrupts a timesheet.

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

interface RawEvent {
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
 * Meetings on one person's calendar between two instants.
 *
 * Filtering happens here rather than at the database, because these are the
 * rules about what counts as a meeting at all, and they are the same wherever
 * the sync is triggered from.
 */
export async function listMeetings(
  userEmail: string,
  from: Date,
  to: Date,
): Promise<GoogleMeeting[]> {
  const out: GoogleMeeting[] = [];
  let pageToken: string | undefined;

  // Bounded, like the Slack channel list: 20 pages of 250 is five thousand
  // meetings, well past anything a person has, and an unbounded loop against
  // a paginated API is how you end up rate-limited at 5am.
  for (let page = 0; page < 20; page++) {
    const data = await googleRequest<{
      items?: RawEvent[];
      nextPageToken?: string;
    }>({
      subject: userEmail,
      scopes: [SCOPES.calendar],
      url: "/calendar/v3/calendars/primary/events",
      query: {
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        // Expands a recurring series into its actual occurrences. Without it
        // a weekly client call arrives as one row with a recurrence rule.
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: 250,
        pageToken,
      },
    });

    for (const raw of data.items ?? []) {
      const meeting = toMeeting(raw);
      if (meeting) out.push(meeting);
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return out;
}

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

/** One raw event, or null if it isn't work worth booking. */
function toMeeting(raw: RawEvent): GoogleMeeting | null {
  if (!raw.id) return null;
  if (raw.status === "cancelled") return null;

  // Out of office and working-location entries are the opposite of billable.
  if (raw.eventType === "outOfOffice" || raw.eventType === "workingLocation") {
    return null;
  }

  // All-day events have `date` and no `dateTime`. They're holidays, launches
  // and reminders, not two hours of anyone's time.
  const startISO = raw.start?.dateTime;
  const endISO = raw.end?.dateTime;
  if (!startISO || !endISO) return null;

  const startsAt = new Date(startISO);
  const endsAt = new Date(endISO);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return null;

  const minutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);
  if (minutes <= 0 || minutes > MAX_MINUTES) return null;

  const attendees: GoogleAttendee[] = (raw.attendees ?? [])
    .filter((a) => a.email && !a.resource && !isResource(a.email))
    .map((a) => ({
      email: a.email!.toLowerCase(),
      name: a.displayName ?? null,
      responseStatus: a.responseStatus ?? null,
      self: Boolean(a.self),
    }));

  // Declining a meeting and then being asked to book time for it is the
  // fastest way to make people stop trusting the suggestions.
  const me = attendees.find((a) => a.self);
  if (me?.responseStatus === "declined") return null;

  return {
    googleId: raw.id,
    title: raw.summary?.trim() || "(no title)",
    description: raw.description?.trim() || null,
    startsAt,
    endsAt,
    minutes,
    zoomMeetingId: zoomIdFrom(raw),
    organizerEmail: raw.organizer?.email?.toLowerCase() ?? null,
    isOrganizer: Boolean(raw.organizer?.self),
    attendees,
  };
}
