// Railway cron entry point. Railway's scheduler runs a service to completion on
// a schedule, so this is a one-shot: call the digest endpoint, report, exit.
//
//   node scripts/slack-digest.mjs
//
// Needs APP_URL (or RAILWAY_PUBLIC_DOMAIN) and CRON_SECRET. The exit code
// matters: a non-zero exit is what makes a failed run visible in Railway
// instead of disappearing into the log.

// An argument is no longer needed — there's one daily brief — but an old
// schedule still passing "monday" shouldn't start failing because of it.
const kind = "daily";

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

const url = `${base}/api/cron/slack-digest?kind=${kind}`;

try {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    // The whole run failed and nothing was sent, so a retry is safe and useful.
    console.error(`${kind} digest failed (${res.status}):`, body ?? "(no body)");
    process.exit(1);
  }

  console.log(
    `${kind}: sent ${body.sent}, skipped ${body.skipped}` +
      (body.unlinked?.length ? `, no Slack account for ${body.unlinked.join(", ")}` : "") +
      (body.failed?.length
        ? `, failed for ${body.failed.map((f) => `${f.name} (${f.error})`).join(", ")}`
        : ""),
  );

  // Exit 0 even when some sends failed. Railway retries a failed run, and a
  // retry re-sends to everyone it already reached — worse than the gap. The
  // line above names who missed out, which is what a person needs to see.
  process.exit(0);
} catch (err) {
  console.error(`${kind} digest couldn't reach ${url}:`, err.message);
  process.exit(1);
}
