"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  dismissMeetingAction,
  restoreMeetingAction,
  setMeetingOutcomeAction,
} from "@/app/actions/google";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";
import { AlreadyLoggedButton, RemoveButton } from "./MeetingButtons";

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
  /** Logged with an entry of its own, which is what the hours total counts. */
  hasEntry: boolean;
  /** Marked "Already logged": the time went on the timesheet by hand. */
  loggedByHand: boolean;
  /**
   * Nobody from a client was in the invite. A set-aside call like that reads
   * Internal rather than Not billable - same bucket, truer word.
   */
  noClient: boolean;
  /** Waiting or set aside: what the owner has on the timesheet that day. */
  timesheetNote: string | null;
  /**
   * Why a set-aside call was set aside: null is a plain Not billable,
   * BACKLOG is Cleared (swept up by Clear the backlog), REMOVED is not work.
   */
  setAside: "BACKLOG" | "REMOVED" | null;
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
  removedCount,
  showingRemoved,
  removedHref,
}: {
  weeks: MeetingWeek[];
  moreHref: string | null;
  /** Calls removed as not work, hidden from this list unless asked for. */
  removedCount: number;
  showingRemoved: boolean;
  /** The same page with removed calls shown, or hidden again. */
  removedHref: string;
}) {
  const removedToggle =
    removedCount > 0 || showingRemoved ? (
      <p className="text-xs text-ink-500">
        {showingRemoved
          ? "Showing removed calls (blocks, appointments). "
          : `${removedCount} removed call${removedCount === 1 ? "" : "s"} hidden (blocks, appointments). `}
        <Link href={removedHref} className="underline">
          {showingRemoved ? "Hide them" : "Show them"}
        </Link>
      </p>
    ) : null;

  if (weeks.length === 0) {
    return (
      <div className="grid gap-3">
        {removedToggle}
        <p className="text-sm text-ink-500">No meetings in this period.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {removedToggle}
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
  const setAsideByHand = week.rows.filter((r) => r.status === "DISMISSED" && r.setAside === null);
  const internal = setAsideByHand.filter((r) => r.noClient).length;
  const notBillable = setAsideByHand.length - internal;
  const cleared = week.rows.filter((r) => r.setAside === "BACKLOG").length;
  const removed = week.rows.filter((r) => r.setAside === "REMOVED").length;
  const waiting = week.rows.filter((r) => r.status === "PENDING").length;
  // Only calls with an entry of their own: a call logged by hand has its
  // hours on the timesheet under whatever was typed there, not here.
  const loggedMinutes = logged
    .filter((r) => r.hasEntry)
    .reduce((sum, r) => sum + r.minutes, 0);
  const manual = logged.filter((r) => r.loggedByHand).length;

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink-900">{week.label}</h2>
        <span className="text-xs text-ink-500">
          {logged.length - manual} logged
          {loggedMinutes > 0 ? ` (${formatMinutes(loggedMinutes)})` : ""}
          {manual > 0 ? ` · ${manual} manually logged` : ""} · {internal} internal ·{" "}
          {notBillable} not billable
          {cleared > 0 ? ` · ${cleared} cleared` : ""}
          {removed > 0 ? ` · ${removed} removed` : ""}
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

type Label =
  | "LOGGED"
  | "MANUAL"
  | "INTERNAL"
  | "NOT_BILLABLE"
  | "CLEARED"
  | "REMOVED"
  | "WAITING";

const LABELS: Record<Label, { label: string; className: string; title: string }> = {
  LOGGED: {
    label: "Logged",
    className: "bg-good-50 text-good-700",
    title: "Logged from the meeting: its time is on the project and the timesheet",
  },
  MANUAL: {
    label: "Manually logged",
    className: "bg-good-50 text-good-700 ring-1 ring-inset ring-good-500/40",
    title: "The time was already on the timesheet, entered by hand - nothing was added from here",
  },
  INTERNAL: {
    label: "Internal",
    className: "bg-brand-50 text-brand-700",
    title: "No client in the invite, and no time logged from it",
  },
  NOT_BILLABLE: {
    label: "Not billable",
    className: "bg-ink-100 text-ink-600",
    title: "A client call somebody decided not to bill",
  },
  CLEARED: {
    label: "Cleared",
    className: "bg-ink-50 text-ink-500 ring-1 ring-inset ring-ink-200",
    title: "Swept up by Clear the backlog - never looked at one by one",
  },
  REMOVED: {
    label: "Removed",
    className: "bg-ink-50 text-ink-400 line-through",
    title: "Not work - a block, an appointment",
  },
  WAITING: {
    label: "Not logged yet",
    className: "bg-warn-50 text-warn-700",
    title: "Still waiting to be logged or set aside",
  },
};

function labelFor(row: AllMeetingRow): Label {
  if (row.status === "ACCEPTED") return row.loggedByHand ? "MANUAL" : "LOGGED";
  if (row.status === "PENDING") return "WAITING";
  if (row.setAside === "BACKLOG") return "CLEARED";
  if (row.setAside === "REMOVED") return "REMOVED";
  return row.noClient ? "INTERNAL" : "NOT_BILLABLE";
}

function Row({ row }: { row: AllMeetingRow }) {
  const [state, action] = useActionState(setMeetingOutcomeAction, {} as State);
  const which = labelFor(row);
  const s = LABELS[which];

  return (
    <li className="px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={`chip shrink-0 ${s.className}`} title={s.title}>
          {s.label}
        </span>
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
            <AlreadyLoggedButton id={row.id} />
            <form action={dismissMeetingAction}>
              <input type="hidden" name="id" value={row.id} />
              <SubmitButton pendingLabel="…" className="btn-ghost btn-sm">
                {row.noClient ? "Internal" : "Not billable"}
              </SubmitButton>
            </form>
            <RemoveButton id={row.id} />
          </>
        ) : null}

        {which === "NOT_BILLABLE" || which === "INTERNAL" || which === "CLEARED" ? (
          <>
            <AlreadyLoggedButton id={row.id} />
            {which === "CLEARED" ? (
              // Confirming what the bulk clear assumed: Internal, or Not
              // billable for a client call.
              <form action={action}>
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="intent" value="not-billable" />
                <SubmitButton pendingLabel="…" className="btn-ghost btn-sm">
                  {row.noClient ? "Internal" : "Not billable"}
                </SubmitButton>
              </form>
            ) : null}
            <form action={action}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="intent" value="log" />
              <SubmitButton pendingLabel="Opening…" className="btn-ghost btn-sm">
                Log it after all
              </SubmitButton>
            </form>
            <RemoveButton id={row.id} />
          </>
        ) : null}

        {which === "REMOVED" ? (
          <form action={restoreMeetingAction}>
            <input type="hidden" name="id" value={row.id} />
            <SubmitButton pendingLabel="…" className="btn-ghost btn-sm">
              Put back
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
                // Nothing comes off the timesheet for a call with no entry
                // of its own, so there is nothing to warn about.
                if (
                  row.hasEntry &&
                  !window.confirm(
                    `Mark "${row.title}" as ${row.noClient ? "internal" : "not billable"}? Its ${formatMinutes(row.minutes)} comes off the timesheet.`,
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="intent" value="not-billable" />
              <SubmitButton pendingLabel="…" className="btn-ghost btn-sm">
                {row.noClient ? "Mark internal" : "Mark not billable"}
              </SubmitButton>
            </form>
          )
        ) : null}
      </div>
      {row.timesheetNote ? (
        <p className="mt-1 text-xs text-ink-500">
          On the timesheet that day: <span className="text-ink-700">{row.timesheetNote}</span>
        </p>
      ) : null}
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
