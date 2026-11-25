import { test } from "node:test";
import assert from "node:assert/strict";
import { callHealth, retryWithoutWriteUp, type CallRow } from "@/lib/zoom/retry";

/**
 * Recent calls without a write-up are retried once a day, and the admin
 * health panel counts what happened to each person's calls.
 */
const NOW = new Date("2026-11-25T12:00:00Z");
const SINCE = new Date("2026-11-16T06:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000);

const call = (over: Partial<CallRow> = {}): CallRow => ({
  userId: "yazmin",
  zoomUuid: "z1",
  startsAt: new Date("2026-11-20T16:00:00Z"),
  transcriptReadAt: hoursAgo(30),
  transcriptFailedAt: null,
  summarisedAt: null,
  transcriptNote: "This meeting was read before Claude was connected.",
  ...over,
});

test("a recent call read a day ago with no write-up is tried again", () => {
  assert.ok(retryWithoutWriteUp(call(), SINCE, NOW));
});

test("...but not more than once a day", () => {
  assert.ok(!retryWithoutWriteUp(call({ transcriptReadAt: hoursAgo(5) }), SINCE, NOW));
});

test("...and not within a day of a failed attempt", () => {
  assert.ok(!retryWithoutWriteUp(call({ transcriptFailedAt: hoursAgo(3) }), SINCE, NOW));
});

test("a call with a write-up is never retried", () => {
  assert.ok(!retryWithoutWriteUp(call({ summarisedAt: hoursAgo(30) }), SINCE, NOW));
});

test("a call not read yet is the ordinary sync's, not a retry", () => {
  assert.ok(!retryWithoutWriteUp(call({ transcriptReadAt: null }), SINCE, NOW));
});

test("calls older than My work's window aren't retried", () => {
  assert.ok(!retryWithoutWriteUp(call({ startsAt: new Date("2026-11-10T16:00:00Z") }), SINCE, NOW));
});

test("reasons that won't change by trying again aren't retried", () => {
  for (const note of [
    "The transcript for this call is only 80 characters - too little to write anything up from.",
    "Claude ran out of room writing this call up.",
    "Claude declined to write this call up.",
    "Write-ups only cover calls since 31 August 2026, so this one wasn't read.",
  ]) {
    assert.ok(!retryWithoutWriteUp(call({ transcriptNote: note }), SINCE, NOW), note);
  }
});

test("a call that wasn't recorded to the cloud is retried - Zoom may have it now", () => {
  assert.ok(
    retryWithoutWriteUp(
      call({ transcriptNote: "This call wasn't recorded to the cloud, so there's no transcript to read." }),
      SINCE,
      NOW,
    ),
  );
});

test("the health panel counts each person's calls by what happened to them", () => {
  const [h] = callHealth(
    [
      call({ summarisedAt: hoursAgo(20) }),
      call({ transcriptReadAt: null }),
      call(),
      call({ transcriptNote: "This meeting was read before Claude was connected." }),
      call({ zoomUuid: null, transcriptReadAt: null, transcriptNote: null }),
      call({ userId: "sam" }),
    ],
    [{ id: "yazmin", name: "Yazmin Dorsey" }],
  );
  assert.deepEqual(
    { calls: h.calls, writtenUp: h.writtenUp, waiting: h.waiting, noWriteUp: h.noWriteUp, notOnZoom: h.notOnZoom },
    { calls: 5, writtenUp: 1, waiting: 1, noWriteUp: 2, notOnZoom: 1 },
  );
  assert.equal(h.topReason, "This meeting was read before Claude was connected.");
});
