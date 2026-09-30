import test from "node:test";
import assert from "node:assert/strict";
import { matchesQuery, queryWords, searchText } from "../src/lib/search";

const row = searchText(
  "Honeycomb Outreach Implementation: Engage (20-49) + Amplify Add on",
  "Honeycomb",
  "Outreach",
  "Marcus Callaway",
  null,
);

test("an empty query matches everything, so the list starts whole", () => {
  assert.equal(matchesQuery(row, ""), true);
  assert.equal(matchesQuery(row, "   "), true);
  assert.deepEqual(queryWords("  "), []);
});

test("case doesn't matter", () => {
  assert.equal(matchesQuery(row, "HONEYCOMB"), true);
  assert.equal(matchesQuery(row, "honeycomb"), true);
});

test("a partial word matches, so it filters as you type", () => {
  for (const q of ["h", "hon", "honey", "honeycomb"]) {
    assert.equal(matchesQuery(row, q), true, `"${q}" should still match`);
  }
});

test("the client, the partner and the owner are searchable too", () => {
  assert.equal(matchesQuery(row, "marcus"), true);
  assert.equal(matchesQuery(row, "outreach"), true);
});

test("every word has to appear, in any order", () => {
  assert.equal(matchesQuery(row, "honeycomb marcus"), true);
  assert.equal(matchesQuery(row, "marcus honeycomb"), true);
  assert.equal(matchesQuery(row, "honeycomb shannon"), false);
});

test("extra spaces between words are not a failed search", () => {
  assert.equal(matchesQuery(row, "  honeycomb   marcus  "), true);
});

test("punctuation is searchable, and splitting on spaces doesn't break it", () => {
  assert.equal(matchesQuery(row, "(20-49)"), true);
  // Both words are present, so the bracketed form works either way.
  assert.equal(matchesQuery(row, "engage (20-49)"), true);
  assert.equal(matchesQuery(row, "engage 20-49"), true);
});

test("something that isn't there doesn't match", () => {
  assert.equal(matchesQuery(row, "vertiv"), false);
});

test("blanks never become part of the haystack", () => {
  assert.equal(searchText("Access One", null, undefined, "  ", "Marcus"), "Access One Marcus");
  // A project with no client must not answer to a search for "null".
  assert.equal(matchesQuery(searchText("Access One", null), "null"), false);
});
