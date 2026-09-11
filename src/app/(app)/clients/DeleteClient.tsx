"use client";

import { useActionState, useState } from "react";
import { deleteClientAction } from "@/app/actions/projects";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

/**
 * Delete, for the client who shouldn't exist at all.
 *
 * Hidden behind a link rather than sitting next to Archive, because for
 * almost every client Archive is the right answer and a delete button next
 * to it invites the wrong one. Where there is history attached, this doesn't
 * offer to delete at all - it says what is attached and points at Archive,
 * which is the honest shape of the choice.
 */
export function DeleteClient({
  id,
  name,
  attached,
}: {
  id: string;
  name: string;
  /** Projects, time entries, meetings and threads that reference this client. */
  attached: { projects: number; timeEntries: number; mailThreads: number };
}) {
  const [state, action] = useActionState(
    deleteClientAction,
    {} as { error?: string; ok?: boolean },
  );
  const [open, setOpen] = useState(false);

  const blockers: string[] = [];
  if (attached.projects > 0) {
    blockers.push(`${attached.projects} project${attached.projects === 1 ? "" : "s"}`);
  }
  if (attached.timeEntries > 0) {
    blockers.push(
      `${attached.timeEntries} logged ${attached.timeEntries === 1 ? "entry" : "entries"}`,
    );
  }
  if (attached.mailThreads > 0) {
    blockers.push(
      `${attached.mailThreads} email thread${attached.mailThreads === 1 ? "" : "s"}`,
    );
  }
  const blocked = blockers.length > 0;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-ink-400 hover:text-bad-700"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-bad-500/30 bg-bad-50 p-3">
      {blocked ? (
        <>
          <p className="text-xs text-bad-700">
            <strong>{name} can&apos;t be deleted.</strong> {blockers.join(", ")}{" "}
            {blockers.length === 1 ? "is" : "are"} attached. Deleting would
            leave that work with no client and quietly drop it out of their
            reports — nothing would error, the numbers would just be wrong.
          </p>
          <p className="mt-2 text-xs text-ink-600">
            <strong>Archive instead.</strong> It stops new meetings and mail
            arriving for them and keeps every hour on record. One click to
            undo.
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 text-xs text-ink-500 underline hover:text-ink-800"
          >
            Close
          </button>
        </>
      ) : (
        <form action={action} className="space-y-2">
          <input type="hidden" name="id" value={id} />
          <p className="text-xs text-bad-700">
            <strong>Delete {name} for good?</strong> Nothing is attached to
            them, so only the client and its email domains go. This can&apos;t
            be undone.
          </p>
          <label className="label" htmlFor={`confirm-${id}`}>
            Type <span className="font-mono">{name}</span> to confirm
          </label>
          <input
            id={`confirm-${id}`}
            name="confirmName"
            className="input"
            autoComplete="off"
            placeholder={name}
          />
          <div className="flex items-center gap-2">
            <SubmitButton pendingLabel="Deleting…" className="btn-danger btn-sm">
              Delete client
            </SubmitButton>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-ink-500 underline hover:text-ink-800"
            >
              Cancel
            </button>
          </div>
          <ErrorNote message={state?.error} />
        </form>
      )}
    </div>
  );
}
