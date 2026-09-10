import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { zoomConfigured } from "@/lib/zoom/client";
import { syncZoom } from "@/lib/zoom/sync";

export const dynamic = "force-dynamic";

// Reads Zoom: real call lengths, calls that never hit a calendar, and the
// commitments inside the transcripts. Same shared secret as the other jobs.

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
  if (!zoomConfigured()) {
    return NextResponse.json(
      { error: "Zoom isn't connected: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET aren't all set." },
      { status: 503 },
    );
  }

  try {
    const result = await syncZoom();

    // 200 even when one person's calendar failed: the run worked, and the
    // body names who it couldn't read. A 500 would make Railway retry the
    // whole thing.
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Zoom sync failed:", e);
    return NextResponse.json(
      {
        error: "The Zoom sync failed before it read anything.",
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
