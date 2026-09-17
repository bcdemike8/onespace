import "server-only";
import { googleRequest, SCOPES } from "@/lib/google/auth";
import { asMeeting, type GoogleMeeting, type RawEvent } from "@/lib/google/rules";

export type { GoogleAttendee, GoogleMeeting, RawEvent } from "@/lib/google/rules";
export { asMeeting, notAMeeting } from "@/lib/google/rules";

// Reading meetings off a Google Calendar.
//
// Only the primary calendar. Secondary calendars people subscribe to are other
// people's diaries and holiday feeds, and booking time against someone else's
// meeting is exactly the sort of thing that quietly corrupts a timesheet.

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
  const raw = await listRawEvents(userEmail, from, to);
  return raw.map(asMeeting).filter((m): m is GoogleMeeting => m !== null);
}

/**
 * Everything on the calendar, before any of our rules run.
 *
 * The sync only ever sees what survives asMeeting, which is right for a sync
 * and useless for answering "where is my Thursday call" - the answer there is
 * usually the entry that was thrown away, and a list of survivors cannot name
 * something that is not in it.
 */
export async function listRawEvents(
  userEmail: string,
  from: Date,
  to: Date,
): Promise<RawEvent[]> {
  const out: RawEvent[] = [];
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

    out.push(...(data.items ?? []));

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return out;
}
