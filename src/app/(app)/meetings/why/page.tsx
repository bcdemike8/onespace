import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { dayStart, formatMedium, timeInZone, toISODate } from "@/lib/dates";
import { orgTimezone, calendarWindowLabel } from "@/lib/google/sync";
import { explainDay, type ExplainedEvent } from "@/lib/google/explain";
import { PageHeader } from "@/components/ui";

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

  const [people, zone, window] = await Promise.all([
    db.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    orgTimezone(),
    calendarWindowLabel(),
  ]);

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
