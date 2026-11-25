import test from "node:test";
import assert from "node:assert/strict";
import {
  deadlineFor,
  myWorkAlert,
  staleForMyWork,
  updateAlert,
  updateDue,
} from "../src/lib/update-due";

const d = (s: string) => new Date(`${s}T00:00:00Z`);
// Nov/Dec 2026: Tue 24, Wed 25, Thu 26, Fri 27, Sat 28, Sun 29, Mon 30,
// Tue Dec 1, ... Fri 4, Mon 7, Tue 8.
const OLD = d("2026-01-01");
const due = (today: string, last: string | null, opts: { created?: string; active?: boolean } = {}) =>
  updateDue({
    today: d(today),
    lastUpdate: last ? d(last) : null,
    projectCreated: opts.created ? d(opts.created) : OLD,
    active: opts.active ?? true,
  });

test("the deadline is the Monday on or after today", () => {
  assert.deepEqual(deadlineFor(d("2026-11-24")), d("2026-11-30"));
  assert.deepEqual(deadlineFor(d("2026-11-27")), d("2026-11-30"));
  assert.deepEqual(deadlineFor(d("2026-11-30")), d("2026-11-30"));
  assert.deepEqual(deadlineFor(d("2026-12-01")), d("2026-12-07"));
});

test("nothing is flagged before 27 November", () => {
  const r = due("2026-11-26", null);
  assert.equal(r.state, "exempt");
  assert.equal(updateAlert(r, d("2026-11-26")), null);
  assert.equal(staleForMyWork(r, d("2026-11-26")), false);
});

test("an update on 24-26 Nov clears the 30 Nov deadline", () => {
  for (const last of ["2026-11-24", "2026-11-25", "2026-11-26"]) {
    assert.equal(due("2026-11-27", last).state, "posted");
    assert.equal(due("2026-11-30", last).state, "posted");
    // ...and nobody is chased for it on Tuesday 1 Dec either.
    assert.equal(due("2026-12-01", last).state, "ok");
  }
  // 23 Nov is before the window.
  assert.equal(due("2026-11-27", "2026-11-23").state, "due");
});

test("Friday to Monday with nothing since Tuesday is a reminder", () => {
  for (const day of ["2026-11-27", "2026-11-28", "2026-11-29"]) {
    const r = due(day, "2026-11-20");
    assert.equal(r.state, "due");
    assert.equal(r.state === "due" && r.dueToday, false);
  }
  const mon = due("2026-11-30", "2026-11-20");
  assert.equal(mon.state === "due" && mon.dueToday, true);
  assert.equal(updateAlert(mon, d("2026-11-30"))?.label, "Update due today · last update 10 days ago");
});

test("missing Monday makes it overdue from Tuesday until someone posts", () => {
  const r = due("2026-12-01", "2026-11-20");
  assert.equal(r.state, "overdue");
  assert.equal(updateAlert(r, d("2026-12-01"))?.tone, "bad");
  assert.match(updateAlert(r, d("2026-12-01"))!.label, /^Missed Mon Nov 30.* update · last update 11 days ago$/);
  assert.equal(due("2026-12-04", "2026-11-20").state, "overdue");
  // Posting on Wednesday clears it, and counts for 7 Dec too.
  assert.equal(due("2026-12-03", "2026-12-02").state, "posted");
  assert.equal(due("2026-12-07", "2026-12-02").state, "posted");
});

test("a Tuesday-to-Thursday update after the weekly call covers next Monday", () => {
  assert.equal(due("2026-12-07", "2026-12-01").state, "posted");
  assert.equal(due("2026-12-07", "2026-12-03").state, "posted");
  // Last week's Thursday doesn't: 3 Dec is in the window for 7 Dec, not 14 Dec.
  assert.equal(due("2026-12-11", "2026-12-03").state, "due");
});

test("My work only flags what's had nothing for 7 days", () => {
  // Friday, updated Monday (4 days): owed by Monday, but not nagged on My work.
  const fri = due("2026-12-04", "2026-11-30");
  assert.equal(fri.state, "due");
  assert.equal(staleForMyWork(fri, d("2026-12-04")), false);
  assert.equal(myWorkAlert(fri, d("2026-12-04")), null);
  // Monday, same update (7 days): flagged, and it's the deadline.
  const mon = due("2026-12-07", "2026-11-30");
  assert.equal(myWorkAlert(mon, d("2026-12-07"))?.label, "No update in 7 days · due today");
  // Missed a Monday: always on My work, in red.
  const missed = due("2026-12-01", "2026-11-20");
  assert.equal(myWorkAlert(missed, d("2026-12-01"))?.tone, "bad");
  // Never posted.
  assert.match(myWorkAlert(due("2026-11-27", null), d("2026-11-27"))!.label, /^Never posted · due Mon/);
  // Posted this week: never flagged.
  assert.equal(myWorkAlert(due("2026-12-07", "2026-12-01"), d("2026-12-07")), null);
});

test("on-hold projects and brand-new ones aren't flagged", () => {
  assert.equal(due("2026-12-01", null, { active: false }).state, "exempt");
  // Set up on Saturday: doesn't owe Monday's.
  const sat = due("2026-11-30", null, { created: "2026-11-28" });
  assert.equal(sat.state, "exempt");
  assert.deepEqual(sat.state === "exempt" && sat.dueDate, d("2026-12-07"));
  assert.equal(due("2026-12-01", null, { created: "2026-11-28" }).state, "ok");
  assert.equal(due("2026-12-04", null, { created: "2026-11-28" }).state, "due");
  // Set up by the Friday: owes it.
  assert.equal(due("2026-12-01", null, { created: "2026-11-27" }).state, "overdue");
});
