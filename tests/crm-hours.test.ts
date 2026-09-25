import test from "node:test";
import assert from "node:assert/strict";
import { dealHours, hoursLabel, hoursNote } from "../src/lib/crm/hours";

const base = {
  hoursSold: null,
  projectBudgetHours: null,
  amount: null,
  loggedMinutes: null,
};

test("the deal's own figure is what was sold, and wins", () => {
  const h = dealHours({ ...base, hoursSold: 40, projectBudgetHours: 55 });
  assert.equal(h.hours, 40);
  assert.equal(h.fromProject, false);
});

test("with nothing on the deal, the project's budget stands in - and says so", () => {
  const h = dealHours({ ...base, projectBudgetHours: 20 });
  assert.equal(h.hours, 20);
  assert.equal(h.fromProject, true);
});

test("no hours anywhere reads as nothing recorded, not as zero", () => {
  assert.equal(dealHours(base).hours, null);
  assert.equal(dealHours({ ...base, hoursSold: 0 }).hours, null);
});

test("the rate is the deal divided by the hours", () => {
  assert.equal(dealHours({ ...base, hoursSold: 40, amount: 7000 }).rate, 175);
});

test("a rate needs both halves, and zero hours must not divide", () => {
  assert.equal(dealHours({ ...base, hoursSold: 40 }).rate, null);
  assert.equal(dealHours({ ...base, amount: 7000 }).rate, null);
  assert.equal(dealHours({ ...base, hoursSold: 0, amount: 7000 }).rate, null);
});

test("logged minutes come back as hours, to the quarter", () => {
  assert.equal(dealHours({ ...base, loggedMinutes: 150 }).logged, 2.5);
  assert.equal(dealHours({ ...base, loggedMinutes: 20 }).logged, 0.25);
  assert.equal(dealHours({ ...base, loggedMinutes: 0 }).logged, null);
});

test("whole hours don't grow a decimal point", () => {
  assert.equal(hoursLabel(40), "40");
  assert.equal(hoursLabel(7.5), "7.5");
});

test("delivery progress is the note when there is any, the rate otherwise", () => {
  assert.equal(
    hoursNote(dealHours({ ...base, hoursSold: 20, amount: 7000, loggedMinutes: 300 })),
    "5 logged · 25% used",
  );
  assert.equal(
    hoursNote(dealHours({ ...base, hoursSold: 40, amount: 7000 })),
    "$175/hour",
  );
  assert.equal(hoursNote(dealHours(base)), null);
});

test("over-budget delivery is reported, not clamped", () => {
  const note = hoursNote(
    dealHours({ ...base, hoursSold: 10, loggedMinutes: 900 }),
  );
  assert.equal(note, "15 logged · 150% used");
});
