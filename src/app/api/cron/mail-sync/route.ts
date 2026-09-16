import { NextResponse } from "next/server";
import { checkCronSecret } from "@/lib/cron-auth";
import { googleConfigured } from "@/lib/google/auth";
import { syncMail } from "@/lib/google/mail-sync";

export const dynamic = "force-dynamic";

// Reads client mail and refreshes the inbox. Same shared secret as the Slack
// digest: this is a public URL, and without it anyone could make the app read
// seven mailboxes on demand.


async function run(request: Request) {
  const auth = checkCronSecret(request);
  if (!auth.ok) {
    // The reason, not just the refusal. This is the line somebody reads in a
    // cron log at midnight, and "Not authorised" told them nothing.
    return NextResponse.json({ error: auth.reason }, { status: 401 });
  }
  if (!googleConfigured()) {
    return NextResponse.json(
      { error: "Google isn't connected: GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY aren't set." },
      { status: 503 },
    );
  }

  try {
    const result = await syncMail();

    // 200 even when one person's calendar failed: the run worked, and the
    // body names who it couldn't read. A 500 would make Railway retry the
    // whole thing.
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Mail sync failed:", e);
    return NextResponse.json(
      {
        error: "The mail sync failed before it read anything.",
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
