import Link from "next/link";
import { isAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dayInZone, formatMedium, timeInZone } from "@/lib/dates";
import { getLockState } from "@/lib/lock";
import { isLocked } from "@/lib/periods";
import { orgTimezone } from "@/lib/google/sync";
import { googleConfigured } from "@/lib/google/auth";
import { zoomConfigured } from "@/lib/zoom/client";
import { EmptyState, PageHeader } from "@/components/ui";
import { MeetingCard, type MeetingRow, type ProjectOption } from "./MeetingCard";
import { SyncButton } from "./SyncButton";
import { ReopenButton } from "./ReopenButton";

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

  const [zone, lock] = await Promise.all([orgTimezone(), getLockState()]);

  const [pending, recent, projects] = await Promise.all([
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
        project: { select: { name: true } },
        user: { select: { name: true } },
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
        commitments: m.commitments,
      };
    });

  const upcoming = pending.length - rows.length;

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
            : `${rows.length} meeting${rows.length === 1 ? "" : "s"} to deal with.`
        }
        actions={<SyncButton admin={admin} zoom={zoomConfigured()} />}
      />

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
              <li key={m.id} className="flex flex-wrap items-center gap-2 px-4 py-2 text-sm">
                <span className="text-ink-800">{m.title}</span>
                <span className="text-xs text-ink-500">
                  {formatMedium(dayInZone(m.startsAt, zone))}
                  {m.project ? ` · ${m.project.name}` : ""}
                  {everyone ? ` · ${m.user.name}` : ""}
                </span>
                <span className="ml-auto">
                  <ReopenButton id={m.id} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
