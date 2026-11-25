import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aiOwnership,
  buildNameIndex,
  recapOwnership,
} from "@/lib/commitments/owner";

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

test("Claude's item goes to the named owner when they can be placed", () => {
  assert.deepEqual(aiOwnership(team, "Priya Shah"), {
    ownerId: "priya",
    ownerUnrecognised: false,
  });
});

test("Claude's item with an owner nobody matches goes to the host, marked", () => {
  assert.deepEqual(aiOwnership(team, "iPhone"), {
    ownerId: null,
    ownerUnrecognised: true,
  });
  assert.deepEqual(aiOwnership(team, "Sam"), {
    ownerId: null,
    ownerUnrecognised: true,
  });
});

test("Claude's item with no owner at all is dropped", () => {
  assert.equal(aiOwnership(team, null), null);
  assert.equal(aiOwnership(team, "  "), null);
});

test("a recap line naming nobody belongs to whoever sent the recap", () => {
  assert.deepEqual(recapOwnership(team, null, "dana"), {
    ownerId: "dana",
    ownerUnrecognised: false,
  });
});

test("a recap line naming one of ours belongs to them", () => {
  assert.deepEqual(recapOwnership(team, "Priya", "dana"), {
    ownerId: "priya",
    ownerUnrecognised: false,
  });
});

test("a recap line naming the client is the client's, and isn't offered", () => {
  assert.equal(recapOwnership(team, "Jordan", "dana"), null);
});
