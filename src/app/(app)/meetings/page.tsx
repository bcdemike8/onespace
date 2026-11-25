import Link from "next/link";
import { isAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, dayInZone, formatMedium, timeInZone, toISODate, today } from "@/lib/dates";
import { getLockState } from "@/lib/lock";
import { isLocked } from "@/lib/periods";
import { calendarWindowLabel, orgTimezone } from "@/lib/google/sync";
import { recentLabel } from "@/lib/recency";
import { googleConfigured } from "@/lib/google/auth";
import { zoomConfigured } from "@/lib/zoom/client";
import { aiConfigured } from "@/lib/ai/summarise";
import { EmptyState, PageHeader } from "@/components/ui";
import { asSummaryDoc } from "@/lib/summary";
import { MeetingCard, type MeetingRow, type ProjectOption } from "./MeetingCard";
import { SyncButton } from "./SyncButton";
import { ReopenButton } from "./ReopenButton";
import { UnmappedDomains } from "./UnmappedDomains";
import { ClearBacklog } from "./ClearBacklog";

export const dynamic = "force-dynamic";

interface Attendee {
  email?: string;
  name?: string | null;
}

/** "1.5" reads better in the duration box than "90m", and parses the same. */
const RANGES: { value: string; label: string; days: number | null }[] = [
  { value: "14", label: "Last 2 weeks", days: 14 },
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "all", label: "All", days: null },
];

function durationValue(minutes: number): string {
  if (minutes % 60 === 0) return String(minutes / 60);
  const quarters = minutes / 15;
  if (Number.isInteger(quarters)) return (minutes / 60).toFixed(2).replace(/0$/, "");
  return `${minutes}m`;
}

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ who?: string; range?: string }>;
}) {
  const user = await requireUser();
  const admin = isAdmin(user);
  const params = await searchParams;
  const everyone = admin && params.who === "all";
  // How far back the waiting list reaches. The last fortnight by default -
  // the same window My Work uses - so "to deal with" is the calls that are
  // actually live. Last 30 days and All are a click away for anything older.
  const range = RANGES.find((r) => r.value === params.range) ?? RANGES[0];
  const rangeFrom =
    range.days === null ? null : new Date(Date.now() - range.days * 86_400_000);
  const hrefFor = (next: { who?: boolean; range?: string }) => {
    const q = new URLSearchParams();
    if (next.who ?? everyone) q.set("who", "all");
    const r = next.range ?? range.value;
    if (r !== RANGES[0].value) q.set("range", r);
    const qs = q.toString();
    return qs ? `/meetings?${qs}` : "/meetings";
  };

  const [zone, lock, calendarWindow, writeUpWindow] = await Promise.all([
    orgTimezone(),
    getLockState(),
    calendarWindowLabel(),
    recentLabel(),
  ]);

  const [
    pending,
    recent,
    dismissed,
    dismissedTotal,
    projects,
    unmapped,
    clientOptions,
    skippedMeetings,
    skippedTotal,
    waiting,
  ] = await Promise.all([
    db.meeting.findMany({
      where: {
        status: "PENDING",
        ...(everyone ? {} : { userId: user.id }),
        ...(rangeFrom ? { startsAt: { gte: rangeFrom } } : {}),
      },
      orderBy: [{ startsAt: "desc" }],
      take: 200,
      select: {
        id: true,
        title: true,
        startsAt: true,
        minutes: true,
        attendees: true,
        externalDomains: true,
        noClient: true,
        suggestedProjectId: true,
        taskId: true,
        matchReason: true,
        confidence: true,
        actualMinutes: true,
        recordingUrl: true,
        summary: true,
        summaryJson: true,
        transcriptNote: true,
        transcriptReadAt: true,
        zoomUuid: true,
        user: { select: { name: true } },
        commitments: {
          where: { status: "PENDING" },
          orderBy: { atSeconds: "asc" },
          select: {
            id: true,
            text: true,
            speaker: true,
            atSeconds: true,
            suggestedTask: true,
            fromSummary: true,
            ownerUnrecognised: true,
          },
        },
      },
    }),
    db.meeting.findMany({
      where: { status: "ACCEPTED", ...(everyone ? {} : { userId: user.id }) },
      orderBy: [{ updatedAt: "desc" }],
      take: 10,
      select: {
        id: true,
        title: true,
        startsAt: true,
        minutes: true,
        summary: true,
        project: { select: { id: true, name: true } },
        user: { select: { name: true } },
      },
    }),
    // Dismissed meetings, which used to go nowhere at all. Pressing "Not
    // billable work" made a call vanish with no way back, and whether
    // something is billable is a decision that changes - a project starts
    // being charged for, an internal call turns out to be client work. It
    // is not a delete, so it does not behave like one.
    db.meeting.findMany({
      where: { status: "DISMISSED", ...(everyone ? {} : { userId: user.id }) },
      orderBy: [{ startsAt: "desc" }],
      take: 50,
      select: {
        id: true,
        title: true,
        startsAt: true,
        minutes: true,
        user: { select: { name: true } },
      },
    }),
    db.meeting.count({
      where: { status: "DISMISSED", ...(everyone ? {} : { userId: user.id }) },
    }),
    db.project.findMany({
      where: { status: { in: ["ACTIVE", "ON_HOLD"] } },
      orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        billingType: true,
        client: { select: { name: true } },
        tasks: {
          where: { status: { not: "DONE" } },
          orderBy: { orderIndex: "asc" },
          select: { id: true, name: true },
        },
      },
    }),
    // What the last sync passed over. This is the answer to "my call from
    // the 2nd isn't here" — the sync only keeps a meeting when somebody in
    // the invite is on a client's domain, and until now it never said so.
    db.unmappedDomain.findMany({
      orderBy: [{ meetings: "desc" }, { domain: "asc" }],
      take: 25,
    }),
    db.client.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    // The passed-over meetings by name. A company-level list cannot name a
    // meeting that had no company in it, and that is the one people hunt for.
    db.skippedMeeting.findMany({
      orderBy: { startsAt: "desc" },
      take: 40,
      select: {
        title: true,
        startsAt: true,
        reason: true,
        code: true,
        user: { select: { name: true } },
      },
    }),
    db.skippedMeeting.count(),
    // Every waiting call in view - yours, or the team's on Everyone - for the
    // backlog control and the "older ones under All" note. The list above is
    // capped and filtered to the range; this is neither.
    db.meeting.findMany({
      where: {
        status: "PENDING",
        startsAt: { lte: new Date() },
        ...(everyone ? {} : { userId: user.id }),
      },
      select: { startsAt: true, user: { select: { name: true } } },
    }),
  ]);

  const options: ProjectOption[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    clientName: p.client?.name ?? null,
    billingType: p.billingType,
    tasks: p.tasks,
  }));

  const now = Date.now();
  const rows: MeetingRow[] = pending
    // A meeting that hasn't happened yet isn't time anyone has spent.
    .filter((m) => m.startsAt.getTime() <= now)
    .map((m) => {
      const day = dayInZone(m.startsAt, zone);
      const attendees = Array.isArray(m.attendees)
        ? (m.attendees as Attendee[]).map((a) => ({
            email: a.email ?? "",
            name: a.name ?? null,
          }))
        : [];

      return {
        id: m.id,
        title: m.title,
        dayLabel: formatMedium(day),
        timeLabel: timeInZone(m.startsAt, zone),
        minutes: m.minutes,
        durationValue: durationValue(m.actualMinutes ?? m.minutes),
        attendees,
        externalDomains: m.externalDomains,
        noClient: m.noClient,
        suggestedProjectId: m.suggestedProjectId,
        suggestedTaskId: m.taskId,
        matchReason: m.matchReason,
        confidence: m.confidence,
        lockedNote: isLocked(day, lock)
          ? `${formatMedium(day)} is in a closed month. Reopen the period on the timesheet to log this, or dismiss it.`
          : null,
        ownerName: everyone ? m.user.name : null,
        actualMinutes: m.actualMinutes,
        recordingUrl: m.recordingUrl,
        summary: m.summary,
        summaryDoc: asSummaryDoc(m.summaryJson),
        transcriptNote: m.transcriptNote,
        transcriptRead: m.transcriptReadAt !== null,
        hasZoom: m.zoomUuid !== null,
        commitments: m.commitments,
      };
    });

  const upcoming = pending.length - rows.length;

  // The backlog control only shows when something of yours is older than the
  // fortnight My Work counts; anything newer is still live work.
  const backlogFrom = toISODate(addDays(today(zone), -14));
  const waitingDays = waiting.map((m) => ({
    day: toISODate(dayInZone(m.startsAt, zone)),
    person: m.user.name,
  }));
  const hasBacklog = waitingDays.some((d) => d.day < backlogFrom);
  const olderWaiting = rangeFrom
    ? waiting.filter((m) => m.startsAt < rangeFrom).length
    : 0;
  // Everyone but an admin now gets their internal meetings too, so the count
  // jumped. Saying how many have no client behind them makes that legible
  // rather than alarming — and they're the ones nobody is paying for.
  const noClient = rows.filter((r) => r.noClient).length;
  // The one number that answers "is the Claude summarising working at all",
  // without opening seventy-five meetings to find out.
  const written = rows.filter((r) => r.summary).length;

  if (!googleConfigured()) {
    return (
      <>
        <PageHeader
          title="Meetings"
          subtitle="Your calendar, waiting to become time entries."
        />
        <EmptyState
          title="Google isn't connected yet"
          body="Once an admin adds the service account credentials in Railway, your client meetings appear here with a project already suggested."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Meetings"
        subtitle={
          rows.length === 0
            ? "Your calendar, waiting to become time entries."
            : `${rows.length} meeting${rows.length === 1 ? "" : "s"} to deal with${
                rangeFrom ? ` from the ${range.label.toLowerCase()}` : ""
              }${
                noClient > 0 ? ` · ${noClient} with no client` : ""
              } · ${written} with a write-up.`
        }
        actions={<SyncButton admin={admin} zoom={zoomConfigured()} />}
      />

      {/* What the syncs are actually looking at. Three settings decide it and
          none of them was visible anywhere, so "why isn't my 2 September call
          here" had no answer on the screen it was being asked on. */}
      <p className="mb-4 text-xs text-ink-500">
        Calendars are read {calendarWindow}; write-ups cover calls{" "}
        {writeUpWindow}.
        {admin ? (
          <>
            {" "}
            <Link href="/meetings/why" className="underline">
              A meeting missing?
            </Link>
          </>
        ) : null}
      </p>

      {/* Admin only, because the fix is an admin's to make — attaching a
          domain to a client changes what everybody sees. */}
      {admin && (unmapped.length > 0 || skippedMeetings.length > 0) ? (
        <UnmappedDomains
          skippedTotal={skippedTotal}
          skipped={skippedMeetings.map((m) => ({
            title: m.title,
            startsAt: m.startsAt,
            reason: m.reason,
            code: m.code,
            personName: m.user.name,
          }))}
          rows={unmapped.map((u) => ({
            domain: u.domain,
            meetings: u.meetings,
            example: u.example,
            people: u.people,
            archivedClientId: u.archivedClientId,
            archivedClientName: u.archivedClientName,
          }))}
          clients={clientOptions}
        />
      ) : null}

      {/* The one fact nothing else on any screen tells you, and the whole
          difference between a write-up and a list of scraped sentences.
          Read at request time, so it reflects what this service actually
          has rather than what was set when it was built. */}
      {zoomConfigured() && !aiConfigured() ? (
        <p className="mb-4 rounded-lg bg-warn-50 px-3 py-2 text-xs text-warn-700">
          Claude isn&apos;t connected on this service, so calls get no
          write-ups and no action items. Set
          ANTHROPIC_API_KEY in Railway on the app service and the cron service
          both, redeploy, then use Re-read transcripts.
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {admin ? (
          <div className="flex gap-2">
            <Link
              href={hrefFor({ who: false })}
              className={everyone ? "btn-ghost btn-sm" : "btn-secondary btn-sm"}
            >
              Mine
            </Link>
            <Link
              href={hrefFor({ who: true })}
              className={everyone ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
            >
              Everyone
            </Link>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-500">Show</span>
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={hrefFor({ range: r.value })}
              className={r.value === range.value ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {hasBacklog ? (
        <ClearBacklog days={waitingDays} defaultBefore={backlogFrom} everyone={everyone} />
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing waiting"
          body={
            rangeFrom
              ? `Nothing waiting from the ${range.label.toLowerCase()}.${
                  olderWaiting > 0
                    ? ` ${olderWaiting} older ${olderWaiting === 1 ? "one is" : "ones are"} still waiting under All.`
                    : ""
                }`
              : upcoming > 0
              ? `${upcoming} meeting${upcoming === 1 ? "" : "s"} still to come. They appear here once they've happened.`
              : "Every meeting on your calendar has been logged or dismissed. Sync again if you've just booked something."
          }
        />
      ) : (
        <ul className="grid gap-3">
          {rows.map((m) => (
            <MeetingCard key={m.id} meeting={m} projects={options} />
          ))}
        </ul>
      )}

      {olderWaiting > 0 && rows.length > 0 ? (
        <p className="mt-4 text-xs text-ink-500">
          {olderWaiting} older {olderWaiting === 1 ? "meeting is" : "meetings are"} still
          waiting.{" "}
          <Link href={hrefFor({ range: "all" })} className="underline">
            Show all
          </Link>
        </p>
      ) : null}

      {upcoming > 0 && rows.length > 0 ? (
        <p className="mt-4 text-xs text-ink-500">
          {upcoming} more on the calendar that {upcoming === 1 ? "hasn't" : "haven't"} happened yet.
        </p>
      ) : null}

      {recent.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold text-ink-900">Recently logged</h2>
          <ul className="card divide-y divide-ink-100">
            {recent.map((m) => (
              <li key={m.id} className="px-4 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/meetings/${m.id}`}
                    className="text-ink-800 hover:text-brand-700 hover:underline"
                  >
                    {m.title}
                  </Link>
                  <span className="text-xs text-ink-500">
                    {formatMedium(dayInZone(m.startsAt, zone))}
                    {m.project ? ` · ${m.project.name}` : ""}
                    {everyone ? ` · ${m.user.name}` : ""}
                  </span>
                  <span className="ml-auto">
                    <ReopenButton id={m.id} />
                  </span>
                </div>
                {m.summary ? (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-ink-500 hover:text-ink-800">
                      What the call was about
                    </summary>
                    <p className="mt-1 whitespace-pre-wrap border-l-2 border-ink-200 pl-2 text-sm leading-relaxed text-ink-700">
                      {m.summary}
                    </p>
                    {m.project ? (
                      <Link
                        href={`/projects/${m.project.id}`}
                        className="mt-1 inline-block text-xs text-brand-700 hover:underline"
                      >
                        All calls on {m.project.name} →
                      </Link>
                    ) : null}
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Where "Not billable work" puts things.
          Rolled up, because on a normal day nobody wants to read it — but
          present, with a count, because the alternative was a call
          disappearing off the screen with no way to change your mind. */}
      {dismissed.length > 0 ? (
        <details className="card group mt-8 overflow-hidden p-0">
          <summary className="flex cursor-pointer list-none items-baseline gap-2 px-4 py-3 hover:bg-ink-50 [&::-webkit-details-marker]:hidden">
            <span
              aria-hidden
              className="inline-block w-3 shrink-0 text-ink-400 transition-transform group-open:rotate-90"
            >
              ▸
            </span>
            <h2 className="text-sm font-semibold text-ink-900">Not billable</h2>
            <span className="text-xs text-ink-500">
              {dismissedTotal.toLocaleString()}{" "}
              {dismissedTotal === 1 ? "meeting" : "meetings"} you set aside
            </span>
          </summary>

          <ul className="divide-y divide-ink-100 border-t border-ink-100">
            {dismissed.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-2 px-4 py-2 text-sm"
              >
                <Link
                  href={`/meetings/${m.id}`}
                  className="text-ink-800 hover:text-brand-700 hover:underline"
                >
                  {m.title}
                </Link>
                <span className="text-xs text-ink-500">
                  {formatMedium(dayInZone(m.startsAt, zone))} · {m.minutes}m
                  {everyone ? ` · ${m.user.name}` : ""}
                </span>
                <span className="ml-auto">
                  <ReopenButton id={m.id} dismissed />
                </span>
              </li>
            ))}
          </ul>

          <p className="border-t border-ink-100 px-4 py-2 text-xs text-ink-500">
            {dismissedTotal > dismissed.length
              ? `The ${dismissed.length} most recent of ${dismissedTotal.toLocaleString()}. `
              : ""}
            Nothing here is logged against a project or a client.
            &ldquo;Billable after all&rdquo; puts one back at the top of this
            page to be dealt with.
          </p>
        </details>
      ) : null}

    </>
  );
}
