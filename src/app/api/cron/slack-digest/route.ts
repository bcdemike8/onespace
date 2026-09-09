import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { slackConfigured } from "@/lib/slack/client";
import { sendDailyDigests } from "@/lib/slack/send";

export const dynamic = "force-dynamic";

// Railway's scheduler calls this. It's a public URL, so the shared secret is the
// only thing keeping it from being a free way to spam everyone's DMs.

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
  if (!slackConfigured()) {
    return NextResponse.json(
      { error: "SLACK_BOT_TOKEN isn't set, so there's nowhere to send." },
      { status: 503 },
    );
  }

  // `kind` is still accepted so an existing schedule or bookmark keeps working;
  // there is only one digest now.
  const kind = new URL(request.url).searchParams.get("kind") ?? "daily";
  if (!["daily", "monday", "friday"].includes(kind)) {
    return NextResponse.json({ error: "kind must be 'daily'." }, { status: 400 });
  }

  // This endpoint is the main way anyone checks whether the brief works, and
  // an uncaught throw here renders as a blank 500 — which tells whoever is
  // debugging it precisely nothing. Say what broke instead.
  try {
    const result = await sendDailyDigests();

    // 200 even when individual sends failed: the run itself worked, and the
    // body says who didn't get one. A 500 here would make Railway retry the
    // whole batch and double-message everyone who did.
    return NextResponse.json({ kind: "daily", ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Daily digest failed:", e);
    return NextResponse.json(
      {
        error: "The digest run failed before anything was sent.",
        // Prisma's messages open with a blank line, so take the first line
        // that actually says something.
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
