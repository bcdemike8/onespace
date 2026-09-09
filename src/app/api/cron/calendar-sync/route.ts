import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { googleConfigured } from "@/lib/google/auth";
import { syncCalendars } from "@/lib/google/sync";

export const dynamic = "force-dynamic";

// Pulls every calendar and refreshes the suggestions. Same shared secret as
// the Slack digest: this is a public URL, and without it anyone could make the
// app read seven diaries on demand.

function authorised(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const query = new URL(request.url).searchParams.get("secret") ?? "";
  const supplied = bearer || query;
  if (!supplied) return false;

  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function run(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }
  if (!googleConfigured()) {
    return NextResponse.json(
      { error: "Google isn't connected: GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY aren't set." },
      { status: 503 },
    );
  }

  try {
    const result = await syncCalendars();

    // 200 even when one person's calendar failed: the run worked, and the
    // body names who it couldn't read. A 500 would make Railway retry the
    // whole thing.
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Calendar sync failed:", e);
    return NextResponse.json(
      {
        error: "The calendar sync failed before it read anything.",
        detail:
          message
            .split("\n")
            .map((line) => line.trim())
            .find(Boolean) ?? "No detail available.",
      },
      { status: 500 },
    );
  }
}

export const GET = run;
export const POST = run;
