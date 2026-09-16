import { timingSafeEqual } from "node:crypto";

// Deliberately not marked server-only, so it can be tested directly. Nothing
// here leaks if it were ever pulled into a client bundle: Next inlines only
// NEXT_PUBLIC_* variables, so CRON_SECRET would simply be undefined and the
// check would refuse everything. The value itself never appears in a reply.

/**
 * Whether a scheduled job is allowed to run, and if not, why.
 *
 * The reason matters more than it looks. For a fortnight every nightly job -
 * calendar, mail, Zoom, the Slack brief - answered "Not authorised" and
 * stopped, and that sentence is true of a secret that doesn't match, a
 * secret with a stray newline on the end, and a secret nobody ever set on
 * the app. Three different fixes behind one word, in a log nobody reads
 * until something has been broken for a week.
 *
 * So the refusal now names which. The value never appears in the reply -
 * only whether the app has one and whether what arrived is the same shape.
 */
export type CronAuth = { ok: true } | { ok: false; reason: string };

export function checkCronSecret(request: Request): CronAuth {
  const expected = process.env.CRON_SECRET?.trim();

  if (!expected) {
    return {
      ok: false,
      reason:
        "CRON_SECRET isn't set on the app service. The cron is calling correctly; the app has nothing to check it against. Add it in Railway on the app service - the same value the cron service has - and redeploy.",
    };
  }

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const query = new URL(request.url).searchParams.get("secret")?.trim() ?? "";
  const supplied = bearer || query;

  if (!supplied) {
    return {
      ok: false,
      reason: "No secret was sent. Expected an Authorization: Bearer header.",
    };
  }

  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);

  // Length is checked separately because timingSafeEqual throws on a
  // mismatch - and because a length difference is almost always a trailing
  // newline from a copy and paste, which is worth saying out loud.
  if (a.length !== b.length) {
    return {
      ok: false,
      reason: `The secret sent is ${b.length} characters and the app's is ${a.length}. They're different values, or one of them has a stray space or newline on the end from being pasted.`,
    };
  }

  if (!timingSafeEqual(a, b)) {
    return {
      ok: false,
      reason:
        "The secret is the right length but not the right value. Paste the same CRON_SECRET into both the app service and the cron service in Railway, then redeploy the app.",
    };
  }

  return { ok: true };
}
