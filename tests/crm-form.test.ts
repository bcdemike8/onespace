import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bool,
  choice,
  date,
  dateValue,
  decimal,
  defaultProbability,
  int,
  list,
  percent,
  stageFlags,
  text,
} from "@/lib/crm/form";

// ------------------------------------------------------------------- clearing

test("an emptied field clears the value rather than being ignored", () => {
  // Somebody who deletes the contents of Next Step means to delete the next
  // step. A form that quietly keeps the old one can't be trusted to be
  // showing the truth.
  assert.equal(text(""), null);
  assert.equal(text("   "), null);
  assert.equal(text("Send the SOW"), "Send the SOW");
});

test("a field that isn't in the form at all is null, not a crash", () => {
  assert.equal(text(null), null);
  assert.equal(int(null), null);
  assert.equal(decimal(null), null);
  assert.equal(date(null), null);
  assert.equal(bool(null), false);
});

test("whitespace is trimmed, so a stray space isn't a different value", () => {
  assert.equal(text("  Outreach  "), "Outreach");
});

// -------------------------------------------------------------------- numbers

test("money is read the way people type it", () => {
  // Refusing "$6,300.00" would be technically correct and would waste
  // somebody's afternoon.
  assert.equal(decimal("$6,300.00"), 6300);
  assert.equal(decimal("6300"), 6300);
  assert.equal(decimal(" 1,234.56 "), 1234.56);
  assert.equal(decimal("nonsense"), null);
  assert.equal(decimal(""), null);
});

test("zero is zero, not empty", () => {
  // Deal Length is 0 on a same-day close. A truthiness check anywhere here
  // would turn a real zero into a blank.
  assert.equal(int("0"), 0);
  assert.equal(decimal("0"), 0);
  assert.equal(percent("0"), 0);
});

test("a negative or absurd percentage is clamped rather than refused", () => {
  assert.equal(percent("120"), 100);
  assert.equal(percent("-5"), 0);
  assert.equal(percent("60"), 60);
  assert.equal(percent(""), null);
});

// ---------------------------------------------------------------------- dates

test("a date input is read as UTC, so a close date can't slip a quarter", () => {
  assert.equal(date("2026-07-14")?.toISOString(), "2026-07-14T00:00:00.000Z");
  assert.equal(date("not a date"), null);
  assert.equal(date(""), null);
});

test("a date makes the round trip back into the input unchanged", () => {
  assert.equal(dateValue(date("2026-12-31")), "2026-12-31");
  assert.equal(dateValue(null), "");
});

// ------------------------------------------------------------------ checkboxes

test("an unchecked box is absent from the form, which is false", () => {
  assert.equal(bool("on"), true);
  assert.equal(bool(null), false);
  assert.equal(bool("off"), false);
});

// --------------------------------------------------------------------- choices

test("a tampered select falls back rather than writing a bad enum", () => {
  const stages = ["QUALIFICATION", "CLOSED_WON"] as const;
  assert.equal(choice("CLOSED_WON", stages, "QUALIFICATION"), "CLOSED_WON");
  assert.equal(choice("DROP TABLE", stages, "QUALIFICATION"), "QUALIFICATION");
  assert.equal(choice(null, stages, "QUALIFICATION"), "QUALIFICATION");
});

// ----------------------------------------------------------------------- lists

test("a comma-separated list is split, trimmed and deduplicated", () => {
  assert.deepEqual(list("Outreach, Salesloft , Outreach"), ["Outreach", "Salesloft"]);
  assert.deepEqual(list(""), []);
  assert.deepEqual(list(" , , "), []);
});

// ------------------------------------------------------------- derived flags

test("won and closed follow from the stage rather than being asked for", () => {
  // Salesforce asked once and then had to keep three fields agreeing forever.
  // The export has deals whose stage says Closed Won and whose IsWon says
  // false, and every one of them was somebody's afternoon.
  assert.deepEqual(stageFlags("CLOSED_WON"), { isWon: true, isClosed: true });
  assert.deepEqual(stageFlags("CLOSED_LOST"), { isWon: false, isClosed: true });
  assert.deepEqual(stageFlags("PROPOSAL"), { isWon: false, isClosed: false });
});

test("a closed deal's probability is decided, an open one's is a judgement", () => {
  assert.equal(defaultProbability("CLOSED_WON"), 100);
  assert.equal(defaultProbability("CLOSED_LOST"), 0);
  // Left null on purpose: the form should not invent a forecast.
  assert.equal(defaultProbability("PROPOSAL"), null);
});
