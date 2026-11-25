import { test } from "node:test";
import assert from "node:assert/strict";
import { mayDecide, takesTasks } from "@/lib/commitments/permissions";

/** Who may add or clear an action item, and which projects take a task. */

const priya = { id: "priya", admin: false };
const sam = { id: "sam", admin: false };
const admin = { id: "boss", admin: true };

test("an owned commitment is its owner's to decide", () => {
  assert.ok(mayDecide({ ownerId: "sam", hostId: "priya" }, sam));
});

test("the host can't add or clear a colleague's commitment from their own call", () => {
  assert.ok(!mayDecide({ ownerId: "sam", hostId: "priya" }, priya));
});

test("an unidentified commitment is the host's to decide, deliberately", () => {
  assert.ok(mayDecide({ ownerId: null, hostId: "priya" }, priya));
  assert.ok(!mayDecide({ ownerId: null, hostId: "priya" }, sam));
});

test("an admin can act on anything", () => {
  assert.ok(mayDecide({ ownerId: "sam", hostId: "priya" }, admin));
  assert.ok(mayDecide({ ownerId: null, hostId: "priya" }, admin));
});

test("only open projects take a task", () => {
  assert.ok(takesTasks("ACTIVE"));
  assert.ok(takesTasks("ON_HOLD"));
  assert.ok(!takesTasks("COMPLETED"));
  assert.ok(!takesTasks("ARCHIVED"));
});
