import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { slackConfigured } from "@/lib/slack/client";
import { sendFridayDigests, sendMondayDigests } from "@/lib/slack/send";

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

  const kind = new URL(request.url).searchParams.get("kind") ?? "monday";
  if (kind !== "monday" && kind !== "friday") {
    return NextResponse.json(
      { error: "kind must be 'monday' or 'friday'." },
      { status: 400 },
    );
  }

  const result =
    kind === "monday" ? await sendMondayDigests() : await sendFridayDigests();

  // 200 even when individual sends failed: the run itself worked, and the body
  // says who didn't get one. A 500 here would make Railway retry the whole
  // batch and double-message everyone who did.
  return NextResponse.json({ kind, ...result });
}

export const GET = run;
export const POST = run;
