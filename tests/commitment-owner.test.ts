import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aiOwnership,
  buildNameIndex,
  ourActionItems,
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

// What Claude hands back for a recap, and what reaches My work. The email is
// made up but shaped like the real one that went wrong: a numbered list of
// the client's own next steps, with nobody at RevOptics taking anything on.
const reading = (items: { title: string; owner: string | null; ours: boolean }[]) =>
  items.map((i) => ({ ...i, task: i.title, when: null, quote: i.title }));

test("a recap listing only the client's next steps puts nothing on My work", () => {
  const items = reading([
    { title: "Create the Region field on the Account object", owner: "Jordan Lee", ours: false },
    { title: "Troubleshoot the task sync", owner: null, ours: false },
    { title: "Decide whether a historical sync is needed", owner: null, ours: false },
  ]);
  assert.deepEqual(ourActionItems(items, team), []);
});

test("from a mixed recap, only what a named one of ours took on is kept", () => {
  const items = reading([
    { title: "Send Northwind the field mapping doc", owner: "Priya Shah", ours: true },
    { title: "Confirm sandbox API access", owner: "Jordan Lee", ours: false },
    { title: "Build the dashboard", owner: null, ours: true },
  ]);
  const kept = ourActionItems(items, team);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].title, "Send Northwind the field mapping doc");
  assert.equal(kept[0].ownerId, "priya");
  assert.equal(kept[0].ownerUnrecognised, false);
});

test("an item Claude calls ours but names oddly goes to the sender to place", () => {
  const kept = ourActionItems(
    reading([{ title: "Share the checklist", owner: "iPhone", ours: true }]),
    team,
  );
  assert.equal(kept.length, 1);
  assert.equal(kept[0].ownerId, null);
  assert.equal(kept[0].ownerUnrecognised, true);
});
