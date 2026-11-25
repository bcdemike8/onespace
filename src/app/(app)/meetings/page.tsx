import Link from "next/link";
import { isAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  addDays,
  dayInZone,
  formatMedium,
  formatShort,
  formatWeekday,
  timeInZone,
  toISODate,
  today,
  weekStart,
} from "@/lib/dates";
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
import { AllMeetings, type AllMeetingRow, type MeetingWeek } from "./AllMeetings";
import { timesheetOnDay } from "@/lib/timesheet-on-day";
import { meetingsFromBound, meetingsFromDay, onOrAfterStart } from "@/lib/meetings-start";

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
  searchParams: Promise<{ who?: string; range?: string; weeks?: string; removed?: string }>;
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
  // Nothing before the tab's start date (1 November) is listed, counted or
  // offered to clear. A day early for the query; each list then checks the
  // day in the org's zone.
  const startBound = meetingsFromBound();
  const startDay = meetingsFromDay();
  const fromBound = rangeFrom && rangeFrom > startBound ? rangeFrom : startBound;
  // All is a different page in all but name: not the to-do list but the
  // record of every call, week by week, logged or not. It reads back a few
  // weeks at a time, because a year of seven people's calendars is not a
  // list anybody scrolls.
  const isAll = range.days === null;
  const weeksShown = Math.min(Math.max(Number(params.weeks) || 8, 1), 104);
  // Removed meetings - blocks, appointments - are out of All unless asked for.
  const showRemoved = isAll && params.removed === "1";
  const hrefFor = (next: { who?: boolean; range?: string; removed?: boolean }) => {
    const q = new URLSearchParams();
    if (next.who ?? everyone) q.set("who", "all");
    const r = next.range ?? range.value;
    if (r !== RANGES[0].value) q.set("range", r);
    if (r === "all" && (next.removed ?? showRemoved)) q.set("removed", "1");
    const qs = q.toString();
    return qs ? `/meetings?${qs}` : "/meetings";
  };

  const [zone, lock, calendarWindow, writeUpWindow] = await Promise.all([
    orgTimezone(),
    getLockState(),
    calendarWindowLabel(),
    recentLabel(),
  ]);
  // Never further back than the week the start date falls in.
  const requestedFrom = addDays(weekStart(today(zone)), -7 * (weeksShown - 1));
  const allFromDay =
    requestedFrom < weekStart(startDay) ? weekStart(startDay) : requestedFrom;
  const notRemoved = { OR: [{ setAside: null }, { setAside: { not: "REMOVED" as const } }] };

  const [
    pending,
    recent,
    history,
    earlier,
    projects,
    unmapped,
    clientOptions,
    skippedMeetings,
    skippedTotal,
    upcoming,
    waiting,
    removedCount,
  ] = await Promise.all([
    // Only calls that have happened. The sync reads a fortnight ahead, and
    // now that calendar blocks and internal meetings come in too, the
    // upcoming ones alone can fill the cap - newest-first, they were taking
    // every one of the 200 places before a single past call was read.
    db.meeting.findMany({
      where: {
        status: "PENDING",
        ...(everyone ? {} : { userId: user.id }),
        startsAt: { gte: fromBound, lte: new Date() },
      },
      orderBy: [{ startsAt: "desc" }],
      take: isAll ? 0 : 200,
      select: {
        id: true,
        userId: true,
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
      where: {
        status: "ACCEPTED",
        startsAt: { gte: startBound },
        ...(everyone ? {} : { userId: user.id }),
      },
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
    // Every call in the weeks the All view shows, whatever became of it.
    db.meeting.findMany({
      where: {
        ...(everyone ? {} : { userId: user.id }),
        startsAt: { gte: addDays(allFromDay, -1), lte: new Date() },
        ...(showRemoved ? {} : notRemoved),
      },
      orderBy: [{ startsAt: "desc" }],
      take: isAll ? 5000 : 0,
      select: {
        id: true,
        userId: true,
        title: true,
        startsAt: true,
        minutes: true,
        actualMinutes: true,
        status: true,
        loggedByHand: true,
        setAside: true,
        noClient: true,
        suggestedProjectId: true,
        project: { select: { name: true } },
        timeEntry: {
          select: { minutes: true, billable: true, date: true, project: { select: { name: true } } },
        },
        user: { select: { name: true } },
      },
    }),
    // Whether there is anything before the first week shown, for "Show
    // earlier weeks".
    db.meeting.count({
      where: {
        ...(everyone ? {} : { userId: user.id }),
        startsAt: { lt: addDays(allFromDay, -1), gte: startBound },
        ...(showRemoved ? {} : notRemoved),
      },
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
    db.meeting.count({
      where: {
        status: "PENDING",
        ...(everyone ? {} : { userId: user.id }),
        startsAt: { gt: new Date() },
      },
    }),
    // Every waiting call in view - yours, or the team's on Everyone - for the
    // backlog control and the "older ones under All" note. The list above is
    // capped and filtered to the range; this is neither.
    db.meeting.findMany({
      where: {
        status: "PENDING",
        startsAt: { lte: new Date(), gte: startBound },
        ...(everyone ? {} : { userId: user.id }),
      },
      select: { startsAt: true, user: { select: { name: true } } },
    }),
    db.meeting.count({
      where: {
        setAside: "REMOVED",
        startsAt: { gte: startBound },
        ...(everyone ? {} : { userId: user.id }),
      },
    }),
  ]);
  const waitingFromStart = waiting.filter((m) => onOrAfterStart(m.startsAt, zone));

  const options: ProjectOption[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    clientName: p.client?.name ?? null,
    billingType: p.billingType,
    tasks: p.tasks,
  }));

  // What each person already has on the timesheet on the day of each call
  // still open, so "Already logged" can be pressed knowing it's true rather
  // than from memory. Only for the calls that can still take that button.
  const handLogged = await timesheetOnDay(
    [
      ...pending.map((m) => ({ userId: m.userId, startsAt: m.startsAt })),
      ...history
        .filter((m) => m.status !== "ACCEPTED")
        .map((m) => ({ userId: m.userId, startsAt: m.startsAt })),
    ],
    zone,
  );

  const rows: MeetingRow[] = pending
    .filter((m) => onOrAfterStart(m.startsAt, zone))
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
      timesheetNote: handLogged(m.userId, m.startsAt),
    };
    });

  const weekGroups = new Map<string, MeetingWeek>();
  // The timesheet line goes on the first open call of each person's day,
  // not under every one: on a seven-meeting day it was the same line seven
  // times.
  const notedDays = new Set<string>();
  for (const m of history) {
    const day = dayInZone(m.startsAt, zone);
    if (day < allFromDay || day < startDay) continue;
    const monday = weekStart(day);
    const key = toISODate(monday);
    let week = weekGroups.get(key);
    if (!week) {
      week = {
        key,
        label: `Week of ${formatShort(monday)} – ${formatMedium(addDays(monday, 6))}`,
        rows: [],
      };
      weekGroups.set(key, week);
    }
    const entry = m.timeEntry;
    const row: AllMeetingRow = {
      id: m.id,
      title: m.title,
      whenLabel: `${formatWeekday(day)}, ${formatShort(day)} · ${timeInZone(m.startsAt, zone)}`,
      minutes: entry?.minutes ?? m.actualMinutes ?? m.minutes,
      status: m.status,
      loggedByHand: m.loggedByHand,
      noClient: m.noClient,
      setAside: m.setAside,
      timesheetNote: (() => {
        if (m.status === "ACCEPTED" || m.setAside === "REMOVED") return null;
        const k = `${m.userId}|${toISODate(day)}`;
        if (notedDays.has(k)) return null;
        notedDays.add(k);
        return handLogged(m.userId, m.startsAt);
      })(),
      projectName:
        entry?.project.name ??
        m.project?.name ??
        (m.suggestedProjectId ? (options.find((o) => o.id === m.suggestedProjectId)?.name ?? null) : null),
      nonBillableEntry: entry ? !entry.billable : false,
      hasEntry: entry !== null,
      locked: entry ? isLocked(entry.date, lock) : false,
      ownerName: everyone ? m.user.name : null,
    };
    week.rows.push(row);
  }
  const weeks = [...weekGroups.values()];
  // From the rows actually shown, so the header adds up to the weeks below.
  const shown = weeks.flatMap((w) => w.rows);
  const decidedAside = shown.filter((r) => r.status === "DISMISSED" && r.setAside === null);
  const allCounts = {
    logged: shown.filter((r) => r.status === "ACCEPTED" && !r.loggedByHand).length,
    manual: shown.filter((r) => r.loggedByHand).length,
    internal: decidedAside.filter((r) => r.noClient).length,
    notBillable: decidedAside.filter((r) => !r.noClient).length,
    cleared: shown.filter((r) => r.setAside === "BACKLOG").length,
    waiting: shown.filter((r) => r.status === "PENDING").length,
  };
  const moreHref =
    earlier > 0
      ? `${hrefFor({ range: "all" })}&weeks=${weeksShown + 8}`
      : null;
  const removedHref = hrefFor({ range: "all", removed: !showRemoved });


  // The backlog control only shows when something of yours is older than the
  // fortnight My Work counts; anything newer is still live work.
  const backlogFrom = toISODate(addDays(today(zone), -14));
  const waitingDays = waitingFromStart.map((m) => ({
    day: toISODate(dayInZone(m.startsAt, zone)),
    person: m.user.name,
  }));
  const hasBacklog = waitingDays.some((d) => d.day < backlogFrom);
  const olderWaiting = rangeFrom
    ? waitingFromStart.filter((m) => m.startsAt < rangeFrom).length
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
          isAll
            ? `Every meeting since ${formatMedium(startDay)}, week by week · ${allCounts.logged} logged${
                allCounts.manual > 0 ? ` · ${allCounts.manual} manually logged` : ""
              } · ${allCounts.internal} internal · ${allCounts.notBillable} not billable${
                allCounts.cleared > 0 ? ` · ${allCounts.cleared} cleared` : ""
              }${allCounts.waiting > 0 ? ` · ${allCounts.waiting} not logged yet` : ""}`
            : rows.length === 0
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

      <ClearBacklog
        show={hasBacklog}
        days={waitingDays}
        defaultBefore={backlogFrom}
        everyone={everyone}
      />

      {isAll ? (
        <AllMeetings
          weeks={weeks}
          moreHref={moreHref}
          removedCount={removedCount}
          showingRemoved={showRemoved}
          removedHref={removedHref}
        />
      ) : rows.length === 0 ? (
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

      {!isAll && recent.length > 0 ? (
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

      {/* Logged and set-aside calls used to trail off the bottom of this page
          in two lists of their own. They live in All now, week by week, where
          any of them can be changed. */}
      {!isAll ? (
        <p className="mt-8 text-xs text-ink-500">
          Meetings you&apos;ve logged or marked not billable are under{" "}
          <Link href={hrefFor({ range: "all" })} className="underline">
            All
          </Link>
          , week by week, where you can change either. The tab starts on{" "}
          {formatMedium(startDay)}; earlier calls aren&apos;t shown.
        </p>
      ) : null}

    </>
  );
}
