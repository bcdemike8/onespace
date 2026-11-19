"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { addTimesheetTaskAction } from "@/app/actions/time";
import { MAX_NAME, OTHER_VALUE } from "@/lib/timesheet-task";

/**
 * The "what did you work on?" control at the foot of a project's block.
 *
 * Every unfinished task on the project, plus Other — because plans come from
 * SOW templates and describe what was sold, not the escalation call that
 * actually ate Tuesday. Without Other, those hours get filed against whatever
 * task is nearest, which quietly corrupts the only record of where a
 * project's time went.
 */
export function TaskPicker({
  projectId,
  projectName,
  available,
  placeholder,
  emptyNote,
  onPicked,
}: {
  projectId: string;
  projectName: string;
  available: { id: string; name: string }[];
  /** The resting label of the select — the first block says it differently. */
  placeholder: string;
  /** What to say beside Other when there is nothing left to pick. */
  emptyNote: string;
  onPicked: (task: { id: string; name: string }) => void;
}) {
  const [typing, setTyping] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typing) inputRef.current?.focus();
  }, [typing]);

  const close = () => {
    setTyping(false);
    setName("");
    setError(null);
  };

  const submit = () => {
    setError(null);
    start(async () => {
      const r = await addTimesheetTaskAction({ projectId, name });
      if (r.ok && r.task) {
        onPicked(r.task);
        close();
      } else {
        setError(r.error ?? "That didn't save.");
      }
    });
  };

  if (typing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <input
            ref={inputRef}
            value={name}
            maxLength={MAX_NAME}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
              if (e.key === "Escape") close();
            }}
            placeholder="What was the work? e.g. Client escalation call"
            aria-label={`Describe the work on ${projectName}`}
            className="input w-80 max-w-full py-1.5 text-sm"
          />
          {error ? <p className="mt-1 text-xs text-bad-700">{error}</p> : null}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={pending || name.trim() === ""}
          className="btn-primary btn-sm"
        >
          {pending ? "Adding…" : "Add row"}
        </button>
        <button
          type="button"
          onClick={close}
          className="text-xs text-ink-500 hover:text-ink-900"
        >
          Cancel
        </button>
        <span className="text-xs text-ink-500">
          It joins this project under &ldquo;Unplanned work&rdquo;.
        </span>
      </div>
    );
  }

  // Nothing left to pick: Other is the only thing to offer, so offer it
  // plainly rather than as one entry in a list of one.
  if (available.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setTyping(true)} className="btn-secondary btn-sm">
          + Something else…
        </button>
        <span className="text-xs text-ink-500">{emptyNote}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        aria-label={`Add a task from ${projectName}`}
        className="input max-w-md py-1.5 text-sm"
        value=""
        onChange={(e) => {
          const v = e.target.value;
          if (v === OTHER_VALUE) {
            setTyping(true);
          } else if (v !== "") {
            const task = available.find((t) => t.id === v);
            if (task) onPicked(task);
          }
        }}
      >
        <option value="">{placeholder}</option>
        {available.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
        <option value={OTHER_VALUE}>Other — something not on this list…</option>
      </select>
      <span className="text-xs text-ink-500">
        {available.length} unfinished {available.length === 1 ? "task" : "tasks"}
      </span>
    </div>
  );
}
