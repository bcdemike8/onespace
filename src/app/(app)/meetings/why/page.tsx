import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { dayStart, formatMedium, timeInZone, toISODate } from "@/lib/dates";
import { orgTimezone, calendarWindowLabel } from "@/lib/google/sync";
import { explainDay, type ExplainedEvent } from "@/lib/google/explain";
import { PageHeader } from "@/components/ui";
import { aiConfigured } from "@/lib/ai/summarise";
import { zoomConfigured } from "@/lib/zoom/client";
import { queueSince } from "@/lib/recency";
import { callHealth } from "@/lib/zoom/retry";

/**
 * Which build this app is, shown where somebody is already debugging.
 *
 * A cron service pointed at a stale app for days and every symptom of it
 * looked like a bug in the code. /api/version carries this now, but nobody
 * opens an API by hand — so it is on the screen you land on when something
 * is wrong, next to the answer it changes the meaning of.
 */
const BUILD = (process.env.RAILWAY_GIT_COMMIT_SHA ?? "").trim().slice(0, 7);

/**
 * Whether the app has a CRON_SECRET, and how long it is.
 *
 * Not the value — the length. Comparing two lengths is enough to find the
 * stray newline that a paste leaves on the end, which is the usual reason a
 * scheduled job is refused, and it tells somebody nothing they could use.
 * The unauthenticated 401 body already says this much; an admin page saying
 * it is strictly less exposure and enormously more useful.
 */
const CRON_SECRET_LENGTH = (process.env.CRON_SECRET ?? "").trim().length;

function ago(when: Date | null): string {
  if (!when) return "never";
  const mins = Math.round((Date.now() - when.getTime()) / 60_000);
  if (mins < 2) return "just now";
  if (mins < 90) return `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours < 36) return `${hours} hours ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export const dynamic = "force-dynamic";

/**
 * "Where is my Thursday call?"
 *
 * One person, one day, every entry on their calendar and what the sync did
 * with it. Built because three rounds of "it's still not working" were spent
 * guessing: the sync's rules were right, they were invisible, and nothing in
 * the app could say which rule had caught a particular meeting.
 *
 * It reads the live calendar rather than the stored meetings — the one you
 * are looking for is, by definition, not among the stored ones.
 */
export default async function WhyPage({
  searchParams,
}: {
  searchParams: Promise<{ who?: string; day?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;

  const since = await queueSince();
  const [people, zone, window, lastRead, lastZoomRead, recentCalls] = await Promise.all([
    db.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    orgTimezone(),
    calendarWindowLabel(),
    // When a calendar was last actually read. The single most useful fact
    // about whether the scheduled job is running, and until now it lived
    // only in a cron log nobody keeps.
    db.meeting.aggregate({ _max: { syncedAt: true } }),
    // When a Zoom call was last read - the scheduled job's other half, and
    // the one "You said you'd do this" depends on.
    db.meeting.aggregate({
      where: { zoomUuid: { not: null } },
      _max: { transcriptReadAt: true },
    }),
    db.meeting.findMany({
      where: { startsAt: { gte: since, lte: new Date() } },
      select: {
        userId: true,
        zoomUuid: true,
        startsAt: true,
        transcriptReadAt: true,
        transcriptFailedAt: true,
        summarisedAt: true,
        transcriptNote: true,
      },
    }),
  ]);
  const health = callHealth(recentCalls, people).filter((h) => h.calls > 0);
  const zoomRead = lastZoomRead._max.transcriptReadAt;

  const who = params.who && people.some((p) => p.id === params.who)
    ? params.who
    : admin.id;
  const dayText = /^\d{4}-\d{2}-\d{2}$/.test(params.day ?? "")
    ? params.day!
    : toISODate(new Date());

  const asked = Boolean(params.who || params.day);
  const result = asked ? await explainDay(who, dayStart(dayText)) : null;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Where is my meeting?"
        subtitle="Pick a person and a day. This reads their calendar live and says what the sync did with every entry on it — including the ones it threw away."
        actions={
          <Link href="/meetings" className="btn-ghost btn-sm">
            Back to meetings
          </Link>
        }
      />

      {/* Is the scheduled job even running? Three facts, none of which was
          anywhere in the app — they lived in a cron log that scrolls away. */}
      <dl className="card mb-4 grid gap-x-8 gap-y-2 p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-ink-500">A calendar was last read</dt>
          <dd
            className={
              lastRead._max.syncedAt &&
              Date.now() - lastRead._max.syncedAt.getTime() < 36 * 3_600_000
                ? "text-good-700"
                : "text-bad-700"
            }
          >
            {ago(lastRead._max.syncedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-500">Scheduled jobs can sign in</dt>
          <dd className={CRON_SECRET_LENGTH ? "text-ink-900" : "text-bad-700"}>
            {CRON_SECRET_LENGTH
              ? `Yes — this app's CRON_SECRET is ${CRON_SECRET_LENGTH} characters`
              : "No — this app has no CRON_SECRET, so every job is refused"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-500">This app is build</dt>
          <dd className="text-ink-900">{BUILD || "unknown"}</dd>
        </div>
      </dl>

      {/* Are calls being read? What "You said you'd do this" on everyone's
          My work depends on - so it can be checked here, without Railway. */}
      <section className="card mb-4 p-4 text-sm">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-600">
          Zoom write-ups
        </h2>
        <dl className="mb-4 grid gap-x-8 gap-y-2 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-500">A Zoom call was last read</dt>
            <dd
              className={
                zoomRead && Date.now() - zoomRead.getTime() < 72 * 3_600_000
                  ? "text-good-700"
                  : "text-bad-700"
              }
              title="Red after three days: the scheduled job may not be running, or nobody has had a recorded call since."
            >
              {ago(zoomRead)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Claude connected</dt>
            <dd className={aiConfigured() ? "text-ink-900" : "text-bad-700"}>
              {aiConfigured() ? "Yes" : "No - ANTHROPIC_API_KEY isn't set, so nothing is written up"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Zoom connected</dt>
            <dd className={zoomConfigured() ? "text-ink-900" : "text-bad-700"}>
              {zoomConfigured() ? "Yes" : "No - the ZOOM_* settings aren't set"}
            </dd>
          </div>
        </dl>
        {health.length === 0 ? (
          <p className="text-ink-500">No client calls since {formatMedium(dayStart(since))}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-ink-500">
                <tr>
                  <th className="py-1 pr-3 font-medium">Since {formatMedium(dayStart(since))}</th>
                  <th className="py-1 pr-3 font-medium tnum">Client calls</th>
                  <th className="py-1 pr-3 font-medium tnum">Written up</th>
                  <th className="py-1 pr-3 font-medium tnum">Waiting</th>
                  <th className="py-1 pr-3 font-medium tnum">No write-up</th>
                  <th className="py-1 pr-3 font-medium tnum">Not on their Zoom</th>
                  <th className="py-1 font-medium">Commonest reason for no write-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {health.map((h) => (
                  <tr key={h.id}>
                    <td className="py-1.5 pr-3 text-ink-900">{h.name}</td>
                    <td className="py-1.5 pr-3 tnum">{h.calls}</td>
                    <td className="py-1.5 pr-3 tnum">{h.writtenUp}</td>
                    <td className="py-1.5 pr-3 tnum">{h.waiting}</td>
                    <td className={`py-1.5 pr-3 tnum ${h.noWriteUp ? "text-warn-700" : ""}`}>{h.noWriteUp}</td>
                    <td className="py-1.5 pr-3 tnum">{h.notOnZoom}</td>
                    <td className="py-1.5 text-ink-600">{h.topReason ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-ink-500">
              &ldquo;Not on their Zoom&rdquo; means the call was hosted on someone else&apos;s Zoom (a
              client&apos;s, a partner&apos;s, a colleague&apos;s) or wasn&apos;t a Zoom call, so there&apos;s
              nothing of theirs to read. Calls with no write-up are retried automatically, once a day.
            </p>
          </div>
        )}
      </section>

      <form className="card mb-4 flex flex-wrap items-end gap-3 p-4" action="/meetings/why">
        <div>
          <label className="label" htmlFor="who">
            Whose calendar
          </label>
          <select id="who" name="who" defaultValue={who} className="input w-auto">
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="day">
            Which day
          </label>
          <input
            id="day"
            name="day"
            type="date"
            defaultValue={dayText}
            className="input w-auto"
          />
        </div>
        <button type="submit" className="btn-primary">
          Show me
        </button>
        <p className="w-full text-xs text-ink-500">
          Calendars are read {window}. A day outside that is read here anyway —
          this asks Google directly — but the sync would not have stored it.
        </p>
      </form>

      {result === null ? null : result.error ? (
        <p className="rounded-lg border border-bad-500/30 bg-bad-50 px-4 py-3 text-sm text-bad-700">
          {result.error}
        </p>
      ) : result.events.length === 0 ? (
        <p className="card px-4 py-6 text-center text-sm text-ink-600">
          Nothing at all on {result.personEmail}&rsquo;s calendar for{" "}
          {formatMedium(dayStart(dayText))}. If you can see something there in
          Google, OneSpace is reading a different calendar than you are —
          secondary calendars aren&rsquo;t read, only the primary one.
        </p>
      ) : (
        <div className="card overflow-hidden p-0">
          <p className="border-b border-ink-100 px-4 py-2 text-xs text-ink-500">
            {result.events.length} entr{result.events.length === 1 ? "y" : "ies"} on{" "}
            {result.personEmail} for {formatMedium(dayStart(dayText))}.
          </p>
          <ul className="divide-y divide-ink-100">
            {result.events.map((e, i) => (
              <Row key={i} event={e} zone={zone} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const TONE: Record<string, string> = {
  matched: "bg-good-50 text-good-700",
  unplaced: "bg-warn-50 text-warn-700",
  "no-client": "bg-bad-50 text-bad-700",
  "not-a-meeting": "bg-ink-100 text-ink-600",
  settled: "bg-brand-50 text-brand-700",
};

const LABEL: Record<string, string> = {
  matched: "In your list",
  unplaced: "In your list",
  "no-client": "Not kept",
  "not-a-meeting": "Not kept",
  settled: "Already dealt with",
};

function Row({ event, zone }: { event: ExplainedEvent; zone: string }) {
  return (
    <li className="px-4 py-3 text-sm">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-medium text-ink-900">{event.title}</span>
        <span className="text-xs text-ink-500">
          {event.startsAt ? timeInZone(event.startsAt, zone) : "all day"}
          {event.minutes ? ` · ${event.minutes}m` : ""}
        </span>
        <span className={`chip ml-auto ${TONE[event.verdict.kind]}`}>
          {LABEL[event.verdict.kind]}
        </span>
      </div>

      <p className="mt-1 text-xs text-ink-600">{event.verdict.detail}</p>

      {event.guests.length > 0 ? (
        <p className="mt-1 text-xs text-ink-400">
          {event.guests.join(", ")}
        </p>
      ) : null}

      {event.meetingId ? (
        <Link
          href={`/meetings/${event.meetingId}`}
          className="mt-1 inline-block text-xs text-brand-700 underline"
        >
          Open it
        </Link>
      ) : null}
    </li>
  );
}
