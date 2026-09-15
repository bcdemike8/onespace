import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readFromZoomSummary,
  ZOOM_AI_MODEL,
} from "@/lib/zoom/zoom-summary";

/**
 * The bug this fixes, in the shape it actually had.
 *
 * Zoom's Smart Recording writes a summary without ever producing an audio
 * transcript. The sync asked for that summary, took its next steps, and
 * discarded the prose — so a call Zoom had already written up showed "no
 * write-up" in OneSpace while Zoom's own screen showed a Transcript badge.
 */

/** A reply shaped like the Sep 15 call in Brianna's account. */
const REAL = {
  summary_overview:
    "Aya and Brianna discussed two client accounts transitioning as Aya leaves outreach for a new role at Atlassian.",
  summary_details: [
    { label: "Account transitions", summary: "Two accounts move to Brianna." },
    { label: "Agent Sync", summary: "Reviewed progress on the revenue agent." },
  ],
  next_steps: ["Brianna to confirm handover dates", "Aya to write up access"],
};

test("Zoom's summary becomes a write-up rather than being mined and dropped", () => {
  const read = readFromZoomSummary(REAL);
  assert.ok(read, "a summary with content must produce a write-up");
  assert.match(read.overview, /Aya and Brianna/);
  assert.equal(read.model, ZOOM_AI_MODEL);
});

test("each of Zoom's headings becomes a section, in order", () => {
  const read = readFromZoomSummary(REAL)!;
  assert.deepEqual(
    read.sections.slice(0, 2).map((s) => s.heading),
    ["Account transitions", "Agent Sync"],
  );
});

test("next steps are shown in the write-up as their own section", () => {
  const read = readFromZoomSummary(REAL)!;
  const last = read.sections.at(-1)!;
  assert.equal(last.heading, "Next steps");
  assert.deepEqual(last.bullets, [
    "Brianna to confirm handover dates",
    "Aya to write up access",
  ]);
});

test("but not as action items — those come from the commitments path, once", () => {
  assert.deepEqual(readFromZoomSummary(REAL)!.actionItems, []);
});

test("the outline is left empty rather than invented from the sections", () => {
  assert.deepEqual(readFromZoomSummary(REAL)!.outline, []);
});

test("a summary with only next steps still produces a write-up", () => {
  const read = readFromZoomSummary({ next_steps: ["Send the SOW"] });
  assert.ok(read, "next steps alone are worth keeping");
  assert.deepEqual(read.sections, [
    { heading: "Next steps", bullets: ["Send the SOW"] },
  ]);
});

test("a detail with no heading still gets one", () => {
  const read = readFromZoomSummary({ summary_details: [{ summary: "Talked." }] })!;
  assert.equal(read.sections[0].heading, "Summary");
});

test("an empty summary produces nothing, not an empty write-up", () => {
  assert.equal(readFromZoomSummary({}), null);
  assert.equal(readFromZoomSummary(null), null);
  assert.equal(readFromZoomSummary(undefined), null);
  assert.equal(
    readFromZoomSummary({ summary_overview: "   ", next_steps: [] }),
    null,
    "whitespace is not a summary",
  );
});

test("blank details are dropped rather than becoming empty sections", () => {
  const read = readFromZoomSummary({
    summary_overview: "Something happened.",
    summary_details: [{ label: "Empty", summary: "  " }],
  })!;
  assert.deepEqual(read.sections, []);
});
