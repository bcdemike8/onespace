import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Slack signs every request to us. Verifying it is the only thing standing
// between the slash command and anyone on the internet who knows the URL, so
// this is deliberately strict and has no "skip in development" escape hatch.
//
// https://api.slack.com/authentication/verifying-requests-from-slack

const VERSION = "v0";
const MAX_SKEW_SECONDS = 60 * 5;

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: string };

export function verifySlackRequest({
  body,
  signature,
  timestamp,
  now = Date.now(),
}: {
  /** The raw request body, byte for byte. Re-serialising JSON breaks the hash. */
  body: string;
  signature: string | null;
  timestamp: string | null;
  now?: number;
}): VerifyResult {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return { ok: false, reason: "no_signing_secret" };
  if (!signature || !timestamp) return { ok: false, reason: "missing_headers" };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "bad_timestamp" };

  // Replay window. Slack's own guidance is five minutes.
  if (Math.abs(now / 1000 - ts) > MAX_SKEW_SECONDS) {
    return { ok: false, reason: "stale_timestamp" };
  }

  const expected =
    VERSION +
    "=" +
    createHmac("sha256", secret)
      .update(`${VERSION}:${timestamp}:${body}`)
      .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  // timingSafeEqual throws on a length mismatch, which is itself a leak-free
  // signal that the signature is wrong.
  if (a.length !== b.length) return { ok: false, reason: "bad_signature" };
  if (!timingSafeEqual(a, b)) return { ok: false, reason: "bad_signature" };

  return { ok: true };
}
