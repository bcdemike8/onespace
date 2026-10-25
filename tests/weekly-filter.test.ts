import test from "node:test";
import assert from "node:assert/strict";
import {
  type Filterable,
  countFor,
  countWeekly,
  matchesFilter,
  toggleFilter,
} from "../src/lib/weekly-filter";

const row = (missing: boolean, health: Filterable["health"] = null): Filterable => ({
  missing,
  health,
});

const WEEK: Filterable[] = [
  row(false, "ON_TRACK"),
  row(false, "ON_TRACK"),
  row(false, "AT_RISK"),
  row(false, "OFF_TRACK"),
  row(true),
  row(true),
  row(true),
];

test("updated and missing account for every project", () => {
  const c = countWeekly(WEEK);
  assert.equal(c.total, 7);
  assert.equal(c.updated, 4);
  assert.equal(c.missing, 3);
  assert.equal(c.updated + c.missing, c.total);
});

test("the three colours add up to the updated figure", () => {
  const c = countWeekly(WEEK);
  assert.equal(c.ON_TRACK + c.AT_RISK + c.OFF_TRACK, c.updated);
});

test("a stale health on a project nobody updated is not counted", () => {
  // A row can carry last month's colour. The page is about this week, and
  // counting it would put the spread ahead of the updated figure.
  const c = countWeekly([row(true, "ON_TRACK"), row(false, "ON_TRACK")]);
  assert.equal(c.ON_TRACK, 1);
  assert.equal(c.updated, 1);
  assert.equal(c.missing, 1);
});

test("an empty week counts to zero rather than to nothing", () => {
  assert.deepEqual(countWeekly([]), {
    total: 0,
    updated: 0,
    missing: 0,
    ON_TRACK: 0,
    AT_RISK: 0,
    OFF_TRACK: 0,
  });
});

test("each filter keeps exactly what its figure promised", () => {
  const c = countWeekly(WEEK);
  for (const f of ["all", "updated", "missing", "ON_TRACK", "AT_RISK", "OFF_TRACK"] as const) {
    const kept = WEEK.filter((r) => matchesFilter(r, f)).length;
    assert.equal(kept, countFor(f, c), `${f} kept ${kept}, figure said ${countFor(f, c)}`);
  }
});

test("a colour filter never shows a project with no update", () => {
  assert.equal(matchesFilter(row(true, "AT_RISK"), "AT_RISK"), false);
  assert.equal(matchesFilter(row(false, "AT_RISK"), "AT_RISK"), true);
});

test("pressing the figure you are on goes back to everything", () => {
  assert.equal(toggleFilter("missing", "missing"), "all");
  assert.equal(toggleFilter("all", "missing"), "missing");
  assert.equal(toggleFilter("updated", "missing"), "missing");
});
