import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COLUMNS,
  asBand,
  asDirection,
  choicesFor,
  filterDeals,
  sortDeals,
  toCsv,
} from "@/lib/crm/deal-report";
import type { PipelineDeal } from "@/lib/crm/pipeline";

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

const names = (ds: PipelineDeal[]) => ds.map((d) => d.name);

// -------------------------------------------------------------------- sorting

test("money sorts as money, not as text", () => {
  // The bug this exists to prevent: "$9,000" above "$10,000".
  const ds = [
    deal({ name: "nine", amount: 9000 }),
    deal({ name: "ten", amount: 10000 }),
    deal({ name: "two", amount: 2000 }),
  ];
  assert.deepEqual(names(sortDeals(ds, "amount", "desc")), ["ten", "nine", "two"]);
  assert.deepEqual(names(sortDeals(ds, "amount", "asc")), ["two", "nine", "ten"]);
});

test("blanks sort last whichever way the column runs", () => {
  // A spreadsheet does this, and it is right: a deal with no close date is
  // not the oldest deal, and one with no amount is not the cheapest.
  const ds = [
    deal({ name: "blank", amount: null }),
    deal({ name: "small", amount: 100 }),
    deal({ name: "big", amount: 9000 }),
  ];
  assert.deepEqual(names(sortDeals(ds, "amount", "desc")), ["big", "small", "blank"]);
  assert.deepEqual(names(sortDeals(ds, "amount", "asc")), ["small", "big", "blank"]);
});

test("stage sorts by the process, not the alphabet", () => {
  // Alphabetically: Contract, Discovery, Proposal, Qualification - which
  // reads as a pipeline running backwards.
  const ds = [
    deal({ name: "contract", stage: "CONTRACT" }),
    deal({ name: "qualification", stage: "QUALIFICATION" }),
    deal({ name: "proposal", stage: "PROPOSAL" }),
  ];
  assert.deepEqual(names(sortDeals(ds, "stage", "asc")), [
    "qualification",
    "proposal",
    "contract",
  ]);
});

test("a tied sort has a stable order rather than a database's whim", () => {
  // 357 won deals sorted by owner with no tie-break reshuffle on every
  // refresh, and a report that moves under you is one nobody trusts.
  const ds = [
    deal({ name: "b", ownerName: "Same", closeDate: new Date(Date.UTC(2026, 0, 1)) }),
    deal({ name: "a", ownerName: "Same", closeDate: new Date(Date.UTC(2026, 0, 1)) }),
    deal({ name: "c", ownerName: "Same", closeDate: new Date(Date.UTC(2026, 5, 1)) }),
  ];
  const once = names(sortDeals(ds, "owner", "asc"));
  const twice = names(sortDeals([...ds].reverse(), "owner", "asc"));
  assert.deepEqual(once, twice);
  // Newest close first inside the tie, then by name.
  assert.deepEqual(once, ["c", "a", "b"]);
});

test("text sorts without case deciding it", () => {
  const ds = [deal({ name: "apple" }), deal({ name: "Banana" }), deal({ name: "cherry" })];
  assert.deepEqual(names(sortDeals(ds, "name", "asc")), ["apple", "Banana", "cherry"]);
});

test("sorting never loses or duplicates a row", () => {
  const ds = [deal({ name: "a" }), deal({ name: "b", amount: null }), deal({ name: "c" })];
  for (const col of COLUMNS) {
    for (const dir of ["asc", "desc"] as const) {
      assert.equal(sortDeals(ds, col.key, dir).length, 3, `${col.key} ${dir}`);
    }
  }
});

test("each column says which way a first click should sort it", () => {
  // Money and dates want biggest and most recent first; names want A-Z.
  // One default for all of them means half need two clicks to say anything.
  assert.equal(COLUMNS.find((c) => c.key === "amount")?.first, "desc");
  assert.equal(COLUMNS.find((c) => c.key === "close")?.first, "desc");
  assert.equal(COLUMNS.find((c) => c.key === "name")?.first, "asc");
});

test("a tampered direction falls back rather than breaking the sort", () => {
  assert.equal(asDirection("asc"), "asc");
  assert.equal(asDirection("sideways"), "desc");
  assert.equal(asDirection(undefined), "desc");
});

// ------------------------------------------------------------------ filtering

const MIXED = [
  deal({ name: "open", clientName: "Acme", partnerName: "Outreach", ownerName: "Brianna" }),
  deal({
    name: "won-recent",
    isWon: true,
    isClosed: true,
    stage: "CLOSED_WON",
    clientName: "Globex",
    partnerName: null,
    closeDate: new Date(Date.UTC(2026, 8, 1)),
  }),
  deal({
    name: "won-old",
    isWon: true,
    isClosed: true,
    stage: "CLOSED_WON",
    clientName: "Acme",
    closeDate: new Date(Date.UTC(2026, 0, 5)),
  }),
  deal({ name: "lost", isClosed: true, stage: "CLOSED_LOST", clientName: "Globex" }),
];

const TODAY = new Date(Date.UTC(2026, 8, 16));

test("a band shows only its own deals", () => {
  assert.deepEqual(names(filterDeals(MIXED, { band: "PIPELINE" }, TODAY)), ["open"]);
  assert.deepEqual(names(filterDeals(MIXED, { band: "WON" }, TODAY)), ["won-recent", "won-old"]);
  assert.deepEqual(names(filterDeals(MIXED, { band: "LOST" }, TODAY)), ["lost"]);
  assert.equal(filterDeals(MIXED, { band: "all" }, TODAY).length, 4);
});

test("the recent-wins filter counts back from today, not from the year", () => {
  assert.deepEqual(
    names(filterDeals(MIXED, { band: "WON", withinDays: 90 }, TODAY)),
    ["won-recent"],
  );
});

test("filters stack, and match the words the table shows", () => {
  assert.deepEqual(
    names(filterDeals(MIXED, { band: "WON", account: "Acme" }, TODAY)),
    ["won-old"],
  );
  // "Direct" is what a deal with no partner reads as on screen, so it is
  // what the filter matches on too.
  assert.deepEqual(names(filterDeals(MIXED, { type: "Direct" }, TODAY)).sort(), [
    "lost",
    "won-old",
    "won-recent",
  ]);
});

test("a filter matching nothing returns nothing rather than everything", () => {
  assert.deepEqual(filterDeals(MIXED, { account: "Nobody Ltd" }, TODAY), []);
});

test("the dropdowns offer exactly the values present", () => {
  assert.deepEqual(choicesFor(MIXED, "account"), ["Acme", "Globex"]);
  assert.deepEqual(choicesFor(MIXED, "type"), ["Direct", "Outreach"]);
  // Stage choices run in process order, not alphabetically.
  assert.deepEqual(choicesFor(MIXED, "stage"), ["PROPOSAL", "CLOSED_WON", "CLOSED_LOST"]);
});

test("band names survive the round trip through the URL", () => {
  assert.equal(asBand("pipeline"), "PIPELINE");
  assert.equal(asBand("won"), "WON");
  assert.equal(asBand("nonsense"), "all");
});

// ------------------------------------------------------------------------ CSV

test("a comma in a deal name doesn't split the row", () => {
  // The part everybody skips until a client is called "Autit, Inc".
  const csv = toCsv([deal({ name: 'Autit, Inc — "DS" deal', clientName: "Autit, Inc" })]);
  const lines = csv.split("\r\n");
  assert.equal(lines.length, 2);
  assert.match(lines[1], /^"Autit, Inc — ""DS"" deal","Autit, Inc"/);
});

test("dates are ISO so a spreadsheet sorts them as dates", () => {
  const csv = toCsv([deal({ closeDate: new Date(Date.UTC(2026, 10, 30)) })]);
  assert.match(csv, /2026-11-30/);
});

test("a blank stays blank rather than becoming the word null", () => {
  const csv = toCsv([deal({ amount: null, ownerName: null, closeDate: null })]);
  assert.doesNotMatch(csv, /null|undefined|NaN/);
});

test("the CSV says whether each deal is open, won or lost", () => {
  const csv = toCsv(MIXED);
  assert.match(csv, /,Open,/);
  assert.match(csv, /,Won,/);
  assert.match(csv, /,Lost,/);
});
