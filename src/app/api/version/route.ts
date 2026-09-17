import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Which copy of the app answered, and which build it is.
 *
 * `id` is generated once when the process starts, so it changes on every
 * deploy and every restart. That is all the update notice needs: a page
 * loaded by the previous copy is stale.
 *
 * `commit` was added because a cron service spent days talking to an app
 * that was not the one anybody was looking at — it answered with wording
 * removed from this codebase weeks earlier, and nothing anywhere could say
 * so. A short commit hash is the cheapest way for two services to prove they
 * are the same deployment.
 *
 * Deliberately just the hash. This endpoint has no authentication, so it must
 * not carry service names, domains or anything else about the environment; a
 * hash reveals nothing to somebody without the repository.
 */
const BOOT = randomUUID();

const COMMIT = (
  process.env.RAILWAY_GIT_COMMIT_SHA ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GIT_COMMIT_SHA ??
  ""
)
  .trim()
  .slice(0, 7);

export function GET() {
  return NextResponse.json(
    { id: BOOT, commit: COMMIT || null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
