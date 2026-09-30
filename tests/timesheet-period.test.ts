import test from "node:test";
import assert from "node:assert/strict";
import { toISODate } from "../src/lib/dates";
import {
  billableSplit,
  parsePeriod,
  periodLabel,
  periodRange,
  summarize,
} from "../src/lib/timesheet-period";

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const range = (p: Parameters<typeof periodRange>[0], now: string) => {
  const r = periodRange(p, d("2026-09-28"), d("2026-10-04"), d(now));
  return [toISODate(r.from), toISODate(r.to)];
};

test("anything unrecognised means the week, not a crash", () => {
  assert.equal(parsePeriod(undefined), "week");
  assert.equal(parsePeriod(""), "week");
  assert.equal(parsePeriod("quarter"), "week");
  assert.equal(parsePeriod("month"), "month");
  assert.equal(parsePeriod("last_month"), "last_month");
});

test("the week follows the sheet, so the arrows move the figures with it", () => {
  assert.deepEqual(range("week", "2026-09-30"), ["2026-09-28", "2026-10-04"]);
});

test("the months anchor on today, not on the week being viewed", () => {
  // Viewing the week of Sep 28 while today is Sep 30: "this month" is
  // September whichever week is on screen.
  assert.deepEqual(range("month", "2026-09-30"), ["2026-09-01", "2026-09-30"]);
  assert.deepEqual(range("last_month", "2026-09-30"), ["2026-08-01", "2026-08-31"]);
});

test("last month from the 1st is the month before, not this one", () => {
  assert.deepEqual(range("last_month", "2026-10-01"), ["2026-09-01", "2026-09-30"]);
});

test("stepping back over a year boundary still lands on December", () => {
  assert.deepEqual(range("last_month", "2026-01-15"), ["2025-12-01", "2025-12-31"]);
});

test("February's end is February's end, leap year included", () => {
  assert.deepEqual(range("month", "2028-02-10"), ["2028-02-01", "2028-02-29"]);
  assert.deepEqual(range("month", "2026-02-10"), ["2026-02-01", "2026-02-28"]);
});

test("a week reads as a range, a month reads as its name", () => {
  assert.equal(periodLabel("week", d("2026-09-28"), d("2026-10-04")), "Sep 28 – Oct 4, 2026");
  assert.equal(periodLabel("month", d("2026-09-01"), d("2026-09-30")), "Sep 2026");
});

const entry = (minutes: number, billable: boolean, rate: number, projectId = "p1") => ({
  minutes,
  billable,
  billRateCents: rate,
  projectId,
});

test("billable minutes are valued at the rate on the entry", () => {
  const t = summarize([entry(60, true, 17_500), entry(30, true, 20_000)]);
  assert.equal(t.minutes, 90);
  assert.equal(t.billableMinutes, 90);
  assert.equal(t.billableCents, 17_500 + 10_000);
});

test("non-billable time counts as hours and not as money", () => {
  const t = summarize([entry(60, true, 17_500), entry(120, false, 17_500)]);
  assert.equal(t.minutes, 180);
  assert.equal(t.billableMinutes, 60);
  assert.equal(t.billableCents, 17_500);
});

test("projects are counted once however many entries they have", () => {
  const t = summarize([
    entry(60, true, 100, "a"),
    entry(60, true, 100, "a"),
    entry(60, true, 100, "b"),
  ]);
  assert.equal(t.projectCount, 2);
});

test("an empty period is zero, not NaN", () => {
  const t = summarize([]);
  assert.deepEqual(t, {
    minutes: 0,
    billableMinutes: 0,
    billableCents: 0,
    projectCount: 0,
  });
  assert.equal(billableSplit(t), "Nothing logged yet");
});

test("the split says the thing worth noticing", () => {
  assert.equal(billableSplit(summarize([entry(60, true, 100)])), "Every hour billable");
  assert.equal(billableSplit(summarize([entry(60, false, 100)])), "No billable hours");
  assert.equal(
    billableSplit(summarize([entry(120, true, 100), entry(60, false, 100)])),
    "67% of hours billable",
  );
});
