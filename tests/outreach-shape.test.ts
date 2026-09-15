import { test } from "node:test";
import assert from "node:assert/strict";
import {
  describeRecord,
  describeValue,
  transcriptCandidates,
} from "@/lib/outreach/shape";

/**
 * The point of discovery is to notice a transcript field whatever it turned
 * out to be called. These fix the two ways it can be noticed — by name, and
 * by being far too long to be anything else — and the ways it must not be.
 */

const long = "word ".repeat(200); // 1000 characters

test("a long string is a candidate whatever it is called", () => {
  const fields = describeRecord({ blob: long });
  assert.deepEqual(transcriptCandidates(fields), [`blob string(${long.length})`]);
});

test("a transcript-ish name is a candidate even when the sample is short", () => {
  const fields = describeRecord({ transcriptUrl: "https://x.test/a.vtt" });
  assert.equal(transcriptCandidates(fields).length, 1);
});

test("ordinary metadata is not mistaken for a transcript", () => {
  const fields = describeRecord({
    id: 41,
    createdAt: "2026-09-14T10:00:00Z",
    durationSeconds: 1800,
    recordingUrl: "https://x.test/r.mp4",
    title: "Weekly sync",
  });
  assert.deepEqual(transcriptCandidates(fields), []);
});

test("a short string that merely mentions a URL is not enough", () => {
  const fields = describeRecord({ mediaUrl: "https://x.test/r.mp4" });
  assert.deepEqual(transcriptCandidates(fields), []);
});

test("values are cut to 100 characters so the report can't become a copy", () => {
  const { sample, type } = describeValue(long);
  assert.equal(type, `string(${long.length})`);
  assert.equal(sample.length, 101, "100 characters plus the ellipsis");
  assert.ok(sample.endsWith("…"));
});

test("null, objects and arrays are described rather than crashing", () => {
  assert.deepEqual(describeValue(null), { type: "null", sample: "" });
  assert.equal(describeValue(undefined).type, "null");
  assert.equal(describeValue([1, 2, 3]).type, "array(3)");
  assert.equal(describeValue({ a: 1 }).type, "object");
  assert.equal(describeValue(7).type, "number");
  assert.equal(describeValue(true).type, "boolean");
});

test("fields come back in a stable order, so two runs can be compared", () => {
  const fields = describeRecord({ zeta: 1, alpha: 2, mid: 3 });
  assert.deepEqual(
    fields.map((f) => f.name),
    ["alpha", "mid", "zeta"],
  );
});
