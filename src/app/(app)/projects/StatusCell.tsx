"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ProjectHealth } from "@prisma/client";
import { addStatusUpdateAction } from "@/app/actions/status";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";
import { HealthChip, HEALTH_LABEL } from "@/components/HealthChip";
import { StatusDetailFields } from "@/components/StatusDetailFields";

/**
 * The Status cell on the Projects list, and the dialog behind it.
 *
 * Posting an update used to mean opening each project in turn. Eight projects
 * was eight page loads to say eight sentences, so in practice the updates
 * didn't get written and every row read "No update". The whole cell is now a
 * button: click it, say how it's going, save, move to the next row.
 *
 * The dialog goes through a portal rather than living in the table cell it
 * belongs to. A dialog rendered inside a <td> inherits the table's stacking
 * and clipping, and this table already sits in a card with overflow hidden.
 */

const OPTIONS: { value: ProjectHealth; hint: string }[] = [
  { value: "ON_TRACK", hint: "Going to plan" },
  { value: "AT_RISK", hint: "Something could derail it" },
  { value: "OFF_TRACK", hint: "Already slipped" },
];

const TONE: Record<ProjectHealth, string> = {
  ON_TRACK: "border-good-500 bg-good-50 text-good-700",
  AT_RISK: "border-warn-500 bg-warn-50 text-warn-700",
  OFF_TRACK: "border-bad-500 bg-bad-50 text-bad-700",
};

export function StatusCell({
  projectId,
  projectName,
  health,
  note,
  subtitle,
  today,
}: {
  projectId: string;
  projectName: string;
  health: ProjectHealth | null;
  note: string | null;
  /** The "as of …" line under the chip, already formatted by the page. */
  subtitle: string;
  today: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Post a status update for ${projectName}`}
        title="Post a status update"
        className="-mx-1 rounded px-1 py-0.5 text-left transition-colors hover:bg-ink-100"
      >
        <HealthChip health={health} />
        <div className="mt-1 text-xs text-ink-500">{subtitle}</div>
      </button>

      {open ? (
        <StatusDialog
          projectId={projectId}
          projectName={projectName}
          health={health}
          note={note}
          today={today}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function StatusDialog({
  projectId,
  projectName,
  health: current,
  note,
  today,
  onClose,
}: {
  projectId: string;
  projectName: string;
  health: ProjectHealth | null;
  note: string | null;
  today: string;
  onClose: () => void;
}) {
  const [state, action] = useActionState(addStatusUpdateAction, {});
  const [health, setHealth] = useState<ProjectHealth>(current ?? "ON_TRACK");
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // Saved is saved: the action revalidates /projects, so the row behind the
  // dialog is already correct by the time it closes.
  useEffect(() => {
    if (state.ok) onClose();
  }, [state, onClose]);

  useEffect(() => {
    noteRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 p-4 sm:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Status update for ${projectName}`}
        className="card w-full max-w-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-ink-200 px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-ink-900">{projectName}</h2>
            <p className="text-xs text-ink-500">How is this one going?</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="px-1 text-lg leading-none text-ink-400 hover:text-ink-700"
          >
            ×
          </button>
        </div>

        {note ? (
          <div className="border-b border-ink-100 bg-ink-50 px-4 py-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Last update
              </span>
              <HealthChip health={current} size="sm" />
            </div>
            <p className="whitespace-pre-line text-sm text-ink-600">{note}</p>
          </div>
        ) : null}

        <form action={action} className="space-y-3 p-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="health" value={health} />

          <div className="flex flex-wrap gap-2">
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setHealth(o.value)}
                aria-pressed={health === o.value}
                className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  health === o.value
                    ? TONE[o.value]
                    : "border-ink-200 bg-white text-ink-600 hover:border-ink-300"
                }`}
              >
                <span className="block font-medium">{HEALTH_LABEL[o.value]}</span>
                <span className="block text-xs opacity-80">{o.hint}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <div>
              <label className="label" htmlFor={`sc-date-${projectId}`}>
                As of
              </label>
              <input
                id={`sc-date-${projectId}`}
                name="date"
                type="date"
                defaultValue={today}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor={`sc-note-${projectId}`}>
                What&apos;s happening
                {health === "ON_TRACK" ? (
                  <span className="font-normal text-ink-400"> (optional)</span>
                ) : null}
              </label>
              <textarea
                ref={noteRef}
                id={`sc-note-${projectId}`}
                name="note"
                rows={3}
                className="input"
                placeholder={
                  health === "ON_TRACK"
                    ? "Anything worth noting for whoever reads this next."
                    : "What's the problem, and what happens next?"
                }
              />
            </div>
          </div>

          <StatusDetailFields idPrefix="sc" />

          <ErrorNote message={state.error} />

          <div className="flex items-center justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <SubmitButton pendingLabel="Posting…">Post update</SubmitButton>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
