import { test } from "node:test";
import assert from "node:assert/strict";
import { findAccessToken, keysSeen } from "@/lib/outreach/shape";

/**
 * The reply that broke this in production, and the shapes it might have been.
 *
 * Outreach answered HTTP 200 with an install object and no token under
 * either name the code looked for, so every endpoint failed identically and
 * the report was truncated to 100 characters — which said nothing about why.
 * These fix both halves: find a token wherever it is, and when there is none,
 * say what was there instead.
 */

const LONG = "a".repeat(40);

test("the live reply that had no token is reported as having none", () => {
  const actual = {
    data: {
      type: "install",
      id: "21e5d955-ef02-47cc-9c0f-8914862a680f",
      attributes: { installedAt: "2026-09-15T00:00:00Z" },
    },
  };
  assert.equal(findAccessToken(actual), null);
});

test("and names every field it did contain, so one more round trip is enough", () => {
  const actual = {
    data: {
      type: "install",
      id: "21e5d955",
      attributes: { installedAt: "2026-09-15T00:00:00Z" },
    },
  };
  assert.deepEqual(keysSeen(actual), [
    "data",
    "data.type",
    "data.id",
    "data.attributes",
    "data.attributes.installedAt",
  ]);
});

test("finds the token under data.attributes.accessToken", () => {
  const found = findAccessToken({ data: { attributes: { accessToken: LONG } } });
  assert.deepEqual(found, { token: LONG, via: "data.attributes.accessToken" });
});

test("finds it under the bare OAuth spelling too", () => {
  const found = findAccessToken({ access_token: LONG });
  assert.deepEqual(found, { token: LONG, via: "access_token" });
});

test("finds it when Outreach simply calls it token", () => {
  const found = findAccessToken({ data: { attributes: { token: LONG } } });
  assert.deepEqual(found, { token: LONG, via: "data.attributes.token" });
});

test("an id that happens to be short is not mistaken for a token", () => {
  // "token" spelled right but eight characters long is a handle, not a bearer.
  assert.equal(findAccessToken({ data: { attributes: { token: "abc12345" } } }), null);
});

test("a field merely containing the word token is not taken", () => {
  assert.equal(
    findAccessToken({ data: { attributes: { tokenExpiresAt: LONG } } }),
    null,
  );
});

test("survives replies that aren't objects at all", () => {
  assert.equal(findAccessToken(null), null);
  assert.equal(findAccessToken("nope"), null);
  assert.deepEqual(keysSeen(null), []);
});
