"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createTaskAction } from "@/app/actions/tasks";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

/** Inline "add a task" row that stays open so you can add several in a row. */
export function AddTaskForm({
  projectId,
  sectionId,
  people,
}: {
  projectId: string;
  sectionId: string | null;
  people: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(createTaskAction, {});
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      (formRef.current?.elements.namedItem("name") as HTMLInputElement)?.focus();
    }
  }, [state]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full px-4 py-2 text-left text-sm text-ink-500 hover:bg-ink-50 hover:text-brand-700"
      >
        + Add task
      </button>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-2 bg-ink-50/60 p-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="sectionId" value={sectionId ?? ""} />

      <input
        name="name"
        required
        autoFocus
        placeholder="What needs doing?"
        className="input"
        autoComplete="off"
      />

      <div className="grid gap-2 sm:grid-cols-3">
        <select name="assigneeId" className="input" defaultValue="">
          <option value="">Unassigned</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input name="dueDate" type="date" className="input" aria-label="Due date" />
        <input
          name="estimatedHours"
          type="number"
          min="0"
          step="0.25"
          placeholder="Est. hours"
          className="input"
          aria-label="Estimated hours"
        />
      </div>

      <ErrorNote message={state.error} />

      <div className="flex items-center gap-2">
        <SubmitButton className="btn-primary btn-sm" pendingLabel="Adding…">
          Add task
        </SubmitButton>
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => setOpen(false)}
        >
          Done
        </button>
      </div>
    </form>
  );
}
