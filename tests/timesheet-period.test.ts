import test from "node:test";
import assert from "node:assert/strict";
import { toISODate } from "../src/lib/dates";
import {
  billableSplit,
  customRange,
  daysInRange,
  parseDay,
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
  assert.equal(parsePeriod("custom"), "custom");
});

test("only a real yyyy-mm-dd is a day", () => {
  assert.equal(parseDay("2026-11-02")?.toISOString().slice(0, 10), "2026-11-02");
  for (const bad of [null, undefined, "", "2026-11", "02/11/2026", "2026-13-40", "yesterday"]) {
    assert.equal(parseDay(bad), null, String(bad));
  }
});

test("a custom range comes back in order however it was typed", () => {
  const forwards = customRange("2026-11-02", "2026-11-20")!;
  assert.equal(toISODate(forwards.from), "2026-11-02");
  assert.equal(toISODate(forwards.to), "2026-11-20");
  // Typed backwards: swapped, not refused. They meant the span between them.
  const backwards = customRange("2026-11-20", "2026-11-02")!;
  assert.equal(toISODate(backwards.from), "2026-11-02");
  assert.equal(toISODate(backwards.to), "2026-11-20");
});

test("one day is a legitimate range", () => {
  const r = customRange("2026-11-02", "2026-11-02")!;
  assert.equal(toISODate(r.from), "2026-11-02");
  assert.equal(daysInRange(r.from, r.to), 1);
});

test("a half-filled or nonsense custom range is no range at all", () => {
  assert.equal(customRange("2026-11-02", null), null);
  assert.equal(customRange(null, "2026-11-02"), null);
  assert.equal(customRange("", ""), null);
  assert.equal(customRange("not-a-date", "2026-11-02"), null);
});

test("custom with nothing filled in falls back to the week", () => {
  // Never a blank set of figures because somebody didn't finish a box.
  const r = periodRange("custom", d("2026-09-28"), d("2026-10-04"), d("2026-09-30"), null);
  assert.deepEqual([toISODate(r.from), toISODate(r.to)], ["2026-09-28", "2026-10-04"]);
});

test("custom covers exactly the days given, ignoring the week and today", () => {
  const span = customRange("2026-08-15", "2026-11-02")!;
  const r = periodRange("custom", d("2026-09-28"), d("2026-10-04"), d("2026-09-30"), span);
  assert.deepEqual([toISODate(r.from), toISODate(r.to)], ["2026-08-15", "2026-11-02"]);
  assert.equal(periodLabel("custom", r.from, r.to), "Aug 15 – Nov 2, 2026");
});

test("a range counts both of its ends", () => {
  assert.equal(daysInRange(d("2026-11-02"), d("2026-11-02")), 1);
  assert.equal(daysInRange(d("2026-11-02"), d("2026-11-08")), 7);
  // Across a month boundary, and across a leap day.
  assert.equal(daysInRange(d("2026-10-31"), d("2026-11-01")), 2);
  assert.equal(daysInRange(d("2028-02-28"), d("2028-03-01")), 3);
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
