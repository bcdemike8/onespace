"use client";

import { useActionState, useState } from "react";
import {
  deleteTimeEntryAction,
  updateTimeEntryAction,
} from "@/app/actions/time";
import { SubmitButton } from "@/components/SubmitButton";

export interface TimeEntryRowData {
  id: string;
  dateISO: string;
  dateLabel: string;
  minutes: number;
  hoursLabel: string;
  notes: string | null;
  billable: boolean;
  personName: string;
  taskName: string;
  editable: boolean;
}

/**
 * A logged entry, with correction in place. Fixing a mistyped duration is the
 * single most common edit in a time tracker, so it shouldn't mean deleting the
 * entry and re-entering it.
 */
export function TimeEntryRow({ entry }: { entry: TimeEntryRowData }) {
  const [state, action] = useActionState(updateTimeEntryAction, {});
  const [editing, setEditing] = useState(false);

  if (editing && entry.editable) {
    return (
      <li className="bg-ink-50/60 px-4 py-3">
        <form action={action} className="space-y-2">
          <input type="hidden" name="id" value={entry.id} />
          <div className="text-xs font-medium text-ink-700">{entry.taskName}</div>

          <div className="grid grid-cols-2 gap-2">
            <input
              name="date"
              type="date"
              defaultValue={entry.dateISO}
              className="input py-1 text-xs"
              aria-label="Date"
            />
            <input
              name="duration"
              defaultValue={entry.hoursLabel}
              className="input py-1 text-xs"
              aria-label="Duration"
              autoComplete="off"
            />
          </div>

          <input
            name="notes"
            defaultValue={entry.notes ?? ""}
            placeholder="Notes"
            className="input py-1 text-xs"
            autoComplete="off"
          />

          <label className="flex items-center gap-2 text-xs text-ink-600">
            <input
              type="checkbox"
              name="billable"
              defaultChecked={entry.billable}
              className="h-3.5 w-3.5 rounded border-ink-300"
            />
            Billable
          </label>

          {state.error ? (
            <p className="text-xs text-bad-700">{state.error}</p>
          ) : null}

          <div className="flex items-center gap-2">
            <SubmitButton className="btn-primary btn-sm" pendingLabel="Saving…">
              Save
            </SubmitButton>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex gap-2 px-4 py-2.5 text-sm">
      <div className="min-w-0 flex-1">
        <div className="truncate text-ink-800">{entry.taskName}</div>
        <div className="truncate text-xs text-ink-500">
          {entry.personName} · {entry.dateLabel}
          {entry.notes ? ` · ${entry.notes}` : ""}
        </div>
      </div>

      <div className="shrink-0 text-right tnum">
        <div className="font-medium">{entry.hoursLabel}h</div>
        {!entry.billable ? (
          <div className="text-xs text-ink-400">non-billable</div>
        ) : null}
      </div>

      {entry.editable ? (
        <div className="flex shrink-0 items-start gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit entry"
            className="px-1 text-ink-400 opacity-0 transition-opacity hover:text-brand-700 group-hover:opacity-100"
          >
            ✎
          </button>
          <form action={deleteTimeEntryAction}>
            <input type="hidden" name="id" value={entry.id} />
            <button
              type="submit"
              aria-label="Delete entry"
              className="px-1 text-ink-400 opacity-0 transition-opacity hover:text-bad-700 group-hover:opacity-100"
            >
              ×
            </button>
          </form>
        </div>
      ) : null}
    </li>
  );
}
