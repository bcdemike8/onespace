import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { parseSheet } from "@/lib/csv";
import { mapDeal, recordTypes } from "@/lib/crm/sfdc";
import {
  byDimension,
  byMonth,
  byYear,
  headline,
  seriesFor,
  stackByYear,
  type ReportDeal,
} from "@/lib/crm/report";

/**
 * A revenue report that is merely plausible is worse than none, because
 * people act on it. So these fix the arithmetic, and the last one checks it
 * against the real 1,269 deals.
 */

const deal = (over: Partial<ReportDeal> = {}): ReportDeal => ({
  id: "d1",
  amount: 1000,
  closeDate: new Date("2025-03-15T00:00:00Z"),
  isWon: true,
  isClosed: true,
  platform: "Outreach",
  businessType: null,
  clientName: "Acme",
  ownerName: "Brianna",
  ...over,
});

test("revenue counts won deals and nothing else", () => {
  const stats = headline([
    deal({ amount: 100 }),
    deal({ amount: 900, isWon: false }),
    deal({ amount: 50, isWon: false, isClosed: false }),
  ]);
  assert.equal(stats.revenue, 100);
  assert.equal(stats.wonCount, 1);
  assert.equal(stats.lostCount, 1);
  assert.equal(stats.openCount, 1);
});

test("win rate is of decided deals, so open ones don't drag it down", () => {
  const stats = headline([
    deal(),
    deal({ isWon: false }),
    deal({ isWon: false, isClosed: false }),
    deal({ isWon: false, isClosed: false }),
  ]);
  assert.equal(stats.winRate, 0.5, "1 won of 2 decided, ignoring the 2 open");
});

test("a year with nothing closed still gets a bar", () => {
  const years = byYear([
    deal({ closeDate: new Date("2023-06-01T00:00:00Z") }),
    deal({ closeDate: new Date("2025-06-01T00:00:00Z") }),
  ]);
  assert.deepEqual(years.map((y) => y.label), ["2023", "2024", "2025"]);
  assert.equal(years[1].amount, 0, "2024 is empty, not missing");
});

test("months are always all twelve", () => {
  const months = byMonth([deal()], 2025);
  assert.equal(months.length, 12);
  assert.equal(months[2].amount, 1000, "March");
  assert.equal(months[0].amount, 0);
});

test("years and months use UTC, so a close date can't slip a quarter", () => {
  // 23:30 on 31 December would be the next year in a positive local zone.
  const late = deal({ closeDate: new Date("2025-12-31T23:30:00Z") });
  assert.equal(byYear([late])[0].label, "2025");
  assert.equal(byMonth([late], 2025)[11].amount, 1000);
});

test("the tail folds into Other, so the parts still add up", () => {
  const deals = ["a", "b", "c", "d", "e"].map((n, i) =>
    deal({ clientName: n, amount: 100 - i * 10 }),
  );
  const rows = byDimension(deals, (d) => d.clientName, { top: 2 });
  assert.deepEqual(rows.map((r) => r.label), ["a", "b", "Other (3)"]);
  assert.equal(
    rows.reduce((s, r) => s + r.amount, 0),
    deals.reduce((s, d) => s + (d.amount ?? 0), 0),
    "Other must carry the remainder exactly",
  );
  assert.equal(rows[2].count, 3);
});

test("a missing dimension is named, not dropped", () => {
  const rows = byDimension([deal({ businessType: null })], (d) => d.businessType);
  assert.equal(rows[0].label, "Not recorded");
});

test("a stack has the same series in the same order in every year", () => {
  const stacks = stackByYear(
    [
      deal({ closeDate: new Date("2024-01-01T00:00:00Z"), platform: "Outreach" }),
      deal({ closeDate: new Date("2025-01-01T00:00:00Z"), platform: "Salesloft" }),
    ],
    (d) => d.platform,
    ["Outreach", "Salesloft"],
  );
  assert.deepEqual(stacks.map((s) => s.label), ["2024", "2025"]);
  for (const s of stacks) {
    assert.deepEqual(s.parts.map((p) => p.series), ["Outreach", "Salesloft"]);
  }
  assert.equal(stacks[0].parts[1].amount, 0, "a series absent that year is zero, not missing");
});

test("each year's stack sums to that year's total", () => {
  const deals = [
    deal({ closeDate: new Date("2025-01-01T00:00:00Z"), platform: "Outreach", amount: 300 }),
    deal({ closeDate: new Date("2025-02-01T00:00:00Z"), platform: "Salesloft", amount: 200 }),
  ];
  const [stack] = stackByYear(deals, (d) => d.platform, ["Outreach", "Salesloft"]);
  assert.equal(stack.parts.reduce((s, p) => s + p.amount, 0), stack.total);
});

test("a deal with no amount counts as a deal but adds no revenue", () => {
  const stats = headline([deal({ amount: null }), deal({ amount: 500 })]);
  assert.equal(stats.revenue, 500);
  assert.equal(stats.wonCount, 2);
});

/** The real file, when it is to hand. */
const REAL = "/tmp/sfdc/csv/Opportunity.csv";
test("the real export totals $5,353,925 across 777 won deals", { skip: !existsSync(REAL) }, () => {
  const rows = parseSheet(readFileSync(REAL, "utf8")).rows;
  const types = recordTypes();
  const deals: ReportDeal[] = rows
    .map((r) => mapDeal(r, types))
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .map((d) => ({
      id: d.sfdcId,
      amount: d.amount,
      closeDate: d.closeDate,
      isWon: d.isWon,
      isClosed: d.isClosed,
      platform: d.platform,
      businessType: d.businessType,
      clientName: d.accountKey ?? "?",
      ownerName: d.ownerKey ?? null,
    }));

  const stats = headline(deals);
  assert.equal(stats.wonCount, 777);
  assert.equal(stats.lostCount, 472);
  assert.equal(stats.openCount, 20);
  assert.equal(Math.round(stats.revenue), 5353925);

  // Every won deal is dated, so the year chart accounts for all the revenue.
  const years = byYear(deals);
  assert.equal(
    Math.round(years.reduce((s, y) => s + y.amount, 0)),
    Math.round(stats.revenue),
    "the year chart must account for every pound of the headline",
  );

  // And the platform stack must account for it too.
  const platforms = seriesFor(deals, (d) => d.platform, { noneLabel: "Direct" });
  const stacks = stackByYear(deals, (d) => d.platform, platforms, "Direct");
  assert.equal(
    Math.round(stacks.reduce((s, b) => s + b.parts.reduce((t, p) => t + p.amount, 0), 0)),
    Math.round(stats.revenue),
    "no revenue may fall between the series",
  );
});
