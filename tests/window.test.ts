import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SYNC_FROM,
  labelOf,
  parseWindow,
  sinceOf,
  type Window,
} from "@/lib/window";

const NOW = new Date("2026-09-16T12:00:00Z");

test("a date is a fixed start, and stays put as time passes", () => {
  const w = parseWindow("2026-08-31");
  assert.deepEqual(w, { kind: "date", from: new Date("2026-08-31T00:00:00Z") });
  assert.equal(sinceOf(w, NOW).toISOString(), "2026-08-31T00:00:00.000Z");
  // A month later it is still the same day.
  assert.equal(
    sinceOf(w, new Date("2026-10-16T12:00:00Z")).toISOString(),
    "2026-08-31T00:00:00.000Z",
  );
});

test("a number is a rolling window, and moves with the clock", () => {
  const w = parseWindow("7");
  assert.deepEqual(w, { kind: "days", days: 7 });
  assert.equal(sinceOf(w, NOW).toISOString(), "2026-09-09T12:00:00.000Z");
  assert.equal(
    sinceOf(w, new Date("2026-09-17T12:00:00Z")).toISOString(),
    "2026-09-10T12:00:00.000Z",
  );
});

test("a missing or unreadable setting falls back rather than throwing", () => {
  // These come out of a settings table somebody typed into. A bad row must
  // not take every sync down until an admin notices.
  for (const bad of [null, undefined, "", "   ", "last week", "-5", "0", "3.5", "31/08/2026"]) {
    assert.deepEqual(
      parseWindow(bad),
      { kind: "date", from: new Date(`${DEFAULT_SYNC_FROM}T00:00:00Z`) },
      `expected ${JSON.stringify(bad)} to fall back`,
    );
  }
});

test("a date that doesn't exist is a typo, not a window", () => {
  // Date.UTC would roll this into 3 March and sync from the wrong day.
  assert.deepEqual(parseWindow("2026-02-31", "14"), { kind: "days", days: 14 });
  assert.deepEqual(parseWindow("2026-13-01", "14"), { kind: "days", days: 14 });
});

test("a caller's own fallback is used before the built-in one", () => {
  assert.deepEqual(parseWindow(null, "2025-01-01"), {
    kind: "date",
    from: new Date("2025-01-01T00:00:00Z"),
  });
  assert.deepEqual(parseWindow(null, "30"), { kind: "days", days: 30 });
  // And a nonsense fallback still lands somewhere valid.
  assert.deepEqual(parseWindow(null, "nonsense"), {
    kind: "date",
    from: new Date(`${DEFAULT_SYNC_FROM}T00:00:00Z`),
  });
});

test("a window reads as a sentence, in the words its kind needs", () => {
  assert.equal(labelOf(parseWindow("2026-08-31")), "since 31 August 2026");
  assert.equal(labelOf(parseWindow("7")), "in the last 7 days");
  assert.equal(labelOf(parseWindow("1")), "in the last day");
});

test("the default is 31 August 2026", () => {
  // Named here so changing it is a decision somebody makes on purpose.
  assert.equal(DEFAULT_SYNC_FROM, "2026-08-31");
  const w: Window = parseWindow(undefined);
  assert.equal(sinceOf(w, NOW).toISOString(), "2026-08-31T00:00:00.000Z");
});
