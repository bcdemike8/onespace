import { NextResponse } from "next/server";
import { checkCronSecret } from "@/lib/cron-auth";
import { slackConfigured } from "@/lib/slack/client";
import { sendWeeklyNudges } from "@/lib/slack/send";

export const dynamic = "force-dynamic";

/**
 * Thursday morning: DM every owner the projects they owe an update on.
 *
 * Railway's scheduler calls this. It's a public URL, so the shared secret is
 * the only thing keeping it from being a free way to message the whole team.
 */
async function run(request: Request) {
  const auth = checkCronSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: 401 });
  }
  if (!slackConfigured()) {
    return NextResponse.json(
      { error: "SLACK_BOT_TOKEN isn't set, so there's nowhere to send." },
      { status: 503 },
    );
  }

  try {
    const result = await sendWeeklyNudges();
    // 200 even when individual sends failed: the run itself worked, and the
    // body names who didn't get one. A 500 would make Railway retry the whole
    // batch and double-message everybody who did.
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Weekly nudge failed:", e);
    return NextResponse.json(
      {
        error: "The nudge run failed before anything was sent.",
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
