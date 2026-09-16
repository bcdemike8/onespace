import { test } from "node:test";
import assert from "node:assert/strict";
import { group, flatten, total, type ReportRow } from "@/lib/crm/reports";
import {
  dealType,
  fiscalPeriodOf,
  fiscalYearRange,
  groupByMonth,
  type ReportDeal,
} from "@/lib/crm/report";
import {
  dashboardTitle,
  rangeFromParams,
  ranges,
  typesFromParams,
} from "@/lib/crm/dashboard-filters";
import { CLOSED_WON_BY_MONTH, REVENUE_BY_TYPE, reportBySlug } from "@/lib/crm/report-defs";

/**
 * Checked against the two exports RevOptics sent, which are the only
 * statement of what these reports are supposed to say.
 */

const deal = (over: Partial<ReportDeal> = {}): ReportDeal => ({
  id: Math.random().toString(36).slice(2),
  amount: 1000,
  closeDate: new Date(Date.UTC(2026, 0, 1)),
  isWon: true,
  isClosed: true,
  platform: null,
  businessType: null,
  clientName: "Acme",
  ownerName: "RevOptics Admin",
  ...over,
});

// ------------------------------------------------------- Salesforce's Type

test("Type is put back together from the two fields it was split into", () => {
  // The import split one picklist in two. Outreach and Salesloft went to
  // platform; New Business went to businessType. Neither deal carried both,
  // which is what makes the split reversible.
  assert.equal(dealType(deal({ platform: "Outreach" })), "Outreach");
  assert.equal(dealType(deal({ businessType: "New Business" })), "New Business");
  assert.equal(dealType(deal()), "Not recorded");
});

test("a deal carrying both prefers the platform, as the dashboard reads it", () => {
  assert.equal(
    dealType(deal({ platform: "Salesloft", businessType: "Existing Business" })),
    "Salesloft",
  );
});

// ------------------------------------------------------------ fiscal period

test("the fiscal period is the calendar quarter, as the export says", () => {
  // "Current FY (1/1/2026 to 12/31/2026)" - the fiscal year is the calendar
  // year here, so Q1 is January to March.
  assert.equal(fiscalPeriodOf(deal({ closeDate: new Date(Date.UTC(2026, 0, 31)) })), "Q1-2026");
  assert.equal(fiscalPeriodOf(deal({ closeDate: new Date(Date.UTC(2026, 2, 31)) })), "Q1-2026");
  assert.equal(fiscalPeriodOf(deal({ closeDate: new Date(Date.UTC(2026, 3, 1)) })), "Q2-2026");
  assert.equal(fiscalPeriodOf(deal({ closeDate: new Date(Date.UTC(2026, 11, 31)) })), "Q4-2026");
  assert.equal(fiscalPeriodOf(deal({ closeDate: null })), null);
});

test("a fiscal year runs to the last instant of December", () => {
  const { from, to } = fiscalYearRange(2026);
  assert.equal(from.toISOString(), "2026-01-01T00:00:00.000Z");
  // A deal closing on 31 December is inside the year. An exclusive bound at
  // midnight would silently drop it.
  assert.equal(to.toISOString(), "2026-12-31T23:59:59.999Z");
});

// -------------------------------------------------------------- month bands

test("every month in range appears, and every series in every month", () => {
  const deals = [
    deal({ closeDate: new Date(Date.UTC(2026, 0, 15)), platform: "Outreach", amount: 90000 }),
    deal({ closeDate: new Date(Date.UTC(2026, 2, 3)), businessType: "New Business", amount: 33000 }),
  ];
  const bands = groupByMonth(
    deals,
    new Date(Date.UTC(2026, 0, 1)),
    new Date(Date.UTC(2026, 2, 31)),
    dealType,
    ["Outreach", "New Business"],
  );

  // February had nothing. Leaving it out would make the spacing lie.
  assert.deepEqual(bands.map((b) => b.label), ["Jan 26", "Feb 26", "Mar 26"]);
  assert.equal(bands[1].total, 0);

  // Every band carries every series, in the same order, so a colour means
  // the same thing across the chart.
  for (const band of bands) {
    assert.deepEqual(band.parts.map((p) => p.series), ["Outreach", "New Business"]);
  }
  assert.equal(bands[0].parts[0].amount, 90000);
  assert.equal(bands[0].parts[1].amount, 0);
  assert.equal(bands[2].parts[1].amount, 33000);
});

test("a deal outside the range is not counted", () => {
  const bands = groupByMonth(
    [deal({ closeDate: new Date(Date.UTC(2025, 11, 31)), amount: 5000 })],
    new Date(Date.UTC(2026, 0, 1)),
    new Date(Date.UTC(2026, 0, 31)),
    dealType,
    ["Not recorded"],
  );
  assert.equal(bands.length, 1);
  assert.equal(bands[0].total, 0);
});

test("only won deals reach the chart", () => {
  const bands = groupByMonth(
    [deal({ isWon: false, amount: 99999 })],
    new Date(Date.UTC(2026, 0, 1)),
    new Date(Date.UTC(2026, 0, 31)),
    dealType,
    ["Not recorded"],
  );
  assert.equal(bands[0].total, 0);
});

// ------------------------------------------------------------ the grouping

const row = (values: Record<string, string>, amount: number): ReportRow => ({
  id: `${values.name}-${amount}`,
  amount,
  values,
});

const ROWS = [
  row({ closeMonth: "1/1/2026", monthKey: "2026-01", type: "New Business", name: "Wrike" }, 4840),
  row({ closeMonth: "1/1/2026", monthKey: "2026-01", type: "New Business", name: "DailyPay" }, 12240),
  row({ closeMonth: "1/1/2026", monthKey: "2026-01", type: "Outreach", name: "Introhive" }, 5000),
  row({ closeMonth: "2/1/2026", monthKey: "2026-02", type: "Outreach", name: "ServiceNow" }, 7000),
];

test("groups carry their own sum, count and average", () => {
  const groups = group(ROWS, CLOSED_WON_BY_MONTH.levels);

  assert.deepEqual(groups.map((g) => g.label), ["1/1/2026", "2/1/2026"]);
  assert.equal(groups[0].sum, 22080);
  assert.equal(groups[0].count, 3);

  const [newBusiness, outreach] = groups[0].groups;
  assert.equal(newBusiness.label, "New Business");
  assert.equal(newBusiness.sum, 17080);
  assert.equal(newBusiness.average, 8540);
  assert.equal(outreach.sum, 5000);
});

test("only the innermost group lists rows", () => {
  const groups = group(ROWS, CLOSED_WON_BY_MONTH.levels);
  // An outer group that also held rows would print every deal twice.
  assert.equal(groups[0].rows.length, 0);
  assert.equal(groups[0].groups[0].rows.length, 2);
  assert.equal(flatten(groups[0]).length, 3);
});

test("a month grouping sorts by date, not by the text of its label", () => {
  // "1/1/2026" sorts before "12/1/2025" as a string, which would put this
  // January ahead of last December.
  const rows = [
    row({ closeMonth: "12/1/2025", monthKey: "2025-12", type: "Outreach", name: "a" }, 1),
    row({ closeMonth: "1/1/2026", monthKey: "2026-01", type: "Outreach", name: "b" }, 1),
  ];
  assert.deepEqual(
    group(rows, CLOSED_WON_BY_MONTH.levels).map((g) => g.label),
    ["12/1/2025", "1/1/2026"],
  );
});

test("three levels nest three deep", () => {
  const rows = [
    row({ fiscalPeriod: "Q1-2026", type: "New Business", accountName: "DailyPay", name: "Jan" }, 12240),
    row({ fiscalPeriod: "Q1-2026", type: "New Business", accountName: "DailyPay", name: "Feb" }, 12240),
    row({ fiscalPeriod: "Q1-2026", type: "New Business", accountName: "Wrike", name: "Jan" }, 4840),
  ];
  const groups = group(rows, REVENUE_BY_TYPE.levels);
  assert.equal(groups[0].groups[0].groups.length, 2);
  const dailyPay = groups[0].groups[0].groups.find((g) => g.label === "DailyPay")!;
  assert.equal(dailyPay.sum, 24480);
  assert.equal(dailyPay.average, 12240);
});

test("the grand total counts every row once", () => {
  const t = total(ROWS);
  assert.equal(t.sum, 29080);
  assert.equal(t.count, 4);
  assert.equal(t.sum, group(ROWS, CLOSED_WON_BY_MONTH.levels).reduce((s, g) => s + g.sum, 0));
});

test("an empty report totals to nothing rather than dividing by zero", () => {
  assert.deepEqual(total([]), { sum: 0, count: 0, average: 0 });
  assert.deepEqual(group([], CLOSED_WON_BY_MONTH.levels), []);
});

// ------------------------------------------------------------- the filters

test("the dashboard defaults to this fiscal year", () => {
  const today = new Date(Date.UTC(2026, 8, 16));
  const range = rangeFromParams({}, today);
  assert.equal(range.key, "fy");
  assert.equal(range.from.toISOString().slice(0, 10), "2026-01-01");
  assert.equal(range.label, "FY2026");
});

test("an unknown range falls back rather than showing nothing", () => {
  assert.equal(rangeFromParams({ range: "nonsense" }, new Date(Date.UTC(2026, 8, 16))).key, "fy");
});

test("the title states the filters, because it is what gets screenshotted", () => {
  const [fy] = ranges(new Date(Date.UTC(2026, 8, 16)));
  assert.equal(dashboardTitle(fy, []), "RevOptics — All FY2026");
  assert.equal(dashboardTitle(fy, ["Outreach"]), "RevOptics — Outreach FY2026");
});

test("types come out of the URL as a list", () => {
  assert.deepEqual(typesFromParams({ type: "Outreach,New Business" }), ["Outreach", "New Business"]);
  assert.deepEqual(typesFromParams({}), []);
  assert.deepEqual(typesFromParams({ type: " , " }), []);
});

test("both reports are reachable by the slug the dashboard links to", () => {
  assert.equal(reportBySlug("revenue-by-type")?.name, "Revenue by Type");
  assert.equal(reportBySlug("closed-won-by-month")?.name, "Closed Won by Month");
  assert.equal(reportBySlug("made-up"), undefined);
});

test("the report columns are the export's columns, in the export's order", () => {
  // Transcribed from the header row of Closed_Won_by_Month.xlsx.
  assert.deepEqual(
    CLOSED_WON_BY_MONTH.columns.map((c) => c.label),
    [
      "Opportunity Owner",
      "Opportunity Name",
      "Amount",
      "Close Date",
      "Project Completion Date",
      "Stage",
      "Created Date",
      "Product Name",
      "Subcontract",
      "Account Name",
      "Billing Contact",
    ],
  );
  assert.deepEqual(
    REVENUE_BY_TYPE.columns.map((c) => c.label),
    [
      "Opportunity Name",
      "Lead Source",
      "Amount",
      "Close Date",
      "Next Step",
      "Stage",
      "Probability (%)",
      "Age",
      "Created Date",
      "Opportunity Owner",
    ],
  );
});

test("the filter block reads the way Salesforce printed it", () => {
  const lines = CLOSED_WON_BY_MONTH.filters({
    from: new Date(Date.UTC(2026, 0, 1)),
    to: new Date(Date.UTC(2026, 7, 31)),
    types: ["New Business", "Outreach", "Salesloft", "Apollo", "ZoomInfo (SL)"],
  });
  assert.equal(lines[0], "Date Field: Close Date equals Custom (1/1/2026 to 8/31/2026)");
  assert.equal(lines[2], "Opportunity Status: Closed Won");
  assert.equal(lines[4], "Type equals New Business,Outreach,Salesloft,Apollo,ZoomInfo (SL)");
});
