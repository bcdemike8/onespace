"use client";

import { useState, useTransition } from "react";
import { setTaskDueDateAction } from "@/app/actions/tasks";

/**
 * "Change due date" on a task row. Opens a date field in place; saving moves the
 * task, and the page re-buckets it into Today / Next three days / ... on the
 * refresh. "No date" takes the due date off.
 */
export function TaskDueDateButton({
  taskId,
  taskName,
  dueDate,
}: {
  taskId: string;
  taskName: string;
  /** `YYYY-MM-DD`, or null when the task has no date. */
  dueDate: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(dueDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save(next: string) {
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.set("id", taskId);
      fd.set("dueDate", next);
      const res = await setTaskDueDateAction(fd);
      if (res?.error) setError(res.error);
      else setEditing(false);
    });
  }

  function cancel() {
    setValue(dueDate ?? "");
    setError(null);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="btn-secondary btn-sm"
        title={dueDate ? "Move this task to another day" : "Give this task a due date"}
      >
        {dueDate ? "Change due date" : "Set due date"}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <label className="sr-only" htmlFor={`due-${taskId}`}>
        New due date for {taskName}
      </label>
      <input
        id={`due-${taskId}`}
        type="date"
        value={value}
        autoFocus
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (value && value !== dueDate) save(value);
          } else if (e.key === "Escape") {
            cancel();
          }
        }}
        className="input w-[8.5rem] py-1 text-sm tnum"
      />
      <button
        type="button"
        onClick={() => save(value)}
        disabled={pending || !value || value === dueDate}
        className="btn-primary btn-sm"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {dueDate ? (
        <button
          type="button"
          onClick={() => save("")}
          disabled={pending}
          className="btn-secondary btn-sm"
          title="Take the due date off this task"
        >
          No date
        </button>
      ) : null}
      <button
        type="button"
        onClick={cancel}
        disabled={pending}
        aria-label="Cancel"
        className="px-1 text-ink-400 hover:text-ink-700"
      >
        ×
      </button>
      {error ? (
        <span role="alert" className="w-full text-xs text-bad-700">
          {error}
        </span>
      ) : null}
    </div>
  );
}
