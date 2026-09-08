"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createTaskAction } from "@/app/actions/tasks";
import { ErrorNote } from "@/components/ui";

/**
 * "+" on a task row, opening a one-field form for a subtask. Deliberately
 * spartan: a subtask is usually a step someone thought of mid-flow, and asking
 * for an owner, a date and an estimate at that moment is how you get people to
 * stop breaking work down at all. Everything else is editable on the row after.
 */
export function AddSubtaskButton({
  parentId,
  projectId,
  parentName,
}: {
  parentId: string;
  projectId: string;
  parentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createTaskAction, {});
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Clear the field on success so a second subtask can be typed straight away.
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      inputRef.current?.focus();
    }
  }, [state.ok]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost btn-sm opacity-0 transition-opacity group-hover:opacity-100"
        aria-label={`Add a subtask to ${parentName}`}
        title="Add subtask"
      >
        +
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="flex w-full items-center gap-2 sm:w-auto"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="parentId" value={parentId} />
      <input
        ref={inputRef}
        name="name"
        required
        placeholder="Subtask"
        className="input w-56 py-1 text-xs"
        aria-label={`New subtask under ${parentName}`}
      />
      <button type="submit" className="btn-secondary btn-sm">
        Add
      </button>
      <button
        type="button"
        className="btn-ghost btn-sm"
        onClick={() => setOpen(false)}
        aria-label="Cancel"
      >
        ×
      </button>
      <ErrorNote message={state.error} />
    </form>
  );
}
