import { test } from "node:test";
import assert from "node:assert/strict";
import { planReading, type StoredItem } from "@/lib/commitments/reread";

/**
 * Re-reading a call that more than one consultant committed on.
 *
 * Yazmin hosts. Marcus promised the report; it's on his My work. Yazmin
 * re-reads the transcript. Marcus's commitment must stay exactly as it is.
 */
const HOST = "yazmin";

const stored = (over: Partial<StoredItem>): StoredItem => ({
  id: "x",
  ownerId: HOST,
  status: "PENDING",
  title: "Send Northwind the field mapping",
  quote: "I'll send you the field mapping",
  ...over,
});

const reading = (ownerId: string | null, suggestedTask: string, text: string) => ({
  ownerId,
  suggestedTask,
  text,
});

const marcusReport = stored({
  id: "m1",
  ownerId: "marcus",
  title: "Send Northwind the pipeline report",
  quote: "I'll get the pipeline report over to you",
});

test("the host re-reading leaves a colleague's waiting commitment alone", () => {
  const plan = planReading([marcusReport], [], HOST);
  assert.deepEqual(plan.remove, []);
});

test("...even when the new reading words it differently - no second copy", () => {
  const plan = planReading(
    [marcusReport],
    [reading("marcus", "Share the pipeline report with Northwind", "I'll get the pipeline report over to you")],
    HOST,
  );
  assert.deepEqual(plan.remove, []);
  assert.equal(plan.add.length, 0);
});

test("the host's own waiting items and unidentified ones are what a re-read replaces", () => {
  const plan = planReading(
    [
      stored({ id: "y1" }),
      stored({ id: "u1", ownerId: null, title: "Set up the sandbox", quote: "We'll set up the sandbox" }),
      marcusReport,
    ],
    [reading(HOST, "Send Northwind the field mapping", "I'll send you the field mapping")],
    HOST,
  );
  assert.deepEqual(plan.remove.sort(), ["u1", "y1"]);
  assert.equal(plan.add.length, 1);
});

test("added and dismissed items never come back, whoever's they are", () => {
  const plan = planReading(
    [
      stored({ id: "y1", status: "ACCEPTED" }),
      stored({ id: "m2", ownerId: "marcus", status: "DISMISSED", title: "Book the training", quote: "I'll book the training" }),
    ],
    [
      reading(HOST, "Send Northwind the field mapping", "I'll send you the field mapping"),
      reading("marcus", "Book Northwind's admin training", "I'll book the training"),
    ],
    HOST,
  );
  assert.deepEqual(plan.remove, []);
  assert.equal(plan.add.length, 0);
});

test("a new commitment by a colleague on the re-read call is added to theirs", () => {
  const plan = planReading(
    [marcusReport],
    [reading("marcus", "Rebuild Northwind's BDR dashboard", "I'll rebuild the BDR dashboard")],
    HOST,
  );
  assert.equal(plan.add.length, 1);
  assert.equal(plan.add[0].ownerId, "marcus");
});

test("three consultants on one call: each keeps their own, only the host's is refreshed", () => {
  const plan = planReading(
    [
      stored({ id: "y1", title: "Send the old mapping draft", quote: "I'll send the old draft" }),
      marcusReport,
      stored({ id: "s1", ownerId: "sam", title: "Configure Northwind's BDR profile", quote: "I'll configure the BDR profile" }),
    ],
    [
      reading(HOST, "Send Northwind the final field mapping", "I'll send you the final field mapping"),
      reading("marcus", "Send Northwind the pipeline report", "I'll get the pipeline report over to you"),
      reading("sam", "Configure the BDR profile for Northwind", "I'll configure the BDR profile"),
    ],
    HOST,
  );
  assert.deepEqual(plan.remove, ["y1"]);
  assert.deepEqual(plan.add.map((a) => a.ownerId), [HOST]);
});

test("the same item twice in one reading is added once", () => {
  const plan = planReading(
    [],
    [
      reading(HOST, "Send Northwind the field mapping", "I'll send you the field mapping"),
      reading(HOST, "Send Northwind the field mapping.", "I'll send you the field mapping"),
    ],
    HOST,
  );
  assert.equal(plan.add.length, 1);
});
