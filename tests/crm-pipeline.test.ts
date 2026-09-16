import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PIPELINE_STAGE_ORDER,
  bandOf,
  sections,
  summary,
  type PipelineDeal,
} from "@/lib/crm/pipeline";

const deal = (over: Partial<PipelineDeal> = {}): PipelineDeal => ({
  id: Math.random().toString(36).slice(2),
  name: "A deal",
  stage: "PROPOSAL",
  amount: 1000,
  closeDate: new Date(Date.UTC(2026, 5, 15)),
  isWon: false,
  isClosed: false,
  probability: 50,
  clientId: "c1",
  clientName: "Acme",
  ownerName: "Brianna",
  partnerName: null,
  businessType: null,
  consultantName: null,
  nextStep: null,
  createdAt: new Date(Date.UTC(2026, 0, 1)),
  ...over,
});

// --------------------------------------------------------------------- bands

test("a deal is in exactly one of the three bands", () => {
  assert.equal(bandOf(deal()), "PIPELINE");
  assert.equal(bandOf(deal({ isClosed: true, isWon: true })), "WON");
  assert.equal(bandOf(deal({ isClosed: true, isWon: false })), "LOST");
});

test("every deal reaches a section, and none reaches two", () => {
  const all = [
    deal({ id: "a" }),
    deal({ id: "b", isClosed: true, isWon: true }),
    deal({ id: "c", isClosed: true }),
  ];
  const ids = sections(all).flatMap((s) => s.groups.flatMap((g) => g.deals.map((d) => d.id)));
  assert.deepEqual([...ids].sort(), ["a", "b", "c"]);
  assert.equal(new Set(ids).size, ids.length);
});

// ------------------------------------------------------------------ pipeline

test("the pipeline leads with what is closest to signing", () => {
  // The reverse of the stage path, on purpose: a path shows a journey and
  // starts at the beginning; a pipeline shows work and starts with what is
  // about to land.
  assert.equal(PIPELINE_STAGE_ORDER[0], "CONTRACT");
  assert.equal(PIPELINE_STAGE_ORDER.at(-1), "QUALIFICATION");

  const [pipeline] = sections([
    deal({ stage: "QUALIFICATION" }),
    deal({ stage: "CONTRACT" }),
    deal({ stage: "DISCOVERY" }),
  ]);
  assert.deepEqual(pipeline.groups.map((g) => g.label), [
    "Contract",
    "Discovery",
    "Qualification",
  ]);
});

test("inside a stage, the soonest close comes first", () => {
  const [pipeline] = sections([
    deal({ id: "later", closeDate: new Date(Date.UTC(2026, 11, 1)) }),
    deal({ id: "sooner", closeDate: new Date(Date.UTC(2026, 6, 1)) }),
  ]);
  assert.deepEqual(pipeline.groups[0].deals.map((d) => d.id), ["sooner", "later"]);
});

test("an undated open deal sorts last rather than first", () => {
  // No close date is "unscheduled", not "closing today". Sorting it to the
  // top would put the least certain work where the most urgent should be.
  const [pipeline] = sections([
    deal({ id: "undated", closeDate: null }),
    deal({ id: "dated", closeDate: new Date(Date.UTC(2026, 11, 1)) }),
  ]);
  assert.deepEqual(pipeline.groups[0].deals.map((d) => d.id), ["dated", "undated"]);
});

test("an open deal with an unrecognised stage is shown, not dropped", () => {
  const [pipeline] = sections([deal({ stage: "CLOSED_WON", isClosed: false })]);
  assert.equal(pipeline.count, 1);
  assert.equal(pipeline.groups.at(-1)?.label, "Stage not recognised");
});

// ------------------------------------------------------------ won and lost

test("closed months run newest first, and so do the deals inside them", () => {
  const [, won] = sections([
    deal({ id: "jan", isClosed: true, isWon: true, closeDate: new Date(Date.UTC(2026, 0, 5)) }),
    deal({ id: "mar-late", isClosed: true, isWon: true, closeDate: new Date(Date.UTC(2026, 2, 28)) }),
    deal({ id: "mar-early", isClosed: true, isWon: true, closeDate: new Date(Date.UTC(2026, 2, 2)) }),
  ]);
  assert.deepEqual(won.groups.map((g) => g.label), ["March 2026", "January 2026"]);
  assert.deepEqual(won.groups[0].deals.map((d) => d.id), ["mar-late", "mar-early"]);
});

test("a closed deal with no close date says so rather than hiding", () => {
  const [, won] = sections([
    deal({ id: "x", isClosed: true, isWon: true, closeDate: null }),
  ]);
  assert.equal(won.count, 1);
  assert.match(won.groups[0].label, /no close date/);
});

test("section totals are the sum of their groups", () => {
  const all = [
    deal({ amount: 1000 }),
    deal({ amount: 2000, stage: "CONTRACT" }),
    deal({ amount: 4000, isClosed: true, isWon: true }),
  ];
  const [pipeline, won] = sections(all);
  assert.equal(pipeline.total, 3000);
  assert.equal(pipeline.groups.reduce((s, g) => s + g.total, 0), 3000);
  assert.equal(won.total, 4000);
});

test("a deal with no amount counts as a deal and adds nothing", () => {
  const [pipeline] = sections([deal({ amount: null }), deal({ amount: 500 })]);
  assert.equal(pipeline.count, 2);
  assert.equal(pipeline.total, 500);
});

// ------------------------------------------------------------------ summary

test("the summary separates open, overdue, recent and all-time", () => {
  const today = new Date(Date.UTC(2026, 8, 16));
  const s = summary(
    [
      deal({ amount: 5000, closeDate: new Date(Date.UTC(2026, 11, 1)) }),
      // Open and already past its close date - the number worth chasing.
      deal({ amount: 3000, closeDate: new Date(Date.UTC(2026, 6, 1)) }),
      deal({ amount: 9000, isClosed: true, isWon: true, closeDate: new Date(Date.UTC(2026, 7, 20)) }),
      deal({ amount: 1000, isClosed: true, isWon: true, closeDate: new Date(Date.UTC(2026, 0, 5)) }),
      deal({ amount: 2000, isClosed: true, isWon: false, closeDate: new Date(Date.UTC(2026, 5, 1)) }),
    ],
    today,
  );

  assert.equal(s.openCount, 2);
  assert.equal(s.openValue, 8000);
  assert.equal(s.overdueCount, 1);
  assert.equal(s.overdueValue, 3000);
  assert.equal(s.wonCount, 2);
  assert.equal(s.wonValue, 10000);
  // Only the August win is inside 90 days of 16 September.
  assert.equal(s.recentWonCount, 1);
  assert.equal(s.recentWonValue, 9000);
  assert.equal(s.lostCount, 1);
  assert.equal(s.winRate, 2 / 3);
  assert.equal(s.averageWon, 5000);
});

test("a win rate with nothing decided is unknown, not zero", () => {
  // Zero would read as "we lose everything", which is a different claim.
  assert.equal(summary([deal()]).winRate, null);
  assert.equal(summary([]).winRate, null);
});

test("nothing at all totals to nothing rather than dividing by zero", () => {
  const s = summary([]);
  assert.equal(s.averageWon, 0);
  assert.equal(s.openValue, 0);
  assert.deepEqual(sections([]).map((x) => x.count), [0, 0, 0]);
});
