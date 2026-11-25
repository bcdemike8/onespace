"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { removeTimeEntryAction } from "@/app/actions/time";
import { formatHours } from "@/lib/format";

export interface LoggedEntry {
  id: string;
  minutes: number;
  source: "TIMESHEET" | "MANUAL" | "TIMER" | "IMPORT";
  notes: string | null;
}

const SOURCE: Record<LoggedEntry["source"], string> = {
  TIMESHEET: "Timesheet",
  MANUAL: "Logged by hand",
  TIMER: "Timer",
  IMPORT: "Imported",
};

/**
 * The "1.5 logged" figure in a timesheet cell: time booked by a timer, the
 * Log time form or an import. The grid can't edit it - the cell only owns
 * what was typed into it - but a click lists the entries behind the figure,
 * and any of them can be deleted from there. A timer left running on the
 * wrong task is the usual reason.
 */
export function LoggedEntries({
  label,
  entries,
  dayLabel,
  taskName,
}: {
  label: string;
  entries: LoggedEntry[];
  dayLabel: string;
  taskName: string;
}) {
  const [open, setOpen] = useState(false);
  // Where to draw the list. Fixed to the viewport, because the grid sits in
  // a horizontally scrolling box that would otherwise cut it off.
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    // A fixed box would drift away from its cell on scroll; close it instead.
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = () => {
    const r = buttonRef.current?.getBoundingClientRect();
    if (r) {
      const width = 256;
      setAt({
        top: r.bottom + 4,
        left: Math.min(
          Math.max(8, r.left + r.width / 2 - width / 2),
          window.innerWidth - width - 8,
        ),
      });
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={boxRef} className="relative mb-0.5">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className="text-xs tnum text-ink-400 underline decoration-dotted decoration-ink-300 underline-offset-2 hover:text-ink-700"
        title="Logged by a timer, the Log time form or an import. Click to see or delete it."
        aria-expanded={open}
      >
        {label}
      </button>

      {open && at ? (
        <div
          role="dialog"
          aria-label={`Time logged to ${taskName} on ${dayLabel}`}
          style={{ top: at.top, left: at.left }}
          className="fixed z-30 w-64 rounded-lg border border-ink-200 bg-white p-2 text-left shadow-lg"
        >
          <p className="mb-1.5 text-xs font-medium text-ink-700">
            {dayLabel} · {taskName}
          </p>
          <ul className="divide-y divide-ink-100">
            {entries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function EntryRow({ entry }: { entry: LoggedEntry }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const remove = () => {
    setError(null);
    start(async () => {
      const r = await removeTimeEntryAction(entry.id);
      if (r.error) {
        setError(r.error);
        setConfirming(false);
      }
    });
  };

  return (
    <li className="py-1.5 text-xs">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-ink-800">
            <span className="font-medium tnum">{formatHours(entry.minutes)}h</span>
            <span className="text-ink-500"> · {SOURCE[entry.source]}</span>
          </div>
          {entry.notes ? (
            <div className="truncate text-ink-500" title={entry.notes}>
              {entry.notes}
            </div>
          ) : null}
        </div>
        {confirming ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="text-ink-500 hover:text-ink-900"
            >
              Keep
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="rounded bg-bad-700 px-1.5 py-0.5 font-medium text-white hover:bg-bad-500 disabled:opacity-60"
            >
              {pending ? "Deleting…" : "Delete"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="shrink-0 text-ink-500 hover:text-bad-700"
          >
            Delete
          </button>
        )}
      </div>
      {error ? <p className="mt-1 text-bad-700">{error}</p> : null}
    </li>
  );
}
