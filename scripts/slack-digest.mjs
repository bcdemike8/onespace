// Railway cron entry point. Railway's scheduler runs a service to completion on
// a schedule, so this is a one-shot: call the digest endpoint, report, exit.
//
//   node scripts/slack-digest.mjs monday
//   node scripts/slack-digest.mjs friday
//
// Needs APP_URL (or RAILWAY_PUBLIC_DOMAIN) and CRON_SECRET. The exit code
// matters: a non-zero exit is what makes a failed run visible in Railway
// instead of disappearing into the log.

const kind = (process.argv[2] || process.env.DIGEST_KIND || "monday").trim();
if (kind !== "monday" && kind !== "friday") {
  console.error(`Unknown digest "${kind}". Use monday or friday.`);
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

const url = `${base}/api/cron/slack-digest?kind=${kind}`;

try {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  const body = await res.json().catch(() => null);

  if (!res.ok) {
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

  // Individual failures are worth surfacing as a failed run — silently sending
  // five of seven digests every week is the kind of thing nobody notices.
  process.exit(body.failed?.length ? 1 : 0);
} catch (err) {
  console.error(`${kind} digest couldn't reach ${url}:`, err.message);
  process.exit(1);
}
