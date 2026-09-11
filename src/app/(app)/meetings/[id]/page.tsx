import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  dayInZone,
  formatMedium,
  relativeDueLabel,
  timeInZone,
  today,
} from "@/lib/dates";
import { getLockState } from "@/lib/lock";
import { isLocked } from "@/lib/periods";
import { orgTimezone } from "@/lib/google/sync";
import { PageHeader } from "@/components/ui";
import { CallSummary } from "@/components/CallSummary";
import { asSummaryDoc } from "@/lib/summary";
import { DiagnoseZoom } from "./DiagnoseZoom";
import { MeetingCard, type MeetingRow, type ProjectOption } from "../MeetingCard";

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

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * One call, in full.
 *
 * The list has to stay skimmable, so the card shows a summary folded away
 * and the first few guests. This is where you come when the call is the
 * thing you care about: the whole write-up open, everyone who was there,
 * what it turned into, and what is still waiting on a decision.
 */
export default async function MeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const admin = isAdmin(user);

  const meeting = await db.meeting.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, client: { select: { name: true } } } },
      task: { select: { id: true, name: true } },
      timeEntry: { select: { id: true, minutes: true, billable: true, date: true } },
      commitments: {
        orderBy: [{ status: "asc" }, { atSeconds: "asc" }],
        select: {
          id: true,
          text: true,
          speaker: true,
          atSeconds: true,
          suggestedTask: true,
          fromSummary: true,
          source: true,
          status: true,
          dueDate: true,
          dueStated: true,
          task: {
            select: {
              id: true,
              name: true,
              status: true,
              dueDate: true,
              projectId: true,
              assignee: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!meeting) notFound();
  // Someone else's call is someone else's business.
  if (meeting.userId !== user.id && !admin) notFound();

  const [zone, lock] = await Promise.all([orgTimezone(), getLockState()]);
  const day = dayInZone(meeting.startsAt, zone);
  const now = today();

  const attendees = Array.isArray(meeting.attendees)
    ? (meeting.attendees as Attendee[]).filter((a) => a.email)
    : [];

  const doc = asSummaryDoc(meeting.summaryJson);
  const pending = meeting.commitments.filter((c) => c.status === "PENDING");
  const accepted = meeting.commitments.filter((c) => c.task !== null);

  const projects =
    meeting.status === "PENDING"
      ? await db.project.findMany({
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
        })
      : [];

  const options: ProjectOption[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    clientName: p.client?.name ?? null,
    billingType: p.billingType,
    tasks: p.tasks,
  }));

  // The card carries the confirm-or-dismiss controls, so a call that hasn't
  // been dealt with can be dealt with here rather than sending someone back
  // to the list to find it again.
  const row: MeetingRow = {
    id: meeting.id,
    title: meeting.title,
    dayLabel: formatMedium(day),
    timeLabel: timeInZone(meeting.startsAt, zone),
    minutes: meeting.minutes,
    durationValue: durationValue(meeting.actualMinutes ?? meeting.minutes),
    attendees: attendees.map((a) => ({ email: a.email ?? "", name: a.name ?? null })),
    externalDomains: meeting.externalDomains,
    suggestedProjectId: meeting.suggestedProjectId,
    suggestedTaskId: meeting.taskId,
    matchReason: meeting.matchReason,
    confidence: meeting.confidence,
    lockedNote: isLocked(day, lock)
      ? `${formatMedium(day)} is in a closed month. Reopen the period on the timesheet to log this, or dismiss it.`
      : null,
    ownerName: admin && meeting.userId !== user.id ? meeting.user.name : null,
    actualMinutes: meeting.actualMinutes,
    recordingUrl: meeting.recordingUrl,
    // Shown in full below rather than folded into the card.
    summary: null,
    summaryDoc: null,
    commitments: pending.map((c) => ({
      id: c.id,
      text: c.text,
      speaker: c.speaker,
      atSeconds: c.atSeconds,
      suggestedTask: c.suggestedTask,
      fromSummary: c.fromSummary,
    })),
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={meeting.title}
        subtitle={
          <>
            {formatMedium(day)} · {timeInZone(meeting.startsAt, zone)} ·{" "}
            {meeting.actualMinutes !== null &&
            meeting.actualMinutes !== meeting.minutes ? (
              <>
                {formatMinutes(meeting.actualMinutes)}{" "}
                <span className="text-ink-400">
                  (booked {formatMinutes(meeting.minutes)})
                </span>
              </>
            ) : (
              formatMinutes(meeting.minutes)
            )}
            {" · "}
            {meeting.user.name}
          </>
        }
        actions={
          <Link href="/meetings" className="btn-secondary">
            All meetings
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
        {meeting.project ? (
          <Link
            href={`/projects/${meeting.project.id}`}
            className="chip bg-good-50 text-good-700 hover:underline"
          >
            {meeting.project.client?.name
              ? `${meeting.project.client.name} — `
              : ""}
            {meeting.project.name}
          </Link>
        ) : (
          <span className="chip bg-warn-50 text-warn-700">Not filed yet</span>
        )}
        {meeting.timeEntry ? (
          <span>
            {formatMinutes(meeting.timeEntry.minutes)} logged
            {meeting.timeEntry.billable ? "" : ", non-billable"}
          </span>
        ) : null}
        {meeting.recordingUrl ? (
          <a
            href={meeting.recordingUrl}
            target="_blank"
            rel="noopener"
            className="text-brand-700 hover:underline"
          >
            Recording ↗
          </a>
        ) : null}
        {meeting.summarisedAt ? (
          <span>Written up {formatMedium(meeting.summarisedAt)}</span>
        ) : null}
      </div>

      {/* ------------------------------------------------------- the write-up */}
      <section className="card mb-4 p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">
          What the call was about
        </h2>
        {doc ? (
          <CallSummary doc={doc} text={meeting.summary} />
        ) : meeting.summary ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
            {meeting.summary}
          </p>
        ) : (
          <>
            <p className="text-sm text-ink-500">
              {meeting.transcriptNote ??
                "No write-up for this one. Summaries come from a cloud recording with transcription switched on — a call without one has nothing to read."}
            </p>
            {admin && meeting.zoomUuid ? <DiagnoseZoom id={meeting.id} /> : null}
          </>
        )}
      </section>

      {/* ------------------------------------------------- tasks it turned into */}
      {accepted.length > 0 ? (
        <section className="card mb-4 overflow-hidden">
          <h2 className="border-b border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-900">
            Tasks from this call
          </h2>
          <ul className="divide-y divide-ink-100">
            {accepted.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                <Link
                  href={`/projects/${c.task!.projectId}`}
                  className="text-sm text-ink-900 hover:text-brand-700"
                >
                  {c.task!.name}
                </Link>
                <span
                  className={`chip ${
                    c.task!.status === "DONE"
                      ? "bg-good-50 text-good-700"
                      : c.task!.status === "BLOCKED"
                        ? "bg-bad-50 text-bad-700"
                        : "bg-ink-100 text-ink-600"
                  }`}
                >
                  {c.task!.status === "IN_PROGRESS"
                    ? "In progress"
                    : c.task!.status.charAt(0) + c.task!.status.slice(1).toLowerCase()}
                </span>
                <span className="text-xs text-ink-500">
                  {c.task!.assignee?.name ?? "Unassigned"}
                  {c.task!.dueDate
                    ? ` · ${relativeDueLabel(c.task!.dueDate, now)}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ------------------------------------ still waiting on a decision */}
      {meeting.status === "PENDING" ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink-900">
            Log this as time
          </h2>
          {meeting.matchReason ? (
            <p className="mb-2 text-xs text-ink-500">{meeting.matchReason}</p>
          ) : null}
          <ul className="grid gap-3">
            <MeetingCard meeting={row} projects={options} hideHeader />
          </ul>
        </section>
      ) : pending.length > 0 ? (
        <section className="card p-4">
          <h2 className="mb-1 text-sm font-semibold text-ink-900">
            Still to decide
          </h2>
          <p className="mb-3 text-xs text-ink-500">
            {pending.length} thing{pending.length === 1 ? "" : "s"} said on this
            call that nobody has turned into a task or dismissed.
          </p>
          <ul className="grid gap-2">
            {pending.map((c) => (
              <li key={c.id} className="text-sm text-ink-700">
                {c.suggestedTask}
                {c.dueDate ? (
                  <span className="ml-2 text-xs text-ink-500">
                    {relativeDueLabel(c.dueDate, now)}
                    {c.dueStated ? "" : " (no date given)"}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-500">
            These are offered on{" "}
            <Link href="/" className="text-brand-700 hover:underline">
              My work
            </Link>
            , where they can be turned into tasks.
          </p>
        </section>
      ) : null}

      {/* ------------------------------------------------------- who was there */}
      <section className="card mt-4 p-4">
        <h2 className="mb-2 text-sm font-semibold text-ink-900">
          Who was there
        </h2>
        {attendees.length === 0 ? (
          <p className="text-sm text-ink-500">
            No guests — a block on {meeting.user.name}&apos;s own calendar.
          </p>
        ) : (
          <ul className="grid gap-1 text-sm text-ink-700">
            {attendees.map((a) => (
              <li key={a.email} className="flex flex-wrap items-baseline gap-2">
                <span>{a.name || a.email}</span>
                {a.name ? (
                  <span className="text-xs text-ink-500">{a.email}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
