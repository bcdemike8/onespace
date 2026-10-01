import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, dayStart, formatMedium, toISODate } from "@/lib/dates";
import { HealthChip } from "@/components/HealthChip";
import { PageHeader, Stat } from "@/components/ui";
import {
  type Activity,
  RAG_LABEL,
  gapLabel,
  gapOf,
  renderUpdate,
  weekEndingThursday,
} from "@/lib/rocketlane";
import { searchText } from "@/lib/search";
import { CopyBlock } from "./CopyBlock";
import { MeetingNotes, type MeetingRow } from "./MeetingNotes";
import { WeeklyList, type WeeklyRow } from "./WeeklyList";

export const dynamic = "force-dynamic";

/**
 * The Thursday report: one RocketLane update per live project, filled in.
 *
 * RevOptics files these weekly against a fixed template, and the fields that
 * change week to week are a small part of it - the use cases, the KPIs, the
 * Amplify agents in scope are all true for months. So the page assembles each
 * block from the project, that week's status update and what OneSpace watched
 * happen, and leaves the template's own prompts in anything nobody has said.
 *
 * Projects nobody updated are the point of the page rather than an omission.
 * They appear first, flagged, with a draft built from the week's hours, closed
 * tasks and meetings - something to correct instead of a blank page, and an
 * honest answer for a week where nothing happened.
 */
export default async function WeeklyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const week = weekEndingThursday(
    params.week ? dayStart(params.week) : new Date(),
  );
  // The window runs to the end of its last day, so Thursday's own work counts.
  const windowEnd = addDays(week.to, 1);

  const projects = await db.project.findMany({
    where: { status: { in: ["ACTIVE", "ON_HOLD"] } },
    select: {
      id: true,
      name: true,
      status: true,
      useCases: true,
      kpis: true,
      isAmplify: true,
      amplifyStatus: true,
      amplifyProduct: true,
      amplifyDataProvider: true,
      amplifyCompetitor: true,
      evaluationStartDate: true,
      evaluationDueDate: true,
      client: { select: { name: true } },
      owner: { select: { name: true } },
      // The one update that speaks to this week, and the latest of any age -
      // the first fills the report, the second says how stale it is.
      statusUpdates: {
        where: { date: { gte: week.from, lte: week.to } },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: {
          health: true,
          date: true,
          note: true,
          ragReasons: true,
          painPoints: true,
          risk: true,
          nextSteps: true,
          customerQuotes: true,
          baselineMetrics: true,
          projectMetrics: true,
          author: { select: { name: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const ids = projects.map((p) => p.id);

  const [latest, time, done, dueNext, overdue, meetings] = await Promise.all([
    db.statusUpdate.findMany({
      where: { projectId: { in: ids } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: { projectId: true, date: true },
    }),
    db.timeEntry.findMany({
      where: { projectId: { in: ids }, date: { gte: week.from, lte: week.to } },
      select: {
        projectId: true,
        minutes: true,
        user: { select: { name: true } },
      },
    }),
    db.task.findMany({
      where: {
        projectId: { in: ids },
        status: "DONE",
        updatedAt: { gte: week.from, lt: windowEnd },
      },
      select: { projectId: true, name: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.task.findMany({
      where: {
        projectId: { in: ids },
        status: { not: "DONE" },
        dueDate: { gte: week.to, lte: addDays(week.to, 7) },
      },
      select: { projectId: true, name: true },
      orderBy: { dueDate: "asc" },
    }),
    db.task.findMany({
      where: {
        projectId: { in: ids },
        status: { not: "DONE" },
        dueDate: { gte: week.from, lt: week.to },
      },
      select: { projectId: true, name: true },
      orderBy: { dueDate: "asc" },
    }),
    // The calls themselves, not a count: what was said on them is the best
    // material anyone has for writing the week up. The transcript is never
    // stored - `summary` is the write-up that replaces it.
    db.meeting.findMany({
      where: {
        projectId: { in: ids },
        startsAt: { gte: week.from, lt: windowEnd },
        // One row per attendee, so take the organiser's copy where there is
        // one; otherwise every call appears as many times as RevOptics had
        // people in it.
        status: { not: "DISMISSED" },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        projectId: true,
        title: true,
        startsAt: true,
        minutes: true,
        actualMinutes: true,
        summary: true,
        recordingUrl: true,
        transcriptNote: true,
        isOrganizer: true,
        googleId: true,
        zoomUuid: true,
        commitments: {
          where: { status: { not: "DISMISSED" } },
          orderBy: { atSeconds: "asc" },
          select: {
            id: true,
            suggestedTask: true,
            speaker: true,
            dueDate: true,
            dueStated: true,
          },
        },
      },
    }),
  ]);

  const lastUpdateBy = new Map<string, Date>();
  for (const u of latest) {
    if (!lastUpdateBy.has(u.projectId)) lastUpdateBy.set(u.projectId, u.date);
  }

  // Minutes per person per project, so the draft can say who did the work.
  const minutesBy = new Map<string, Map<string, number>>();
  for (const e of time) {
    const forProject = minutesBy.get(e.projectId) ?? new Map<string, number>();
    const who = e.user?.name ?? "Unassigned";
    forProject.set(who, (forProject.get(who) ?? 0) + e.minutes);
    minutesBy.set(e.projectId, forProject);
  }

  const names = (rows: { projectId: string; name: string }[], id: string) =>
    rows.filter((r) => r.projectId === id).map((r) => r.name);

  // A meeting with four RevOptics people on it is four rows, one per
  // calendar. Collapse on the event id, preferring the organiser's copy and
  // then whichever has a write-up — the same call, listed once.
  const bestByEvent = new Map<string, (typeof meetings)[number]>();
  for (const m of meetings) {
    const key = m.googleId ?? m.zoomUuid ?? m.id;
    const seen = bestByEvent.get(key);
    const better =
      !seen ||
      (m.isOrganizer && !seen.isOrganizer) ||
      (!!m.summary && !seen.summary);
    if (better) bestByEvent.set(key, m);
  }

  const meetingsBy = new Map<string, (typeof meetings)[number][]>();
  for (const m of bestByEvent.values()) {
    if (!m.projectId) continue;
    meetingsBy.set(m.projectId, [...(meetingsBy.get(m.projectId) ?? []), m]);
  }

  const rows = projects.map((p) => {
    const perPerson = minutesBy.get(p.id) ?? new Map<string, number>();
    const calls = meetingsBy.get(p.id) ?? [];
    const activity: Activity = {
      minutes: [...perPerson.values()].reduce((a, b) => a + b, 0),
      people: [...perPerson.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([who]) => who),
      tasksCompleted: names(done, p.id).slice(0, 6),
      tasksDueNext: names(dueNext, p.id).slice(0, 5),
      tasksOverdue: names(overdue, p.id).slice(0, 5),
      meetings: calls.map((m) => ({
        title: m.title,
        date: m.startsAt,
        minutes: m.actualMinutes ?? m.minutes,
        recorded: Boolean(m.recordingUrl),
        summary: m.summary,
        note: m.transcriptNote,
      })),
      commitments: calls.flatMap((m) =>
        m.commitments.map((c) => ({
          task: c.suggestedTask,
          speaker: c.speaker,
          dueDate: c.dueDate,
          dueStated: c.dueStated,
        })),
      ),
    };

    const u = p.statusUpdates[0] ?? null;
    const gap = gapOf(lastUpdateBy.get(p.id) ?? null, week);

    return {
      id: p.id,
      name: p.name,
      clientName: p.client?.name ?? null,
      ownerName: p.owner?.name ?? null,
      health: u?.health ?? null,
      gap,
      activity,
      search: searchText(p.name, p.client?.name, p.owner?.name),
      meetingRows: calls.map(
        (m): MeetingRow => ({
          id: m.id,
          title: m.title,
          dateLabel: formatMedium(m.startsAt),
          minutes: m.actualMinutes ?? m.minutes,
          recordingUrl: m.recordingUrl,
          summary: m.summary,
          note: m.transcriptNote,
          commitments: m.commitments.map((c) => ({
            id: c.id,
            task: c.suggestedTask,
            speaker: c.speaker,
            // Only a date somebody actually said. An invented one reads as a
            // deadline that was agreed, and it wasn't.
            when:
              c.dueDate && c.dueStated ? `by ${formatMedium(c.dueDate)}` : null,
          })),
        }),
      ),
      text: renderUpdate({
        project: {
          name: p.name,
          clientName: p.client?.name ?? null,
          status: p.status,
          ownerName: p.owner?.name ?? null,
          useCases: p.useCases,
          kpis: p.kpis,
          isAmplify: p.isAmplify,
          amplifyStatus: p.amplifyStatus,
          amplifyProduct: p.amplifyProduct,
          amplifyDataProvider: p.amplifyDataProvider,
          amplifyCompetitor: p.amplifyCompetitor,
          evaluationStartDate: p.evaluationStartDate,
          evaluationDueDate: p.evaluationDueDate,
        },
        update: u
          ? {
              health: u.health,
              date: u.date,
              authorName: u.author?.name ?? null,
              note: u.note,
              ragReasons: u.ragReasons,
              painPoints: u.painPoints,
              risk: u.risk,
              nextSteps: u.nextSteps,
              customerQuotes: u.customerQuotes,
              baselineMetrics: u.baselineMetrics,
              projectMetrics: u.projectMetrics,
            }
          : null,
        activity,
        week,
        draft: true,
      }),
    };
  });

  // Missing first. A project nobody wrote up is the one this page is for.
  rows.sort(
    (a, b) =>
      Number(b.gap.missing) - Number(a.gap.missing) ||
      (b.gap.daysSince ?? 1e9) - (a.gap.daysSince ?? 1e9) ||
      a.name.localeCompare(b.name),
  );

  const missing = rows.filter((r) => r.gap.missing);
  const spread = {
    ON_TRACK: rows.filter((r) => r.health === "ON_TRACK").length,
    AT_RISK: rows.filter((r) => r.health === "AT_RISK").length,
    OFF_TRACK: rows.filter((r) => r.health === "OFF_TRACK").length,
  };

  const prev = toISODate(addDays(week.to, -7));
  const next = toISODate(addDays(week.to, 7));

  return (
    <div>
      <PageHeader
        title="Weekly report"
        subtitle={`RocketLane updates for the week ending ${formatMedium(week.to)}.`}
        actions={
          <div className="flex items-center gap-1.5">
            <Link
              href={`/reports/weekly?week=${prev}`}
              className="btn-secondary btn-sm"
              aria-label="Previous week"
            >
              ←
            </Link>
            <Link href="/reports/weekly" className="btn-secondary btn-sm">
              This week
            </Link>
            <Link
              href={`/reports/weekly?week=${next}`}
              className="btn-secondary btn-sm"
              aria-label="Next week"
            >
              →
            </Link>
          </div>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Week"
          value={formatMedium(week.to)}
          hint={`from ${formatMedium(week.from)}`}
        />
        <Stat
          label="Updated"
          value={`${rows.length - missing.length} of ${rows.length}`}
          hint="live projects with an update this week"
        />
        <Stat
          label="Missing"
          value={missing.length}
          hint={
            missing.length
              ? "drafted from the week's activity below"
              : "nothing outstanding"
          }
        />
        <Stat
          label="RAG"
          value={`${spread.ON_TRACK} / ${spread.AT_RISK} / ${spread.OFF_TRACK}`}
          hint="green / amber / red, this week"
        />
      </div>

      {rows.length === 0 ? (
        <div className="card p-6 text-sm text-ink-600">
          No active projects, so there is nothing to report on this week.
        </div>
      ) : (
        <WeeklyList
          rows={rows.map(
            (r): WeeklyRow => ({
              key: r.id,
              text: r.search,
              copy: r.text,
              node: (
                <section className="card overflow-hidden">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-200 p-4">
                    <div className="min-w-0">
                      <Link
                        href={`/projects/${r.id}`}
                        className="font-medium text-ink-900 hover:text-brand-700"
                      >
                        {r.name}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                        <HealthChip health={r.health} size="sm" />
                        <span>{r.clientName ?? "No client"}</span>
                        <span>·</span>
                        <span>{r.ownerName ?? "No owner"}</span>
                        <span>·</span>
                        <span
                          className={
                            r.gap.missing ? "font-medium text-bad-700" : ""
                          }
                        >
                          {gapLabel(r.gap)}
                        </span>
                      </div>
                    </div>
                    <CopyBlock text={r.text} />
                  </div>

                  {r.gap.missing ? (
                    <p className="border-b border-ink-100 bg-warn-50 px-4 py-2 text-xs text-warn-700">
                      No update this week. The block below is a draft from what
                      OneSpace saw happen — the RAG status and the risks are
                      still yours to write.
                    </p>
                  ) : null}

                  <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-3 text-xs leading-relaxed text-ink-700">
                    {r.text}
                  </pre>

                  <MeetingNotes meetings={r.meetingRows} />
                </section>
              ),
            }),
          )}
        />
      )}

      <p className="mt-4 text-xs text-ink-500">
        RAG reads {RAG_LABEL.ON_TRACK} / {RAG_LABEL.AT_RISK} /{" "}
        {RAG_LABEL.OFF_TRACK} for On track / At risk / Off track. Anything in
        [brackets] is a prompt from the template that nobody has answered yet —
        fill it on the project or in the status update, not here, and it will be
        filled in next week too.
      </p>
    </div>
  );
}
