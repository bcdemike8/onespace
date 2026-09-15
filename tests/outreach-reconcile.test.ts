import { test } from "node:test";
import assert from "node:assert/strict";
import {
  matchMeeting,
  reconcile,
  tally,
  type MeetingRow,
  type RecordingRow,
} from "@/lib/outreach/reconcile";

/**
 * "No write-up" has meant five different things all week. These pin each one
 * to a distinct verdict, because the fix for a call nobody recorded is not
 * the fix for a call Zoom refused.
 */

const at = (iso: string) => new Date(iso);

const meeting = (over: Partial<MeetingRow> = {}): MeetingRow => ({
  id: "m1",
  title: "RevOptics | E2L - SDR Workflow Review",
  startsAt: at("2026-09-15T17:30:00Z"),
  googleId: "17efk951c21oosjhoj3telllfr",
  zoomUuid: "abc==",
  summary: null,
  transcriptNote: null,
  transcriptReadAt: null,
  ownerName: "Andrew Henningsen",
  ...over,
});

const recording = (over: Partial<RecordingRow> = {}): RecordingRow => ({
  id: "21332",
  title: "RevOptics | E2L - SDR Workflow Review",
  startTime: at("2026-09-15T17:30:53Z"),
  sourceId: "17efk951c21oosjhoj3telllfr",
  seconds: 509,
  hostName: "Andrew Henningsen",
  ...over,
});

test("the calendar event id is the join when both sides carry it", () => {
  const other = meeting({ id: "m2", googleId: "somethingelse", title: "Other" });
  assert.equal(matchMeeting(recording(), [other, meeting()])?.id, "m1");
});

test("the event id wins over a meeting that merely starts at the same time", () => {
  const decoy = meeting({ id: "decoy", googleId: "nope", title: "Standup" });
  const real = meeting({ id: "real", startsAt: at("2026-09-15T18:20:00Z") });
  assert.equal(matchMeeting(recording(), [decoy, real])?.id, "real");
});

test("without an event id, a near-in-time call with the same title matches", () => {
  const rec = recording({ sourceId: null });
  const m = meeting({ googleId: null, startsAt: at("2026-09-15T17:35:00Z") });
  assert.equal(matchMeeting(rec, [m])?.id, "m1");
});

test("a different call at the same time is not claimed", () => {
  const rec = recording({ sourceId: null });
  const m = meeting({ googleId: null, title: "Payroll sync" });
  assert.equal(matchMeeting(rec, [m]), null);
});

test("an hour apart is not the same call however alike the titles", () => {
  const rec = recording({ sourceId: null });
  const m = meeting({ googleId: null, startsAt: at("2026-09-15T19:00:00Z") });
  assert.equal(matchMeeting(rec, [m]), null);
});

test("a write-up is reported as done", () => {
  const [line] = reconcile([recording()], [meeting({ summary: "We agreed..." })]);
  assert.equal(line.verdict, "written-up");
});

test("a refusal reports Zoom's own reason, not a generic failure", () => {
  const [line] = reconcile(
    [recording()],
    [meeting({ transcriptNote: "Zoom refused the download." })],
  );
  assert.equal(line.verdict, "read-failed");
  assert.equal(line.detail, "Zoom refused the download.");
});

test("read but empty is distinguished from never read", () => {
  const [empty] = reconcile(
    [recording()],
    [meeting({ transcriptReadAt: at("2026-09-15T18:00:00Z") })],
  );
  assert.equal(empty.verdict, "read-empty");

  const [never] = reconcile([recording()], [meeting()]);
  assert.equal(never.verdict, "never-read");
});

test("a recorded call with no Zoom recording linked says so plainly", () => {
  const [line] = reconcile([recording()], [meeting({ zoomUuid: null })]);
  assert.equal(line.verdict, "never-read");
  assert.match(line.detail, /Kaia recorded it/);
});

test("a call OneSpace has never heard of is its own verdict", () => {
  const [line] = reconcile([recording()], []);
  assert.equal(line.verdict, "no-meeting");
  assert.equal(line.meetingId, null);
});

test("the tally counts every verdict, including the zeroes", () => {
  const counts = tally(reconcile([recording()], [meeting({ summary: "x" })]));
  assert.deepEqual(counts, {
    "written-up": 1,
    "read-empty": 0,
    "read-failed": 0,
    "never-read": 0,
    "no-meeting": 0,
  });
});
