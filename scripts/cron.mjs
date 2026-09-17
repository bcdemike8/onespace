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
// ONESPACE_JOB picks which. Unset means all three, so the existing single cron
// service keeps working and gains the two syncs without being touched. Set it
// to "calendar" or "mail" on a second, more frequent service if you want
// those to land during the day rather than overnight.
//
// Needs APP_URL (or RAILWAY_PUBLIC_DOMAIN) and CRON_SECRET.

const job = (process.env.ONESPACE_JOB ?? "both").trim().toLowerCase();

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

const jobs = [];

const wants = (name) => job === name || job === "both" || job === "all";

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
  console.error(`Unknown ONESPACE_JOB "${job}". Use calendar, mail, zoom, digest, or leave it unset.`);
  process.exit(2);
}

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
