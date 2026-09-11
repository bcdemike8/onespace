"use client";

import { useActionState, useState } from "react";
import { acceptMeetingAction, dismissMeetingAction } from "@/app/actions/google";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";
import { Commitments, type CommitmentRow } from "./Commitments";

export interface ProjectOption {
  id: string;
  name: string;
  clientName: string | null;
  billingType: "HOURLY" | "FIXED_FEE" | "NON_BILLABLE";
  tasks: { id: string; name: string }[];
}

export interface MeetingRow {
  id: string;
  title: string;
  dayLabel: string;
  timeLabel: string;
  minutes: number;
  durationValue: string;
  attendees: { email: string; name: string | null }[];
  externalDomains: string[];
  suggestedProjectId: string | null;
  suggestedTaskId: string | null;
  matchReason: string | null;
  confidence: number;
  /** Set when the meeting's day sits in a closed month. */
  lockedNote: string | null;
  ownerName: string | null;
  /** What Zoom says it actually ran for, when that differs from the booking. */
  actualMinutes: number | null;
  recordingUrl: string | null;
  /** What the call was about, written from the transcript. */
  summary: string | null;
  commitments: CommitmentRow[];
}

/** At or above this the suggestion reads as an answer rather than a question. */
const CONFIDENT = 60;

export function MeetingCard({
  meeting,
  projects,
}: {
  meeting: MeetingRow;
  projects: ProjectOption[];
}) {
  const [state, action] = useActionState(acceptMeetingAction, {} as { error?: string; ok?: boolean });
  const [projectId, setProjectId] = useState(meeting.suggestedProjectId ?? "");
  const [taskId, setTaskId] = useState(meeting.suggestedTaskId ?? "");
  const [open, setOpen] = useState(false);

  const project = projects.find((p) => p.id === projectId);
  const tasks = project?.tasks ?? [];
  const nonBillable = project?.billingType === "NON_BILLABLE";
  const sure = meeting.confidence >= CONFIDENT;

  // Changing project invalidates whatever task was picked under the old one.
  const chooseProject = (id: string) => {
    setProjectId(id);
    setTaskId(id === meeting.suggestedProjectId ? (meeting.suggestedTaskId ?? "") : "");
  };

  const guests = meeting.attendees.filter((a) => a.email);

  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="font-medium text-ink-900">{meeting.title}</h3>
            <span className="text-xs text-ink-500 tnum">
              {meeting.dayLabel} · {meeting.timeLabel} ·{" "}
              {meeting.actualMinutes !== null &&
              meeting.actualMinutes !== meeting.minutes ? (
                <>
                  <span title="What Zoom says it actually ran for">
                    {formatMinutes(meeting.actualMinutes)}
                  </span>
                  <span className="text-ink-400">
                    {" "}
                    (booked {formatMinutes(meeting.minutes)})
                  </span>
                </>
              ) : (
                formatMinutes(meeting.minutes)
              )}
            </span>
          </div>

          {meeting.ownerName ? (
            <p className="mt-0.5 text-xs text-ink-500">{meeting.ownerName}&apos;s calendar</p>
          ) : null}

          {guests.length > 0 ? (
            <p className="mt-1 truncate text-xs text-ink-500" title={guests.map((g) => g.email).join(", ")}>
              {guests.length} guest{guests.length === 1 ? "" : "s"}
              {" · "}
              {guests.slice(0, 3).map((g) => g.name || g.email).join(", ")}
              {guests.length > 3 ? ` +${guests.length - 3}` : ""}
            </p>
          ) : (
            <p className="mt-1 text-xs text-ink-500">No guests — a block on your own calendar.</p>
          )}
        </div>

        <span
          className={`chip shrink-0 ${
            sure ? "bg-good-50 text-good-700" : "bg-warn-50 text-warn-700"
          }`}
        >
          {sure ? "Suggested" : "Needs a look"}
        </span>
      </div>

      {meeting.matchReason ? (
        <p className="mt-2 text-xs text-ink-500">{meeting.matchReason}</p>
      ) : null}

      {meeting.lockedNote ? (
        <p className="mt-3 rounded-lg bg-warn-50 px-3 py-2 text-xs text-warn-700">
          {meeting.lockedNote}
        </p>
      ) : (
        <form action={action} className="mt-3">
          <input type="hidden" name="id" value={meeting.id} />

          <div className="grid gap-3 sm:grid-cols-[2fr_1.5fr_auto]">
            <div>
              <label className="label" htmlFor={`p-${meeting.id}`}>
                Project
              </label>
              <select
                id={`p-${meeting.id}`}
                name="projectId"
                className="input"
                value={projectId}
                onChange={(e) => chooseProject(e.target.value)}
                required
              >
                <option value="">Pick a project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.clientName ? `${p.clientName} — ` : ""}
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor={`t-${meeting.id}`}>
                Task <span className="font-normal text-ink-400">optional</span>
              </label>
              <select
                id={`t-${meeting.id}`}
                name="taskId"
                className="input"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                disabled={tasks.length === 0}
              >
                <option value="">
                  {tasks.length === 0 ? "No open tasks" : "No specific task"}
                </option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor={`d-${meeting.id}`}>
                Time
              </label>
              <input
                id={`d-${meeting.id}`}
                name="duration"
                className="input w-24 tnum"
                defaultValue={meeting.durationValue}
                required
              />
            </div>
          </div>

          {open ? (
            <div className="mt-3">
              <label className="label" htmlFor={`n-${meeting.id}`}>
                Notes
              </label>
              <input
                id={`n-${meeting.id}`}
                name="notes"
                className="input"
                defaultValue={meeting.title}
                maxLength={1000}
              />
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SubmitButton pendingLabel="Logging…" className="btn-primary btn-sm">
              Log this time
            </SubmitButton>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="btn-ghost btn-sm"
            >
              {open ? "Hide notes" : "Add a note"}
            </button>

            {!nonBillable ? (
              <label className="ml-1 inline-flex items-center gap-1.5 text-xs text-ink-600">
                <input type="checkbox" name="billable" defaultChecked className="rounded" />
                Billable
              </label>
            ) : (
              <span className="text-xs text-ink-400">Non-billable project</span>
            )}

            <span className="ml-auto">
              <DismissButton id={meeting.id} />
            </span>
          </div>

          <ErrorNote message={state?.error} />
        </form>
      )}

      {meeting.lockedNote ? (
        <div className="mt-3">
          <DismissButton id={meeting.id} />
        </div>
      ) : null}

      {meeting.summary ? (
        <details className="mt-3 rounded-lg border border-ink-200 bg-ink-50/60 p-3">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-ink-600">
            What the call was about
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
            {meeting.summary}
          </p>
        </details>
      ) : null}

      <Commitments
        items={meeting.commitments}
        projectId={projectId || null}
        recordingUrl={meeting.recordingUrl}
      />
    </li>
  );
}

function DismissButton({ id }: { id: string }) {
  return (
    <form action={dismissMeetingAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton pendingLabel="…" className="btn-ghost btn-sm">
        Not billable work
      </SubmitButton>
    </form>
  );
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
