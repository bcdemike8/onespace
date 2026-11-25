"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { dismissMeetingAction, dismissMeetingsAction } from "@/app/actions/google";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";
import { CappedList } from "@/components/CappedList";

type State = { error?: string; ok?: boolean; message?: string };

export interface MeetingToLog {
  id: string;
  title: string;
  /** "Nov 20 · 2:00 PM", already in the org's zone. */
  whenLabel: string;
  minutes: number;
  /** The project the matcher suggested, if it found one. */
  projectName: string | null;
}

/** Rows in view before the list scrolls. A nudge, not the Meetings tab. */
const VISIBLE = 5;

/**
 * "Meetings to log" on My Work: the recent client calls still waiting, each
 * one clearable in place.
 *
 * It used to be a single line - "112 meetings still to log" - whose only
 * action was a link away. Most of what needs doing to a call that won't be
 * billed is one click, so that click lives here. Logging one still opens the
 * meeting, because that needs a project, a task and a duration. Clear is
 * "Not billable work" by a shorter name: the call is set aside, not deleted.
 *
 * The window rolls: whatever is older than a fortnight drops off here on its
 * own, and waits on the Meetings tab under Last 30 days or All.
 */
export function MeetingsToLog({ meetings }: { meetings: MeetingToLog[] }) {
  const [clearState, clearAction] = useActionState(dismissMeetingsAction, {} as State);

  if (meetings.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-600">
          Meetings to log
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-500">
            <span className="tnum">{meetings.length}</span> · client calls, last two weeks
          </span>
          <form
            action={clearAction}
            onSubmit={(e) => {
              const n = meetings.length;
              if (
                !window.confirm(
                  `Clear all ${n} meeting${n === 1 ? "" : "s"} as not billable? You can bring any of them back from the Meetings tab.`,
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            {meetings.map((m) => (
              <input key={m.id} type="hidden" name="id" value={m.id} />
            ))}
            <SubmitButton pendingLabel="Clearing…" className="btn-ghost btn-sm">
              Clear all
            </SubmitButton>
          </form>
        </div>
      </div>
      <ErrorNote message={clearState?.error} />

      <div className="card overflow-hidden">
        <CappedList visible={VISIBLE} className="divide-y divide-ink-100">
          {meetings.map((m) => (
            <Row key={m.id} meeting={m} />
          ))}
        </CappedList>
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs">
        <Link href="/meetings" className="text-ink-500 hover:text-brand-700 hover:underline">
          All meetings, including internal and older ones →
        </Link>
      </div>
    </section>
  );
}

function Row({ meeting }: { meeting: MeetingToLog }) {
  // Hidden straight away rather than waiting for the page to come back, so a
  // run of set-asides doesn't have rows jumping under the cursor.
  const [gone, setGone] = useState(false);
  if (gone) return null;

  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2.5">
      <Link
        href={`/meetings/${meeting.id}`}
        className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5 hover:text-brand-700"
      >
        <span className="text-sm font-medium text-ink-900">{meeting.title}</span>
        <span className="text-xs text-ink-500">
          {meeting.whenLabel} · {formatMinutes(meeting.minutes)}
          {meeting.projectName ? ` · ${meeting.projectName}` : ""}
        </span>
      </Link>

      <Link href={`/meetings/${meeting.id}`} className="btn-secondary btn-sm">
        Log
      </Link>

      <form
        action={async (formData) => {
          await dismissMeetingAction(formData);
          setGone(true);
        }}
      >
        <input type="hidden" name="id" value={meeting.id} />
        <SubmitButton
          pendingLabel="…"
          className="btn-ghost btn-sm"
          title="Not billable - set it aside. You can bring it back from the Meetings tab."
        >
          Clear
        </SubmitButton>
      </form>
    </li>
  );
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
