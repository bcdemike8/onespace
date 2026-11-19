"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { setTimesheetNoteAction } from "@/app/actions/time";

/**
 * The note behind a timesheet cell.
 *
 * Deliberately not a field in the cell's form. The grid's whole value is
 * that a week takes seconds to fill: one input per day, tab, type, tab. A
 * textarea in that path would slow the common case down to serve the rarer
 * one, so the note is a corner marker you open when you have something to
 * say — filled when there is a note, faint when there isn't.
 *
 * Calls the action directly rather than wrapping a <form>, because this sits
 * inside the cell's own form and a form inside a form is not a form.
 */
export function CellNote({
  projectId,
  taskId,
  date,
  dayLabel,
  taskName,
  value,
  hasTime,
  disabled,
}: {
  projectId: string;
  taskId: string;
  date: string;
  dayLabel: string;
  taskName: string;
  value: string;
  /** No hours on this day means nothing for a note to attach to. */
  hasTime: boolean;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  const [saved, setSaved] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const boxRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  // A note saved elsewhere — the project page, another tab — should win over
  // whatever this component last rendered.
  useEffect(() => {
    setText(value);
    setSaved(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    areaRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const save = () => {
    setError(null);
    start(async () => {
      const r = await setTimesheetNoteAction({ projectId, taskId, date, notes: text });
      if (r.ok) {
        setSaved(text.trim());
        setOpen(false);
      } else {
        setError(r.error ?? "That didn't save.");
      }
    });
  };

  const has = saved.trim().length > 0;

  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-label={
          has ? `Note on ${taskName}, ${dayLabel}: ${saved}` : `Add a note to ${taskName}, ${dayLabel}`
        }
        title={has ? saved : "Add a note"}
        className={`absolute -right-1 -top-1 rounded px-1 text-[10px] leading-none transition-colors ${
          has
            ? "text-brand-700 hover:text-brand-800"
            : "text-ink-300 opacity-0 hover:text-ink-600 focus:opacity-100 group-hover/cell:opacity-100"
        } disabled:hidden`}
      >
        {has ? "●" : "+"}
      </button>

      {open ? (
        <div
          ref={boxRef}
          role="dialog"
          aria-label={`Note for ${taskName} on ${dayLabel}`}
          className="absolute right-0 top-5 z-30 w-64 rounded-lg border border-ink-200 bg-white p-2 text-left shadow-lg"
        >
          <p className="mb-1 text-xs font-medium text-ink-700">
            {dayLabel} · {taskName}
          </p>

          {hasTime ? (
            <>
              <textarea
                ref={areaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="input text-xs"
                placeholder="What the hours went on — this prints on the timesheet PDF."
              />
              {error ? <p className="mt-1 text-xs text-bad-700">{error}</p> : null}
              <div className="mt-1.5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs text-ink-500 hover:text-ink-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={pending}
                  className="btn-primary btn-sm text-xs"
                >
                  {pending ? "Saving…" : "Save note"}
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-ink-500">
              Log some time on this day first — a note needs hours to sit on.
            </p>
          )}
        </div>
      ) : null}
    </span>
  );
}
