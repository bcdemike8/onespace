import { test } from "node:test";
import assert from "node:assert/strict";
import { buildNameIndex } from "@/lib/commitments/owner";

/**
 * Whose action item is it - the rules that put each one on the right
 * consultant's My work, whoever hosted the call.
 */
const team = buildNameIndex([
  { id: "dana", name: "Dana Whitfield-Ross" },
  { id: "priya", name: "Priya Shah" },
  { id: "sam1", name: "Sam Ortiz" },
  { id: "sam2", name: "Sam Lee" },
]);

test("a full name, or first and last, finds the person", () => {
  assert.equal(team.match("Priya Shah"), "priya");
  assert.equal(team.match("priya shah"), "priya");
  assert.equal(team.match("Dana Whitfield-Ross"), "dana");
  assert.equal(team.match("Priya Shah (Guest)"), "priya");
});

test("a first name only one of ours has is enough", () => {
  assert.equal(team.match("Priya"), "priya");
  assert.equal(team.match("Dana"), "dana");
});

test("a first name and the start of the surname is enough", () => {
  assert.equal(team.match("Priya S"), "priya");
  assert.equal(team.match("Dana Whit"), "dana");
});

test("a first name with somebody else's surname is not ours", () => {
  assert.equal(team.match("Priya Brown"), undefined);
});

test("a customer sharing one of our first names isn't taken for ours by surname", () => {
  assert.equal(team.match("Sam Brown"), undefined);
});

test("a first name two of ours share matches nobody rather than guessing", () => {
  assert.equal(team.match("Sam"), null);
  assert.equal(team.match("Sam Ortiz"), "sam1");
});

test("a name that isn't anybody's, or no name, is nobody", () => {
  assert.equal(team.match("iPhone"), undefined);
  assert.equal(team.match("Conference Room"), undefined);
  assert.equal(team.match(""), undefined);
  assert.equal(team.match(null), undefined);
});
