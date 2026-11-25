import test from "node:test";
import assert from "node:assert/strict";
import { hasWhen, inboxHref, parseDay, whenRange } from "../src/lib/inbox-filters";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const today = day("2026-11-25");
const floor = day("2026-11-01");

test("no timeframe means everything since the mail start date", () => {
  assert.deepEqual(whenRange({}, today, floor), { gte: floor });
  assert.equal(hasWhen({}), false);
});

test("presets count today as the first day", () => {
  assert.deepEqual(whenRange({ when: "7d" }, today, floor), { gte: day("2026-11-19") });
  assert.deepEqual(whenRange({ when: "14d" }, today, floor), { gte: day("2026-11-12") });
  assert.equal(hasWhen({ when: "7d" }), true);
});

test("a preset reaching past the start date stops at it", () => {
  assert.deepEqual(whenRange({ when: "30d" }, today, floor), { gte: floor });
});

test("a custom range includes the whole of its last day", () => {
  assert.deepEqual(whenRange({ from: "2026-11-10", to: "2026-11-20" }, today, floor), {
    gte: day("2026-11-10"),
    lt: day("2026-11-21"),
  });
});

test("open-ended custom ranges", () => {
  assert.deepEqual(whenRange({ from: "2026-11-15" }, today, floor), { gte: day("2026-11-15") });
  assert.deepEqual(whenRange({ to: "2026-11-05" }, today, floor), {
    gte: floor,
    lt: day("2026-11-06"),
  });
});

test("a custom start before the mail start date is raised to it", () => {
  assert.deepEqual(whenRange({ from: "2026-08-01" }, today, floor), { gte: floor });
});

test("a preset wins over a custom range", () => {
  assert.deepEqual(whenRange({ when: "7d", from: "2026-11-02" }, today, floor), {
    gte: day("2026-11-19"),
  });
});

test("nonsense is ignored rather than emptying the list", () => {
  assert.equal(parseDay("2026-02-31"), null);
  assert.equal(parseDay("yesterday"), null);
  assert.deepEqual(whenRange({ when: "1y", from: "nope", to: "2026-13-01" }, today, floor), {
    gte: floor,
  });
  assert.equal(hasWhen({ when: "1y", from: "nope" }), false);
});

test("links keep the timeframe when other filters change", () => {
  assert.equal(
    inboxHref({ when: "7d", reply: "waiting" }, { show: "done" }),
    "/inbox?show=done&reply=waiting&when=7d",
  );
  assert.equal(
    inboxHref({ from: "2026-11-10", to: "2026-11-20" }, { when: "14d", from: null, to: null }),
    "/inbox?when=14d",
  );
});
