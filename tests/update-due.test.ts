import test from "node:test";
import assert from "node:assert/strict";
import { updateDue, updateDueLabel, updateWeekStart } from "../src/lib/update-due";

const d = (s: string) => new Date(`${s}T00:00:00Z`);
// Nov 2026: Fri 20, Sat 21, Sun 22, Mon 23, Tue 24, Wed 25, Thu 26, Fri 27.
const OLD = d("2026-01-01");
const due = (today: string, last: string | null, opts: { created?: Date; active?: boolean } = {}) =>
  updateDue({
    today: d(today),
    lastUpdate: last ? d(last) : null,
    projectCreated: opts.created ?? OLD,
    active: opts.active ?? true,
  });

test("the update week opens on Friday", () => {
  assert.deepEqual(updateWeekStart(d("2026-11-20")), d("2026-11-20"));
  assert.deepEqual(updateWeekStart(d("2026-11-23")), d("2026-11-20"));
  assert.deepEqual(updateWeekStart(d("2026-11-26")), d("2026-11-20"));
  assert.deepEqual(updateWeekStart(d("2026-11-27")), d("2026-11-27"));
});

test("Friday to Monday with nothing posted is a reminder; Monday says today", () => {
  for (const day of ["2026-11-20", "2026-11-21", "2026-11-22"]) {
    const r = due(day, "2026-11-16");
    assert.equal(r.state, "due");
    assert.equal(r.state === "due" && r.dueToday, false);
  }
  const mon = due("2026-11-23", "2026-11-16");
  assert.equal(mon.state === "due" && mon.dueToday, true);
  assert.match(updateDueLabel(mon, d("2026-11-23")), /^Update due today · last update 7 days ago$/);
});

test("Tuesday with nothing since Friday is overdue", () => {
  const r = due("2026-11-24", "2026-11-19");
  assert.equal(r.state, "overdue");
  assert.equal(updateDueLabel(r, d("2026-11-24")), "Update overdue · last update 5 days ago");
  assert.equal(updateDueLabel(due("2026-11-24", null), d("2026-11-24")), "Update overdue · no update yet");
});

test("anything posted since Friday counts for the week, even a late one", () => {
  assert.equal(due("2026-11-23", "2026-11-20").state, "posted");
  assert.equal(due("2026-11-26", "2026-11-25").state, "posted");
  // Last Thursday's update was for last week; this Friday it's owed again.
  assert.equal(due("2026-11-27", "2026-11-26").state, "due");
});

test("a 7-day rule would miss this: Wednesday's update doesn't cover next Monday", () => {
  assert.equal(due("2026-11-24", "2026-11-18").state, "overdue");
});

test("on-hold projects and brand-new ones aren't flagged", () => {
  assert.equal(due("2026-11-24", null, { active: false }).state, "exempt");
  const fresh = due("2026-11-24", null, { created: d("2026-11-24") });
  assert.equal(fresh.state, "exempt");
  assert.deepEqual(fresh.state === "exempt" && fresh.dueDate, d("2026-11-30"));
  // Created over the weekend: still owes this Monday.
  assert.equal(due("2026-11-24", null, { created: d("2026-11-21") }).state, "overdue");
});
