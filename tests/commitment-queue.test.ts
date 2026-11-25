import { test } from "node:test";
import assert from "node:assert/strict";
import {
  QUEUE_FLOOR,
  groupQueue,
  queueCount,
  queueStart,
  sameUndertaking,
  withoutDecided,
  type QueueRecord,
} from "@/lib/commitments/queue";
import { parseWindow } from "@/lib/window";

/**
 * "You said you'd do this" on My work: how far back it reaches, which rows
 * are the same thing, and how they're grouped.
 */

const fortnight = parseWindow("14");

test("the window is the last fourteen days", () => {
  const now = new Date("2026-12-20T15:00:00Z");
  assert.equal(
    queueStart(fortnight, now).toISOString(),
    new Date(now.getTime() - 14 * 86_400_000).toISOString(),
  );
});

test("nothing before the clean start on 16 November is offered", () => {
  // On 25 November fourteen days reaches back to the 11th; the floor wins.
  const now = new Date("2026-11-25T15:00:00Z");
  assert.equal(queueStart(fortnight, now).toISOString(), QUEUE_FLOOR.toISOString());
  assert.equal(QUEUE_FLOOR.toISOString(), "2026-11-16T06:00:00.000Z");
});

test("once the window has moved past the floor, the floor stops mattering", () => {
  const now = new Date("2026-12-01T12:00:00Z");
  assert.ok(queueStart(fortnight, now) > QUEUE_FLOOR);
});

test("a reworded title with the same quote is the same undertaking", () => {
  assert.ok(
    sameUndertaking(
      { title: "Send Acme the updated sequence spec", quote: "I'll send you the updated sequence spec by Friday" },
      { title: "Share the revised sequence specification with Acme", quote: "I'll send you the updated sequence spec by Friday." },
    ),
  );
});

test("the same words in another order is the same undertaking", () => {
  assert.ok(
    sameUndertaking({ title: "Send the spec to Acme" }, { title: "Send Acme the spec" }),
  );
});

test("two promises in one sentence stay two", () => {
  const quote = "I'll send the deck and book the admin training";
  assert.ok(
    !sameUndertaking(
      { title: "Send Acme the deck", quote },
      { title: "Book Acme the admin training", quote },
    ),
  );
});

test("similar but different deliverables stay separate", () => {
  assert.ok(
    !sameUndertaking(
      { title: "Send Acme the sequence spec" },
      { title: "Send Acme the sequence results" },
    ),
  );
});

test("something already added from a call isn't offered again from the recap", () => {
  const recapItem = record({
    title: "Send Acme the updated sequence spec",
    quote: "I'll send over the updated sequence spec by Friday",
  });
  const other = record({ title: "Book the admin training for Acme" });
  const left = withoutDecided(
    [recapItem, other],
    [{ title: "Send the updated sequence spec to Acme", quote: "I'll get you the spec", projectId: "p-acme" }],
  );
  assert.deepEqual(left.map((r) => r.title), ["Book the admin training for Acme"]);
});

test("a decision on one project doesn't hide a like-named item on another", () => {
  const left = withoutDecided(
    [record({ title: "Send the kickoff deck", projectId: "p-beta" })],
    [{ title: "Send the kickoff deck", quote: "x", projectId: "p-acme" }],
  );
  assert.equal(left.length, 1);
});

test("a call and its recap, worded a little differently, are one promise", () => {
  assert.ok(
    sameUndertaking(
      { title: "Send Northwind the updated sequences" },
      { title: "Send Northwind the updated sequence templates" },
    ),
  );
});

test("two deliverables from one sentence stay two, though the titles share the client and verb", () => {
  const quote = "I'll send the updated sequences tomorrow and the reporting recommendations by Friday.";
  assert.ok(
    !sameUndertaking(
      { title: "Send Northwind the updated sequences", quote },
      { title: "Send Northwind the reporting recommendations", quote },
    ),
  );
});

test("one word apart in what's delivered is two promises", () => {
  assert.ok(
    !sameUndertaking(
      { title: "Send Northwind the sequence spec" },
      { title: "Send Northwind the sequence results" },
    ),
  );
});

test("different undertakings are different", () => {
  assert.ok(
    !sameUndertaking(
      { title: "Send Acme the sequence spec", quote: "I'll send the spec" },
      { title: "Book the admin training session", quote: "I'll book the training" },
    ),
  );
});

const projects = new Map([
  ["p-acme", { name: "Implementation", clientName: "Acme" }],
  ["p-beta", { name: "Onboarding", clientName: "Beta Co" }],
]);

let n = 0;
function record(over: Partial<QueueRecord>): QueueRecord {
  n += 1;
  return {
    id: `c${n}`,
    title: `Item ${n}`,
    quote: `Quote ${n}`,
    detail: null,
    source: "AI_SUMMARY",
    dueDate: null,
    dueStated: false,
    saidAt: new Date("2026-11-20T15:00:00Z"),
    originKey: "m:call-1",
    originLabel: "Acme weekly",
    originHref: "/meetings/call-1",
    projectId: "p-acme",
    ...over,
  };
}

test("items are grouped by project, with the unfiled group last", () => {
  const groups = groupQueue(
    [
      record({ projectId: null }),
      record({ projectId: "p-beta" }),
      record({ projectId: "p-acme" }),
    ],
    projects,
  );
  assert.deepEqual(
    groups.map((g) => g.projectId),
    ["p-acme", "p-beta", null],
  );
  assert.equal(groups[0].clientName, "Acme");
});

test("a project that isn't open counts as not filed", () => {
  const groups = groupQueue([record({ projectId: "p-archived" })], projects);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].projectId, null);
  assert.equal(groups[0].items[0].projectId, null);
});

test("the same undertaking on two calls is one row standing for both", () => {
  const a = record({ title: "Send Acme the spec", originKey: "m:call-1" });
  const b = record({ title: "send acme the spec.", originKey: "m:call-2" });
  const groups = groupQueue([a, b], projects);
  assert.equal(queueCount(groups), 1);
  const row = groups[0].items[0];
  assert.deepEqual(row.ids.sort(), [a.id, b.id].sort());
  assert.equal(row.calls, 2);
});

test("the same title said twice on one call still counts as one call", () => {
  const groups = groupQueue(
    [record({ title: "Book training" }), record({ title: "Book training" })],
    projects,
  );
  assert.equal(groups[0].items[0].calls, 1);
  assert.equal(groups[0].items[0].ids.length, 2);
});

test("soonest due first, undated last, then most recently said", () => {
  const groups = groupQueue(
    [
      record({ title: "Undated old", saidAt: new Date("2026-11-17T15:00:00Z") }),
      record({ title: "Undated new", saidAt: new Date("2026-11-22T15:00:00Z") }),
      record({ title: "Due later", dueDate: new Date("2026-12-05T00:00:00Z") }),
      record({ title: "Due soon", dueDate: new Date("2026-11-28T00:00:00Z") }),
    ],
    projects,
  );
  assert.deepEqual(
    groups[0].items.map((i) => i.title),
    ["Due soon", "Due later", "Undated new", "Undated old"],
  );
  assert.equal(groups[0].items[0].dueDate, "2026-11-28");
});

test("the count is every row across every group", () => {
  const groups = groupQueue(
    [record({ projectId: "p-acme" }), record({ projectId: "p-beta" }), record({ projectId: null })],
    projects,
  );
  assert.equal(queueCount(groups), 3);
});
