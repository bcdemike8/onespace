import type { Prisma } from "@prisma/client";

/**
 * How far back "meetings still to log" reaches on My Work and in the Slack
 * digest. A fortnight, matching "You said you'd do this": past that a call is
 * backlog, and backlog is dealt with on the Meetings tab, not nagged about.
 */
export const RECENT_MEETING_DAYS = 14;

/**
 * Client meetings from the last fortnight that have happened and haven't been
 * logged or set aside. One definition, so My Work and the Slack digest can't
 * drift apart and quote two different numbers for the same thing.
 *
 * Internal calls (noClient) are left out: they still wait on the Meetings
 * tab, but counting them is what pushed the number into the hundreds.
 */
export function recentClientMeetingsWhere(now = new Date()): Prisma.MeetingWhereInput {
  return {
    status: "PENDING",
    noClient: false,
    startsAt: {
      lte: now,
      gte: new Date(now.getTime() - RECENT_MEETING_DAYS * 86_400_000),
    },
  };
}
