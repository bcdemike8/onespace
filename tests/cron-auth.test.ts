import { test } from "node:test";
import assert from "node:assert/strict";
import { checkCronSecret } from "@/lib/cron-auth";


// Read inside the function rather than at import, so setting it here is
// enough and the tests stay independent of module load order.
process.env.CRON_SECRET = "o0YGPyiEC1ThNivMCf4XgbIB";

/**
 * The failure that hid for a fortnight.
 *
 * Every nightly job answered "Not authorised" and stopped. That one sentence
 * covered a wrong secret, a secret with a newline pasted onto the end, and a
 * secret the app never had — three different fixes, indistinguishable in the
 * log. These fix that each one says which.
 */

const req = (secret?: string, query?: string) =>
  new Request(`https://onespace.test/api/cron/zoom-sync${query ? `?secret=${query}` : ""}`, {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });

test("the right secret is let through", () => {
  assert.deepEqual(checkCronSecret(req("o0YGPyiEC1ThNivMCf4XgbIB")), { ok: true });
});

test("the secret also works as a query parameter", () => {
  assert.equal(checkCronSecret(req(undefined, "o0YGPyiEC1ThNivMCf4XgbIB")).ok, true);
});

test("a trailing newline is named as such, not called unauthorised", () => {
  const r = checkCronSecret(req("o0YGPyiEC1ThNivMCf4XgbIB\n"));
  assert.equal(r.ok, true, "a pasted newline is trimmed rather than rejected");
});

test("a genuinely different secret of the same length says so", () => {
  const r = checkCronSecret(req("AAAAAAAAAAAAAAAAAAAAAAAA"));
  assert.equal(r.ok, false);
  assert.match((r as { reason: string }).reason, /right length but not the right value/);
});

test("a different length says how long each one is", () => {
  const r = checkCronSecret(req("short"));
  assert.equal(r.ok, false);
  assert.match((r as { reason: string }).reason, /5 characters and the app's is 24/);
});

test("no secret at all is its own message", () => {
  const r = checkCronSecret(req());
  assert.equal(r.ok, false);
  assert.match((r as { reason: string }).reason, /No secret was sent/);
});

test("an app with no CRON_SECRET says that, rather than blaming the caller", async () => {
  const before = process.env.CRON_SECRET;
  delete process.env.CRON_SECRET;
  const r = checkCronSecret(req("anything"));
  assert.equal(r.ok, false);
  assert.match((r as { reason: string }).reason, /isn't set on the app service/);
  process.env.CRON_SECRET = before;
});

test("the secret itself never appears in a refusal", () => {
  const r = checkCronSecret(req("AAAAAAAAAAAAAAAAAAAAAAAA"));
  assert.ok(!(r as { reason: string }).reason.includes("o0YGPyiEC1ThNivMCf4XgbIB"));
});
