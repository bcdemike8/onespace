import Link from "next/link";
import { isAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dayInZone, formatMedium, timeInZone } from "@/lib/dates";
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

export const dynamic = "force-dynamic";

interface Attendee {
  email?: string;
  name?: string | null;
}

/** "1.5" reads better in the duration box than "90m", and parses the same. */
function durationValue(minutes: number): string {
  if (minutes % 60 === 0) return String(minutes / 60);
  const quarters = minutes / 15;
  if (Number.isInteger(quarters)) return (minutes / 60).toFixed(2).replace(/0$/, "");
  return `${minutes}m`;
}

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ who?: string }>;
}) {
  const user = await requireUser();
  const admin = isAdmin(user);
  const params = await searchParams;
  const everyone = admin && params.who === "all";

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
  ] = await Promise.all([
    db.meeting.findMany({
      where: { status: "PENDING", ...(everyone ? {} : { userId: user.id }) },
      orderBy: [{ startsAt: "desc" }],
      take: 200,
      select: {
        id: true,
        title: true,
        startsAt: true,
        minutes: true,
        attendees: true,
        externalDomains: true,
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
            : `${rows.length} meeting${rows.length === 1 ? "" : "s"} to deal with · ${written} with a write-up.`
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
      {admin && unmapped.length > 0 ? (
        <UnmappedDomains
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
          Claude isn&apos;t connected on this service, so calls are being
          scanned with the old pattern rules and no write-ups are stored. Set
          ANTHROPIC_API_KEY in Railway on the app service and the cron service
          both, redeploy, then use Re-read transcripts.
        </p>
      ) : null}

      {admin ? (
        <div className="mb-4 flex gap-2 text-sm">
          <Link
            href="/meetings"
            className={everyone ? "btn-ghost btn-sm" : "btn-secondary btn-sm"}
          >
            Mine
          </Link>
          <Link
            href="/meetings?who=all"
            className={everyone ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
          >
            Everyone
          </Link>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing waiting"
          body={
            upcoming > 0
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
