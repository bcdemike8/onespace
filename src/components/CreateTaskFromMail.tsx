"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { createTaskFromMailAction } from "@/app/actions/mail";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

type State = { error?: string; ok?: boolean; message?: string };

export interface Assignable {
  id: string;
  name: string;
}

/**
 * "Create task" for a client email: name, assignee, due date, notes.
 *
 * Starts closed so it doesn't crowd the reply box, which is what most emails
 * need. Only offered once the email is filed to a project; the task goes on
 * that project and the email is linked to it.
 */
export function CreateTaskFromMail({
  threadId,
  subject,
  project,
  people,
  currentUserId,
  className = "",
}: {
  threadId: string;
  subject: string;
  /** The project the email is filed to, or null if it isn't yet. */
  project: { id: string; name: string } | null;
  people: Assignable[];
  currentUserId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createTaskFromMailAction, {} as State);
  // Bumped on each success so the form comes back empty for the next one.
  const [round, setRound] = useState(0);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      setCreated(true);
      setOpen(false);
      setRound((r) => r + 1);
    }
  }, [state]);

  if (!project) {
    return (
      <p className={`text-xs text-ink-500 ${className}`}>
        File this email to a project to make a task from it.
      </p>
    );
  }

  if (!open) {
    return (
      <div className={`flex flex-wrap items-center gap-3 ${className}`}>
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => {
            setOpen(true);
            setCreated(false);
          }}
        >
          Create task
        </button>
        {created ? (
          <span className="text-xs text-good-700">
            Task added to{" "}
            <Link href={`/projects/${project.id}`} className="font-medium underline">
              {project.name}
            </Link>
            .
          </span>
        ) : null}
      </div>
    );
  }

  const nameId = `task-name-${threadId}`;
  const whoId = `task-who-${threadId}`;
  const dueId = `task-due-${threadId}`;
  const notesId = `task-notes-${threadId}`;

  return (
    <form
      key={round}
      action={action}
      className={`rounded-lg border border-ink-200 bg-white p-3 ${className}`}
    >
      <input type="hidden" name="id" value={threadId} />
      <p className="mb-2 text-xs text-ink-500">
        New task on <span className="font-medium text-ink-700">{project.name}</span>. A
        link to this email goes in its notes.
      </p>

      <label className="label" htmlFor={nameId}>
        Task
      </label>
      <input
        id={nameId}
        name="name"
        className="input"
        defaultValue={subject.replace(/^\s*((re|fw|fwd)\s*:\s*)+/i, "")}
        required
        autoFocus
      />

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={whoId}>
            Assignee
          </label>
          <select id={whoId} name="assigneeId" className="input" defaultValue={currentUserId}>
            <option value="">Nobody yet</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={dueId}>
            Due
          </label>
          <input id={dueId} name="dueDate" type="date" className="input" />
        </div>
      </div>

      <label className="label mt-2" htmlFor={notesId}>
        Notes
      </label>
      <textarea
        id={notesId}
        name="notes"
        rows={2}
        className="input font-normal"
        placeholder="Optional"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SubmitButton pendingLabel="Creating…" className="btn-primary btn-sm">
          Create task
        </SubmitButton>
        <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      <ErrorNote message={state?.error} />
    </form>
  );
}
