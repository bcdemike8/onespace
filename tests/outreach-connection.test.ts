import { test } from "node:test";
import assert from "node:assert/strict";
import {
  apiBaseFrom,
  findAccessToken,
  redactTokens,
} from "@/lib/outreach/shape";

/**
 * The real reply from RevOptics' production org, with the live token swapped
 * for a fake one of the same shape.
 *
 * Two things were wrong before it arrived, and both are fixed here. The
 * token sits under data.meta — not data.attributes, where three earlier
 * guesses looked. And the org has its own API host, handed over in the same
 * reply: calls to the generic api.outreach.io would have been the next thing
 * to fail.
 */
const FAKE_JWT =
  "eyJhbGciOiJFUzI1NiIsImtpZCI6InByb2R1Y3Rpb24ifQ.eyJhdWQiOiJwdWJsaWMtYXBpQG91dHJlYWNoLmlvIn0.AbCdEfGhIjKlMnOpQrStUvWxYz0123456789";

const REPLY = {
  data: {
    type: "install",
    id: "21e5d955-ef02-47cc-9c0f-8914862a680f",
    attributes: { installedAt: "2026-09-15T17:33:41.366281Z" },
    relationships: {
      app: { data: { type: "app", id: "ad801560-3fb5-4154-ad75-69cbd45457d8" } },
      org: {
        data: { type: "org", id: "bc19590f-a235-4c3c-92eb-8775269bf4b1" },
        links: { api: "https://app1f.outreach.io/api/v2" },
      },
    },
    meta: { accessToken: FAKE_JWT },
    links: {
      self: "https://api.outreach.io/api/app/installs/21e5d955-ef02-47cc-9c0f-8914862a680f",
    },
  },
};

test("finds the token where Outreach actually puts it: data.meta", () => {
  assert.deepEqual(findAccessToken(REPLY), {
    token: FAKE_JWT,
    via: "data.meta.accessToken",
  });
});

test("reads the org's own API host rather than assuming api.outreach.io", () => {
  assert.equal(apiBaseFrom(REPLY), "https://app1f.outreach.io/api/v2");
});

test("falls back to null when no host is offered, so the caller can default", () => {
  assert.equal(apiBaseFrom({ data: { relationships: {} } }), null);
  assert.equal(apiBaseFrom({}), null);
  assert.equal(apiBaseFrom(null), null);
});

test("an http or relative link is refused rather than used", () => {
  const insecure = {
    data: { relationships: { org: { links: { api: "http://evil.test/api/v2" } } } },
  };
  assert.equal(apiBaseFrom(insecure), null);
});

test("a diagnostic never carries a live token out of the building", () => {
  const redacted = redactTokens(JSON.stringify(REPLY));
  assert.ok(!redacted.includes(FAKE_JWT), "token survived redaction");
  assert.ok(redacted.includes("[token redacted]"));
  // Everything else a diagnostic is for must still be readable.
  assert.ok(redacted.includes("app1f.outreach.io"));
  assert.ok(redacted.includes("installedAt"));
});
