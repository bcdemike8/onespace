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
 * Call one endpoint. Returns true if the run itself worked, whatever happened
 * to individual people inside it.
 */
async function call(name, path, describe) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const body = await res.json().catch(() => null);

    if (!res.ok) {
      console.error(`${name} failed (${res.status}):`, body ?? "(no body)");
      return false;
    }

    console.log(`${name}: ${describe(body)}`);
    return true;
  } catch (err) {
    console.error(`${name} couldn't reach ${url}:`, err.message);
    return false;
  }
}

const jobs = [];

const wants = (name) => job === name || job === "both" || job === "all";

if (wants("calendar")) {
  jobs.push(() =>
    call("calendar", "/api/cron/calendar-sync", (b) =>
      `${b.seen} meetings across ${b.people} calendars, ${b.created} new, ${b.matched} matched` +
      (b.failed?.length
        ? `, couldn't read ${b.failed.map((f) => `${f.name} (${f.error})`).join(", ")}`
        : ""),
    ),
  );
}

if (wants("mail")) {
  jobs.push(() =>
    call("mail", "/api/cron/mail-sync", (b) =>
      `${b.threads} client threads across ${b.people} mailboxes, ${b.created} new, ${b.awaiting} waiting on a reply` +
      (b.failed?.length
        ? `, couldn't read ${b.failed.map((f) => `${f.name} (${f.error})`).join(", ")}`
        : ""),
    ),
  );
}

if (wants("zoom")) {
  jobs.push(() =>
    call("zoom", "/api/cron/zoom-sync", (b) =>
      `${b.seen} calls across ${b.people} people, ${b.timed} timed, ${b.created} off-calendar, ${b.commitments} commitments` +
      (b.failed?.length
        ? `, couldn't read ${b.failed.map((f) => `${f.name} (${f.error})`).join(", ")}`
        : ""),
    ),
  );
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
