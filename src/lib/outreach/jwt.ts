import { createSign } from "node:crypto";
import { OutreachError } from "@/lib/outreach/errors";

/**
 * The app token: a JWT we sign ourselves, saying only who we are.
 *
 * Kept apart from the rest of the connection on purpose. Everything here is
 * pure — a key and a clock in, a string out — which is what makes it
 * testable against a real signature rather than against a stub that would
 * accept whatever it was handed. That distinction has already cost this
 * project a week once.
 */

/**
 * A PEM out of an environment variable, whichever way it was pasted.
 *
 * Railway keeps real newlines, but a value that has been through a shell, a
 * JSON file or a copy box often arrives with the line breaks spelled out as
 * backslash-n. Both are the same key; only one of them parses.
 */
export function normalisePem(raw: string): string {
  const pem = raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
  return pem.replace(/\r\n/g, "\n").trim();
}

const b64url = (input: string) => Buffer.from(input).toString("base64url");

/**
 * Outreach's documented payload is exactly three claims — issued-at, expiry
 * an hour out, and the S2S GUID as issuer. No audience, no subject. Sending
 * claims they don't expect is a good way to be refused with no explanation,
 * so this stays as narrow as their documentation.
 * https://developers.outreach.io/api/s2s-access
 */
export function signAppToken(
  guid: string,
  privateKeyPem: string,
  now: Date = new Date(),
): string {
  const iat = Math.floor(now.getTime() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = { iat, exp: iat + 3600, iss: guid };

  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(
    JSON.stringify(payload),
  )}`;

  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();

  let signature: Buffer;
  try {
    // Both PEM wrappers work: "BEGIN PRIVATE KEY" (PKCS#8) and "BEGIN RSA
    // PRIVATE KEY" (PKCS#1). Which one openssl writes depends on the build,
    // and nobody should have to care.
    signature = signer.sign(normalisePem(privateKeyPem));
  } catch (e) {
    throw new OutreachError(
      "OUTREACH_PRIVATE_KEY isn't a private key this can sign with. It should be the whole file including the BEGIN and END lines — the private half, not the public one uploaded to Outreach." +
        (e instanceof Error ? ` (${e.message})` : ""),
    );
  }

  return `${signingInput}.${signature.toString("base64url")}`;
}
