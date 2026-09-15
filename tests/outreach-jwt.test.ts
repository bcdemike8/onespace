import { test } from "node:test";
import assert from "node:assert/strict";
import { createVerify, generateKeyPairSync } from "node:crypto";
import { normalisePem, signAppToken } from "@/lib/outreach/jwt";
import { OutreachError } from "@/lib/outreach/errors";

/**
 * The app token is the whole connection. If it is wrong, Outreach answers
 * 401 with no explanation and every layer above it looks broken instead.
 *
 * So these verify a real RSA signature against a real public key rather than
 * asserting on a stub. A stub accepts whatever you send it — which is
 * exactly how a wrong `max_tokens` shipped to production on this project
 * with a green test suite behind it.
 */

const pkcs8 = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const pkcs1 = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
});

const decode = (segment: string) =>
  JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));

function verify(token: string, publicKey: string): boolean {
  const [header, payload, signature] = token.split(".");
  const v = createVerify("RSA-SHA256");
  v.update(`${header}.${payload}`);
  v.end();
  return v.verify(publicKey, Buffer.from(signature, "base64url"));
}

test("signs a token Outreach's public key would verify", () => {
  const token = signAppToken("guid-123", pkcs8.privateKey);
  assert.equal(token.split(".").length, 3);
  assert.ok(verify(token, pkcs8.publicKey), "signature does not verify");
});

test("header declares RS256, which is what Outreach expects", () => {
  const token = signAppToken("guid-123", pkcs8.privateKey);
  assert.deepEqual(decode(token.split(".")[0]), { alg: "RS256", typ: "JWT" });
});

test("payload is exactly iat, exp and iss — nothing Outreach didn't ask for", () => {
  const now = new Date("2026-09-15T12:00:00Z");
  const payload = decode(signAppToken("guid-123", pkcs8.privateKey, now).split(".")[1]);

  assert.deepEqual(Object.keys(payload).sort(), ["exp", "iat", "iss"]);
  assert.equal(payload.iss, "guid-123");
  assert.equal(payload.iat, 1789473600);
  assert.equal(payload.exp, payload.iat + 3600, "expiry must be an hour out");
});

test("accepts the PKCS#1 wrapper too, which is what some openssl builds write", () => {
  const token = signAppToken("guid-123", pkcs1.privateKey);
  assert.ok(verify(token, pkcs1.publicKey));
});

test("accepts a key whose newlines arrived spelled out as backslash-n", () => {
  const escaped = pkcs8.privateKey.replace(/\n/g, "\\n");
  const token = signAppToken("guid-123", escaped);
  assert.ok(verify(token, pkcs8.publicKey), "escaped-newline key must still sign");
});

test("a public key pasted by mistake says so, rather than failing at Outreach", () => {
  assert.throws(
    () => signAppToken("guid-123", pkcs8.publicKey),
    (e: unknown) =>
      e instanceof OutreachError && /private half/.test((e as Error).message),
  );
});

test("normalisePem leaves a well-formed key alone", () => {
  assert.equal(normalisePem(pkcs8.privateKey), pkcs8.privateKey.trim());
});

test("normalisePem strips carriage returns a Windows paste would add", () => {
  const crlf = pkcs8.privateKey.replace(/\n/g, "\r\n");
  assert.equal(normalisePem(crlf), pkcs8.privateKey.trim());
});
