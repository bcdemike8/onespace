import test from "node:test";
import assert from "node:assert/strict";
import {
  type Activity,
  type ReportProject,
  type ReportUpdate,
  draftFromActivity,
  draftNextSteps,
  gapLabel,
  gapOf,
  initials,
  isoDay,
  renderUpdate,
  weekEndingThursday,
} from "../src/lib/rocketlane";

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const QUIET: Activity = {
  minutes: 0,
  people: [],
  tasksCompleted: [],
  tasksDueNext: [],
  tasksOverdue: [],
  meetings: 0,
};

const BUSY: Activity = {
  minutes: 450,
  people: ["Marcus Callaway", "Shannon Myers"],
  tasksCompleted: ["Configure field mappings", "Run the kickoff"],
  tasksDueNext: ["User acceptance testing", "Enablement planning"],
  tasksOverdue: ["Install the Salesloft package"],
  meetings: 3,
};

const PROJECT: ReportProject = {
  name: "Honeycomb | Amplify Core 1-19",
  clientName: "Honeycomb",
  status: "ACTIVE",
  ownerName: "Marcus Callaway",
  useCases: "Outbound prospecting for the mid-market team.",
  kpis: "Meetings booked per rep per week; baseline from SFDC, first check 15 Oct.",
  isAmplify: true,
  amplifyStatus: "In Configuration",
  amplifyProduct: "Research Agent, Personalization Agent",
  amplifyDataProvider: "ZoomInfo",
  amplifyCompetitor: "None.",
  evaluationStartDate: d("2026-10-05"),
  evaluationDueDate: d("2026-11-16"),
};

const UPDATE: ReportUpdate = {
  health: "AT_RISK",
  date: d("2026-10-01"),
  authorName: "Marcus Callaway",
  note: "Config is built; waiting on their SFDC admin for the connector.",
  ragReasons: "Access not granted, so evaluation start is at risk.",
  painPoints: "No admin access to Salesforce.",
  risk: "Evaluation slips a week if access doesn't land by Friday.",
  nextSteps: "1. Chase admin access — Marcus\n2. Rebook the config check-in — Shannon",
  customerQuotes: '"This is already faster than our old process." — Dana, 29 Sep',
  baselineMetrics: "4.2 meetings per rep per week.",
  projectMetrics: "Pre-launch — no results yet.",
};

const WEEK = weekEndingThursday(d("2026-10-01"));

// ------------------------------------------------------------------ the week

test("the week ends on the Thursday asked about", () => {
  // 1 Oct 2026 is a Thursday.
  const w = weekEndingThursday(d("2026-10-01"));
  assert.equal(isoDay(w.to), "2026-10-01");
  assert.equal(isoDay(w.from), "2026-09-25");
});

test("asked on any other day it still answers about the last Thursday", () => {
  for (const [asked, expected] of [
    ["2026-10-02", "2026-10-01"], // Friday
    ["2026-10-04", "2026-10-01"], // Sunday
    ["2026-10-07", "2026-10-01"], // Wednesday
    ["2026-10-08", "2026-10-08"], // the next Thursday
  ]) {
    assert.equal(isoDay(weekEndingThursday(d(asked)).to), expected, `asked ${asked}`);
  }
});

test("the window is seven days, month and year boundaries included", () => {
  const w = weekEndingThursday(d("2026-01-01")); // a Thursday
  assert.equal(isoDay(w.to), "2026-01-01");
  assert.equal(isoDay(w.from), "2025-12-26");
});

test("the time of day doesn't move the week", () => {
  const w = weekEndingThursday(new Date("2026-10-01T23:59:00.000Z"));
  assert.equal(isoDay(w.to), "2026-10-01");
});

// ---------------------------------------------------------------------- gaps

test("an update inside the week is not a gap", () => {
  assert.deepEqual(gapOf(d("2026-09-28"), WEEK), { missing: false, daysSince: 3 });
});

test("an update older than the week is a gap, and says how old", () => {
  assert.deepEqual(gapOf(d("2026-09-10"), WEEK), { missing: true, daysSince: 21 });
});

test("a project nobody has ever updated is a gap with no age", () => {
  assert.deepEqual(gapOf(null, WEEK), { missing: true, daysSince: null });
  assert.equal(gapLabel(gapOf(null, WEEK)), "Never updated");
});

test("an update on the first day of the week counts as inside it", () => {
  assert.equal(gapOf(WEEK.from, WEEK).missing, false);
});

test("the gap reads as English", () => {
  assert.equal(gapLabel(gapOf(d("2026-10-01"), WEEK)), "Updated today");
  assert.equal(gapLabel(gapOf(d("2026-09-30"), WEEK)), "Updated yesterday");
  assert.equal(gapLabel(gapOf(d("2026-09-24"), WEEK)), "Updated 7 days ago");
});

// -------------------------------------------------------------------- drafts

test("a draft reports only what OneSpace watched happen", () => {
  const text = draftFromActivity(BUSY);
  assert.match(text, /7\.5 hours logged by Marcus Callaway and Shannon Myers\./);
  assert.match(text, /3 meetings held\./);
  assert.match(text, /Completed: Configure field mappings and Run the kickoff\./);
  assert.match(text, /Now overdue: Install the Salesloft package\./);
});

test("a quiet week says so rather than saying nothing", () => {
  assert.equal(
    draftFromActivity(QUIET),
    "No time logged, no tasks closed and no meetings held this week.",
  );
});

test("singular hours and meetings read as singular", () => {
  const text = draftFromActivity({ ...QUIET, minutes: 60, meetings: 1, people: ["Ana"] });
  assert.match(text, /1 hour logged by Ana\./);
  assert.match(text, /1 meeting held\./);
});

test("next steps come out numbered, with an owner on each", () => {
  assert.equal(
    draftNextSteps(BUSY, "Marcus Callaway"),
    "1. User acceptance testing — Marcus Callaway\n2. Enablement planning — Marcus Callaway",
  );
  assert.equal(draftNextSteps(QUIET, "Marcus Callaway"), null);
});

// -------------------------------------------------------------------- render

test("a filled update renders every field from what was written", () => {
  const out = renderUpdate({
    project: PROJECT,
    update: UPDATE,
    activity: BUSY,
    week: WEEK,
    draft: true,
  });
  assert.match(out, /^# RocketLane Update — Honeycomb$/m);
  assert.match(out, /^Date: 2026-10-01$/m);
  assert.match(out, /^MC$/m);
  assert.match(out, /^Project Name: Honeycomb \| Amplify Core 1-19$/m);
  assert.match(out, /^Project Status: In Progress$/m);
  assert.match(out, /^RAG Status: Amber$/m);
  assert.match(out, /^Amplify Status: In Configuration$/m);
  assert.match(out, /^Evaluation Due Date: 2026-11-16$/m);
  assert.match(out, /^Current Status: Config is built; waiting on their SFDC admin/m);
  // A multi-line value goes under its label rather than running off it.
  assert.match(out, /^Next Steps:\n1\. Chase admin access — Marcus$/m);
  // Nothing drafted leaks in when there's a real update.
  assert.doesNotMatch(out, /hours logged by/);
});

test("a non-Amplify engagement drops the Amplify fields entirely", () => {
  const out = renderUpdate({
    project: { ...PROJECT, isAmplify: false },
    update: UPDATE,
    activity: QUIET,
    week: WEEK,
    draft: false,
  });
  for (const field of [
    "Amplify Status:",
    "Amplify Product:",
    "Amplify Data Provider:",
    "Amplify Competitor:",
    "Evaluation Start Date:",
    "Evaluation Due Date:",
  ]) {
    assert.ok(!out.includes(field), `${field} should be gone`);
  }
  // The fields the template keeps for every engagement are still there.
  assert.match(out, /^Use Case\(s\): /m);
  assert.match(out, /^RAG Status: Amber$/m);
});

test("with no update the blanks keep the template's own prompts", () => {
  const out = renderUpdate({
    project: { ...PROJECT, useCases: null, kpis: null },
    update: null,
    activity: QUIET,
    week: WEEK,
    draft: false,
  });
  assert.match(out, /^RAG Status: \[Green \/ Amber \/ Red\]$/m);
  assert.match(out, /^Use Case\(s\): \[1–2 sentence description/m);
  assert.match(out, /^Current Status: \[What's true right now/m);
  assert.match(out, /^Pain Points: \[Open blockers, named\.\]$/m);
});

test("drafting fills Current Status and Next Steps, and nothing else", () => {
  const out = renderUpdate({
    project: PROJECT,
    update: null,
    activity: BUSY,
    week: WEEK,
    draft: true,
  });
  assert.match(out, /^Current Status: 7\.5 hours logged by/m);
  assert.match(out, /^Next Steps:\n1\. User acceptance testing — Marcus Callaway$/m);
  // A judgement no activity can make for you stays a blank.
  assert.match(out, /^RAG Status: \[Green \/ Amber \/ Red\]$/m);
  assert.match(out, /^Risk: \[What could slip/m);
});

test("the date falls back to the week's end when nobody has updated", () => {
  const out = renderUpdate({
    project: PROJECT,
    update: null,
    activity: QUIET,
    week: WEEK,
    draft: false,
  });
  assert.match(out, /^Date: 2026-10-01$/m);
  // Owner's initials stand in for the author nobody recorded.
  assert.match(out, /^MC$/m);
});

test("a project with no client is headed by its own name", () => {
  const out = renderUpdate({
    project: { ...PROJECT, clientName: null },
    update: UPDATE,
    activity: QUIET,
    week: WEEK,
    draft: false,
  });
  assert.match(out, /^# RocketLane Update — Honeycomb \| Amplify Core 1-19$/m);
});

test("a completed project says Completed, not In Progress", () => {
  const out = renderUpdate({
    project: { ...PROJECT, status: "COMPLETED" },
    update: UPDATE,
    activity: QUIET,
    week: WEEK,
    draft: false,
  });
  assert.match(out, /^Project Status: Completed$/m);
});

test("initials are the first two names, or the template's prompt", () => {
  assert.equal(initials("Brianna Dunbar-DeMike"), "BD");
  assert.equal(initials("Marcus Callaway"), "MC");
  assert.equal(initials("Ana"), "A");
  assert.equal(initials("  "), "[OWNER INITIALS]");
  assert.equal(initials(null), "[OWNER INITIALS]");
});

test("whitespace-only values fall back to the prompt, not to a blank line", () => {
  const out = renderUpdate({
    project: { ...PROJECT, useCases: "   " },
    update: { ...UPDATE, painPoints: "\n  \n" },
    activity: QUIET,
    week: WEEK,
    draft: false,
  });
  assert.match(out, /^Use Case\(s\): \[1–2 sentence/m);
  assert.match(out, /^Pain Points: \[Open blockers, named\.\]$/m);
});
