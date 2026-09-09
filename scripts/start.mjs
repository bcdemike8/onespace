// One entry point for both Railway services.
//
// Railway's config-as-code overrides anything set in the dashboard, and a repo
// gets one railway.json — so a second service pointed at this repo inherits the
// web app's start command no matter what you type in the UI. Rather than fight
// that with a second config file and a path setting, both services run this and
// it branches on a plain environment variable:
//
//   ONESPACE_ROLE unset or "web"  → migrate, then serve the app   (the default)
//   ONESPACE_ROLE=cron            → run the scheduled jobs, then exit
//
// The default is the web app deliberately: forgetting to set the variable gets
// you a working site, not a site that quietly refuses to start.

import { spawn } from "node:child_process";

const role = (process.env.ONESPACE_ROLE ?? "web").trim().toLowerCase();

/** Run a command, inheriting stdio, resolving with its exit code. */
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) reject(new Error(`${command} killed by ${signal}`));
      else resolve(code ?? 0);
    });
  });
}

if (role === "cron") {
  console.log("ONESPACE_ROLE=cron — running scheduled jobs.");
  // Runs on import and exits on its own. Which jobs is ONESPACE_JOB's call;
  // unset means the calendar sync followed by the Slack brief.
  await import("./cron.mjs");
} else {
  if (role !== "web") {
    console.warn(`Unknown ONESPACE_ROLE "${role}" — starting the web app.`);
  }

  // Migrations first: the app must never serve against a schema it predates.
  const migrated = await run("npx", ["prisma", "migrate", "deploy"]);
  if (migrated !== 0) {
    console.error("prisma migrate deploy failed — not starting the app.");
    process.exit(migrated);
  }

  process.exit(await run("npm", ["run", "start"]));
}
