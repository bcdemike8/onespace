"use client";

import Link from "next/link";
import { useActionState } from "react";
import { dismissMeetingAction, setMeetingOutcomeAction } from "@/app/actions/google";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

type State = { error?: string; ok?: boolean; message?: string };

export interface AllMeetingRow {
  id: string;
  title: string;
  /** "Mon, Nov 17 · 2:00 PM", in the org's zone. */
  whenLabel: string;
  minutes: number;
  status: "PENDING" | "ACCEPTED" | "DISMISSED";
  /** Logged: the project the time went to. Waiting: the suggested one. */
  projectName: string | null;
  /** Logged as non-billable time (an internal project, say). */
  nonBillableEntry: boolean;
  /** Logged in a closed month, so the entry can't be taken back. */
  locked: boolean;
  ownerName: string | null;
}

export interface MeetingWeek {
  key: string;
  label: string;
  rows: AllMeetingRow[];
}

/**
 * The All view: every call, week by week, and what became of it. The short
 * views are the to-do list; this is the record. Each row can still be
 * changed, so a call written off in a hurry can be logged after all, and a
 * call logged by mistake can be taken back off the timesheet.
 */
export function AllMeetings({
  weeks,
  moreHref,
}: {
  weeks: MeetingWeek[];
  moreHref: string | null;
}) {
  if (weeks.length === 0) {
    return <p className="text-sm text-ink-500">No meetings in this period.</p>;
  }

  return (
    <div className="grid gap-6">
      {weeks.map((week) => (
        <Week key={week.key} week={week} />
      ))}
      {moreHref ? (
        <Link href={moreHref} className="text-sm font-medium text-brand-700 hover:underline">
          Show earlier weeks
        </Link>
      ) : null}
    </div>
  );
}

function Week({ week }: { week: MeetingWeek }) {
  const logged = week.rows.filter((r) => r.status === "ACCEPTED");
  const notBillable = week.rows.filter((r) => r.status === "DISMISSED").length;
  const waiting = week.rows.filter((r) => r.status === "PENDING").length;
  const loggedMinutes = logged.reduce((sum, r) => sum + r.minutes, 0);

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink-900">{week.label}</h2>
        <span className="text-xs text-ink-500">
          {logged.length} logged{logged.length > 0 ? ` (${formatMinutes(loggedMinutes)})` : ""} ·{" "}
          {notBillable} not billable
          {waiting > 0 ? (
            <span className="font-medium text-warn-700"> · {waiting} not dealt with</span>
          ) : null}
        </span>
      </div>
      <ul className="card divide-y divide-ink-100">
        {week.rows.map((row) => (
          <Row key={row.id} row={row} />
        ))}
      </ul>
    </section>
  );
}

const STATUS: Record<AllMeetingRow["status"], { label: string; className: string }> = {
  ACCEPTED: { label: "Logged", className: "bg-good-50 text-good-700" },
  DISMISSED: { label: "Not billable", className: "bg-ink-100 text-ink-600" },
  PENDING: { label: "Not logged yet", className: "bg-warn-50 text-warn-700" },
};

function Row({ row }: { row: AllMeetingRow }) {
  const [state, action] = useActionState(setMeetingOutcomeAction, {} as State);
  const s = STATUS[row.status];

  return (
    <li className="px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={`chip shrink-0 ${s.className}`}>{s.label}</span>
        <Link
          href={`/meetings/${row.id}`}
          className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5 hover:text-brand-700"
        >
          <span className="text-sm font-medium text-ink-900">{row.title}</span>
          <span className="text-xs text-ink-500">
            {row.whenLabel} · {formatMinutes(row.minutes)}
            {row.projectName ? ` · ${row.projectName}` : ""}
            {row.nonBillableEntry ? " · non-billable time" : ""}
            {row.ownerName ? ` · ${row.ownerName}` : ""}
          </span>
        </Link>

        {row.status === "PENDING" ? (
          <>
            <Link href={`/meetings/${row.id}`} className="btn-secondary btn-sm">
              Log
            </Link>
            <form action={dismissMeetingAction}>
              <input type="hidden" name="id" value={row.id} />
              <SubmitButton pendingLabel="…" className="btn-ghost btn-sm">
                Not billable
              </SubmitButton>
            </form>
          </>
        ) : null}

        {row.status === "DISMISSED" ? (
          <form action={action}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="intent" value="log" />
            <SubmitButton pendingLabel="Opening…" className="btn-ghost btn-sm">
              Log it after all
            </SubmitButton>
          </form>
        ) : null}

        {row.status === "ACCEPTED" ? (
          row.locked ? (
            <span className="text-xs text-ink-400" title="Reopen the period on the timesheet to change it">
              Closed month
            </span>
          ) : (
            <form
              action={action}
              onSubmit={(e) => {
                if (
                  !window.confirm(
                    `Mark "${row.title}" as not billable? Its ${formatMinutes(row.minutes)} comes off the timesheet.`,
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="intent" value="not-billable" />
              <SubmitButton pendingLabel="…" className="btn-ghost btn-sm">
                Mark not billable
              </SubmitButton>
            </form>
          )
        ) : null}
      </div>
      <ErrorNote message={state?.error} />
    </li>
  );
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
