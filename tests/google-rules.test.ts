import { test } from "node:test";
import assert from "node:assert/strict";
import { asMeeting, notAMeeting, type RawEvent } from "@/lib/google/rules";

/**
 * The two meetings Brianna sent, as Google returns them.
 *
 * Both are real client calls that never reached OneSpace, and the question
 * was which rule caught them. Written down as events rather than described,
 * so the answer is a test result instead of an opinion.
 */

const pureEHS: RawEvent = {
  id: "evt_pureehs",
  status: "confirmed",
  summary: "RevOptics | PureEHS - Workflow Interview",
  location: "https://us06web.zoom.us/j/89182007314",
  start: { dateTime: "2026-09-03T20:00:00Z" }, // 3pm Central
  end: { dateTime: "2026-09-03T21:00:00Z" },
  organizer: { email: "marcus@revoptics.co", self: true },
  attendees: [
    { email: "marcus@revoptics.co", self: true, responseStatus: "accepted", organizer: true },
    { email: "ashley@revoptics.co", responseStatus: "accepted" },
    { email: "stephanie.lawson@pureehs.com", responseStatus: "accepted" },
    { email: "zachary.mooney@pureehs.com", responseStatus: "needsAction" },
  ],
};

const element451: RawEvent = {
  id: "evt_element451",
  status: "confirmed",
  summary: "RevOptics | Element451, Inc. - Workflow Interview",
  location: "https://us06web.zoom.us/j/84716344507",
  start: { dateTime: "2026-09-04T16:00:00Z" }, // 11am Central
  end: { dateTime: "2026-09-04T17:00:00Z" },
  organizer: { email: "marcus@revoptics.co", self: true },
  attendees: [
    { email: "marcus@revoptics.co", self: true, responseStatus: "accepted", organizer: true },
    { email: "caio.lacroix@element451.com", responseStatus: "accepted" },
    { email: "sydney.blozan@element451.com", responseStatus: "accepted" },
    { email: "yazmin@revoptics.co", responseStatus: "accepted" },
    { email: "kayla.bell@element451.com", responseStatus: "tentative" },
  ],
};

test("both of the meetings that went missing are meetings", () => {
  // If either of these had a reason, that reason would be the bug. Neither
  // does — which leaves the client-domain rule, and nothing else.
  assert.equal(notAMeeting(pureEHS), null);
  assert.equal(notAMeeting(element451), null);
});

test("they survive with their guests, their length and their Zoom link", () => {
  const m = asMeeting(element451)!;
  assert.equal(m.title, "RevOptics | Element451, Inc. - Workflow Interview");
  assert.equal(m.minutes, 60);
  assert.equal(m.zoomMeetingId, "84716344507");
  assert.equal(m.isOrganizer, true);
  assert.equal(m.attendees.length, 5);
  assert.ok(m.attendees.some((a) => a.email === "caio.lacroix@element451.com"));

  const p = asMeeting(pureEHS)!;
  assert.equal(p.minutes, 60);
  assert.equal(p.zoomMeetingId, "89182007314");
});

test("a tentative or unanswered guest doesn't stop a meeting counting", () => {
  // kayla.bell is "tentative" and zachary.mooney "needsAction". Only the
  // person whose calendar it is declining matters.
  assert.equal(notAMeeting(element451), null);
  assert.equal(notAMeeting(pureEHS), null);
});

test("every rule that drops an entry says which rule it was", () => {
  const cases: [Partial<RawEvent>, RegExp][] = [
    [{ status: "cancelled" }, /Cancelled/],
    [{ eventType: "outOfOffice" }, /out-of-office/],
    [{ eventType: "workingLocation" }, /working-location/],
    [{ start: { date: "2026-09-04" }, end: { date: "2026-09-05" } }, /all-day/],
    [
      {
        start: { dateTime: "2026-09-04T16:00:00Z" },
        end: { dateTime: "2026-09-05T16:00:00Z" },
      },
      /Longer than 12 hours/,
    ],
    [
      {
        start: { dateTime: "2026-09-04T17:00:00Z" },
        end: { dateTime: "2026-09-04T16:00:00Z" },
      },
      /ends before it starts/,
    ],
    [
      {
        attendees: [
          { email: "marcus@revoptics.co", self: true, responseStatus: "declined" },
          { email: "caio.lacroix@element451.com", responseStatus: "accepted" },
        ],
      },
      /declined/,
    ],
  ];

  for (const [over, expected] of cases) {
    const why = notAMeeting({ ...element451, ...over });
    assert.match(why ?? "", expected, `expected ${JSON.stringify(over)} to be refused`);
    assert.equal(asMeeting({ ...element451, ...over }), null);
  }
});

test("an entry with no id is refused rather than crashing on it", () => {
  assert.match(notAMeeting({ ...element451, id: undefined }) ?? "", /no id/);
});

test("rooms and equipment are not guests", () => {
  const withRoom = asMeeting({
    ...element451,
    attendees: [
      ...(element451.attendees ?? []),
      { email: "revoptics.com_room@resource.calendar.google.com", resource: true },
    ],
  })!;
  assert.equal(withRoom.attendees.length, 5);
});

test("notAMeeting and asMeeting never disagree", () => {
  // asMeeting is a wrapper over notAMeeting, and this is what keeps it one.
  const all: RawEvent[] = [
    pureEHS,
    element451,
    { ...element451, status: "cancelled" },
    { ...element451, eventType: "outOfOffice" },
    { ...element451, start: { date: "2026-09-04" }, end: { date: "2026-09-05" } },
  ];
  for (const e of all) {
    assert.equal(
      asMeeting(e) === null,
      notAMeeting(e) !== null,
      `disagreed about ${e.summary}`,
    );
  }
});
