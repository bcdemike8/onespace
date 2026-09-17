// Railway cron entry point. Railway runs a scheduled service to completion, so
// this is a one-shot: call the app, report what happened, exit.
//
//   node scripts/cron.mjs
//
// Four jobs, run in this order because the brief is more useful once the
// calendar, the mailboxes and Zoom have been read:
//
//   calendar  pull everyone's meetings and refresh the suggestions
//   mail      pull client email and refresh the inbox
//   zoom      real call lengths, off-calendar calls, and commitments
//   digest    send the 5am Slack brief
//
// ONESPACE_JOB picks which, as one name or several separated by commas:
//
//   unset                  all four (the original single nightly service)
//   calendar               just the calendar, for an hourly service
//   mail,zoom,digest       everything the hourly one isn't already doing
//
// The list exists because splitting them is the point. Reading a calendar
// takes seconds and is worth doing every hour; reading Zoom transcripts costs
// money and belongs overnight. Without a list the nightly service could only
// be "everything" or "one thing", so it would redo the calendar every night
// for no reason.
//
// Needs APP_URL (or RAILWAY_PUBLIC_DOMAIN) and CRON_SECRET.

const KNOWN = ["calendar", "mail", "zoom", "digest"];

/** Every job asked for, with "both"/"all"/unset meaning the lot. */
const asked = (process.env.ONESPACE_JOB ?? "both")
  .toLowerCase()
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);

const everything = asked.length === 0 || asked.some((n) => n === "both" || n === "all");
const chosen = everything ? KNOWN : asked.filter((n) => KNOWN.includes(n));

// A name that is not a job is a typo in a Railway variable, and quietly doing
// nothing about it is how a service sits there for a fortnight looking fine.
const unknown = everything ? [] : asked.filter((n) => !KNOWN.includes(n));
if (unknown.length > 0) {
  console.error(
    `Unknown ONESPACE_JOB ${unknown.map((n) => `"${n}"`).join(", ")}. ` +
      `Use ${KNOWN.join(", ")}, several separated by commas, or leave it unset for all of them.`,
  );
  process.exit(2);
}

const base =
  (process.env.APP_URL && process.env.APP_URL.replace(/\/+$/, "")) ||
  (process.env.RAILWAY_PUBLIC_DOMAIN &&
    `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);

if (!base) {
  console.error("Set APP_URL to your OneSpace URL.");
  process.exit(2);
}
if (!process.env.CRON_SECRET) {
  console.error("Set CRON_SECRET, the same value the app has.");
  process.exit(2);
}

/**
 * How long one request may take before we call it hung.
 *
 * Shorter than the platform's own gateway timeout on purpose, so a slow job
 * fails here with a sentence that says which job and how long, rather than
 * arriving as "502: (no body)" from a proxy that knows nothing about us.
 */
// Comfortably longer than the longest budget any endpoint gives itself
// (90s, in the Zoom sync), and shorter than the gateway's own patience.
const REQUEST_TIMEOUT_MS = 150_000;

async function call(name, path, describe) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body = await res.json().catch(() => null);

    if (!res.ok) {
      console.error(
        `${name} failed (${res.status}):`,
        body ??
          "(no body — a 502 with no body is usually the gateway giving up on a " +
            "request that ran too long, not the app refusing it)",
      );

      // A refusal that says only "Not authorised" comes from a build of this
      // app older than 16 September 2026. Every refusal since then explains
      // itself. So a bare one is not a wrong secret — it is the wrong app.
      if (res.status === 401 && /^not authoris/i.test(body?.error ?? "")) {
        console.error(
          `  ↳ that wording was replaced in this codebase on 16 September. ` +
            `The app at ${base} is running an older build than this cron, so ` +
            `it is a different deployment — not a secret that doesn't match.`,
        );
      }
      return false;
    }

    console.log(`${name}: ${describe(body)}`);
    return body;
  } catch (err) {
    const why =
      err.name === "TimeoutError"
        ? `gave up after ${REQUEST_TIMEOUT_MS / 1000}s`
        : err.message;
    console.error(`${name} couldn't reach ${url}: ${why}`);
    return false;
  }
}

/**
 * Walk everybody, one request per person.
 *
 * The endpoint does one calendar or one mailbox and says whether anybody is
 * left. Doing them all in a single request took minutes, and the gateway
 * answered 502 with no body long before it finished — every night, for
 * calendar, mail and zoom alike. Nothing ever synced on a schedule.
 */
async function eachPerson(name, path, describe) {
  let after = null;
  let ok = true;

  for (let turn = 1; turn <= 200; turn++) {
    const sep = path.includes("?") ? "&" : "?";
    const body = await call(
      name,
      after ? `${path}${sep}after=${encodeURIComponent(after)}` : path,
      describe,
    );

    if (!body) {
      ok = false;
      break;
    }
    if (!body.person || !body.more) break;
    after = body.person.id;
  }

  return ok;
}

/**
 * Which app is this actually calling, and is it the one being deployed?
 *
 * A cron service can point at a URL nobody is looking at any more — a
 * previous service, an old domain, a second environment — and every symptom
 * of that looks like a bug in the app. So the log opens by naming the URL
 * and the build that answered it, and says plainly when that build is not
 * this one.
 */
async function identify() {
  console.log(`cron → ${base}`);

  const mine = (process.env.RAILWAY_GIT_COMMIT_SHA ?? "").trim().slice(0, 7);
  if (mine) console.log(`this cron is build ${mine}`);

  try {
    const res = await fetch(`${base}/api/version`, {
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      console.error(`the app at ${base} answered ${res.status} to /api/version.`);
      return;
    }
    const body = await res.json();
    console.log(`the app there is build ${body.commit ?? "unknown"}`);

    if (mine && body.commit && body.commit !== mine) {
      console.error(
        `MISMATCH: this cron is ${mine}, the app it calls is ${body.commit}. ` +
          "They are different deployments. Check APP_URL on this service " +
          "points at the app you actually use.",
      );
    }
  } catch (err) {
    console.error(`couldn't reach ${base}/api/version: ${err.message}`);
  }
}

await identify();

const jobs = [];

const wants = (name) => chosen.includes(name);

if (wants("calendar")) {
  jobs.push(() =>
    eachPerson("calendar", "/api/cron/calendar-sync", (b) =>
      `${b.person?.name ?? "nobody"}: ${b.seen ?? 0} meetings, ${b.created ?? 0} new, ${b.matched ?? 0} matched, ${b.skipped ?? 0} passed over` +
      (b.failed?.length
        ? `, couldn't read ${b.failed.map((f) => `${f.name} (${f.error})`).join(", ")}`
        : ""),
    ),
  );
}

if (wants("mail")) {
  jobs.push(() =>
    eachPerson("mail", "/api/cron/mail-sync", (b) =>
      `${b.person?.name ?? "nobody"}: ${b.threads ?? 0} client threads, ${b.created ?? 0} new, ${b.awaiting ?? 0} waiting on a reply` +
      (b.failed?.length
        ? `, couldn't read ${b.failed.map((f) => `${f.name} (${f.error})`).join(", ")}`
        : ""),
    ),
  );
}

if (wants("zoom")) {
  // Called until the transcript backlog is empty rather than once.
  //
  // Reading a transcript with a model takes tens of seconds, and the sync
  // only reads a handful per request so that no hop between here and the
  // app has to wait minutes for a response. Overnight there is no hurry
  // and nobody watching, so this keeps going until nothing is left -
  // which is how a six-week catch-up clears in one night instead of a
  // fortnight of one-a-day.
  jobs.push(async () => {
    let totals = { seen: 0, commitments: 0, transcripts: 0 };
    let ok = true;

    for (let pass = 1; pass <= 60; pass++) {
      let left = 0;
      const done = await call("zoom", "/api/cron/zoom-sync", (b) => {
        left = b.transcriptsLeft ?? 0;
        totals.seen = b.seen ?? 0;
        totals.commitments += b.commitments ?? 0;
        totals.transcripts += b.transcripts ?? 0;
        return (
          `pass ${pass}: ${b.seen} calls across ${b.people} people, ${b.timed} timed, ` +
          `${b.created} off-calendar, ${b.commitments} commitments` +
          (left > 0 ? `, ${left} transcripts still to read` : "") +
          (b.failed?.length
            ? `, couldn't read ${b.failed.map((f) => `${f.name} (${f.error})`).join(", ")}`
            : "")
        );
      });

      if (!done) {
        ok = false;
        break;
      }
      if (left === 0) break;
    }

    if (totals.transcripts > 0) {
      console.log(
        `zoom: ${totals.transcripts} transcripts read in total, ${totals.commitments} commitments found`,
      );
    }
    return ok;
  });
}

if (wants("digest")) {
  jobs.push(() =>
    call("digest", "/api/cron/slack-digest", (b) =>
      `sent ${b.sent}, skipped ${b.skipped}` +
      (b.unlinked?.length ? `, no Slack account for ${b.unlinked.join(", ")}` : "") +
      (b.failed?.length
        ? `, failed for ${b.failed.map((f) => `${f.name} (${f.error})`).join(", ")}`
        : ""),
    ),
  );
}

if (jobs.length === 0) {
  console.error("ONESPACE_JOB asked for no jobs at all. Leave it unset for all of them.");
  process.exit(2);
}

console.log(`running: ${chosen.join(", ")}`);

let allReached = true;
for (const run of jobs) {
  // Sequential on purpose: the digest should see what the sync just wrote.
  const ok = await run();
  allReached &&= ok;
}

// Non-zero only when a whole job failed to run - the app was unreachable, or
// the secret is wrong. Individual failures inside a run exit 0, because
// Railway retries a failed run and a retry would re-send the brief to
// everyone who already got one.
process.exit(allReached ? 0 : 1);
