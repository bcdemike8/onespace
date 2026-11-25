import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreCase } from "../scripts/eval-score";

/**
 * The accuracy script's scoring, checked without Claude: deadlines are
 * compared as actual dates, not just "is there one".
 */
const SAID = new Date("2026-11-16T15:00:00Z"); // a Monday

const two = [
  { owner: "priya", about: ["sequence"], due: "2026-11-17" },
  { owner: "priya", about: ["recommendation"], due: "2026-11-20" },
];
const found = (title: string, when: string | null, ownerId = "priya") => ({ ownerId, title, task: title, when });

test("two deliverables with the right dates both score as correct", () => {
  const s = scoreCase(two, [found("Send the updated sequences", "tomorrow"), found("Send the reporting recommendations", "by Friday")], SAID);
  assert.equal(s.correct, 2);
  assert.equal(s.wrongDeadline, 0);
});

test("the same two with their dates swapped are two wrong deadlines", () => {
  const s = scoreCase(two, [found("Send the updated sequences", "by Friday"), found("Send the reporting recommendations", "tomorrow")], SAID);
  assert.equal(s.correct, 0);
  assert.equal(s.wrongDeadline, 2);
});

test("a date on the wrong day is wrong, even though there is one", () => {
  const s = scoreCase([{ owner: "priya", about: ["report"], due: "2026-11-20" }], [found("Send the report", "by Thursday")], SAID);
  assert.equal(s.wrongDeadline, 1);
});

test("a date where none was promised is wrong, and so is none where one was", () => {
  assert.equal(scoreCase([{ owner: "priya", about: ["guide"] }], [found("Write the guide", "tomorrow")], SAID).wrongDeadline, 1);
  assert.equal(scoreCase([{ owner: "priya", about: ["guide"], due: "2026-11-17" }], [found("Write the guide", null)], SAID).wrongDeadline, 1);
});

test("wrong owner, extra items and missed items are each counted", () => {
  const s = scoreCase(
    [{ owner: "sam", about: ["import"] }, { owner: "priya", about: ["playbook"] }],
    [found("Run the import", null, "priya"), found("Book a training", null)],
    SAID,
  );
  assert.equal(s.wrongOwner, 1);
  assert.equal(s.falsePositives, 1);
  assert.equal(s.falseNegatives, 1);
});
