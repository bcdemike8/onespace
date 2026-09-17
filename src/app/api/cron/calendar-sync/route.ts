import { NextResponse } from "next/server";
import { checkCronSecret } from "@/lib/cron-auth";
import { googleConfigured } from "@/lib/google/auth";
import { syncCalendars } from "@/lib/google/sync";
import { nextTurn } from "@/lib/cron-people";
import { pruneUnmapped } from "@/lib/google/sync";

export const dynamic = "force-dynamic";

// Pulls every calendar and refreshes the suggestions. Same shared secret as
// the Slack digest: this is a public URL, and without it anyone could make the
// app read seven diaries on demand.


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
    // One person per request. Everybody in one call took minutes and
    // Railway's gateway answered 502 with no body long before it finished,
    // so the nightly run had never once completed. The caller loops.
    const after = new URL(request.url).searchParams.get("after");
    const turn = await nextTurn(after);
    if (!turn.person) {
      return NextResponse.json({ done: true, people: 0, seen: 0 });
    }

    const result = await syncCalendars({ userId: turn.person.id });

    // The end of the sweep. A per-person run can add to the unmapped list
    // but must never decide something has gone away — it only looked at one
    // calendar — so the tidy-up happens once, here, after the last one.
    if (!turn.more) await pruneUnmapped();

    // 200 even when one person's calendar failed: the run worked, and the
    // body names who it couldn't read. A 500 would make Railway retry the
    // whole thing.
    return NextResponse.json({
      ...result,
      person: turn.person,
      more: turn.more,
    });
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
