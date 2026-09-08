"use client";

import { useActionState, useState } from "react";
import { setPeriodReopenAction } from "@/app/actions/time";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

/**
 * The "this month is closed" banner, with the admin escape hatch folded into
 * it. Putting the reopen control next to the explanation is deliberate: the
 * people who need it are the ones staring at a greyed-out cell.
 */
export function PeriodLockNotice({
  summary,
  admin,
  reopenedFrom,
}: {
  summary: string;
  admin: boolean;
  reopenedFrom: string | null;
}) {
  const [state, action] = useActionState(setPeriodReopenAction, {});
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
        reopenedFrom
          ? "border-warn-500/30 bg-warn-50 text-warn-700"
          : "border-ink-200 bg-ink-50 text-ink-600"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>{summary}</span>
        {admin ? (
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Cancel" : reopenedFrom ? "Change" : "Reopen a period"}
          </button>
        ) : null}
      </div>

      {admin && open ? (
        <form action={action} className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="label" htmlFor="reopen-from">
              Reopen everything from
            </label>
            <input
              id="reopen-from"
              type="date"
              name="reopenedFrom"
              defaultValue={reopenedFrom ?? ""}
              className="input w-44"
            />
          </div>
          <SubmitButton pendingLabel="Saving…">Apply</SubmitButton>
          {reopenedFrom ? (
            <button type="submit" name="clear" value="1" className="btn-secondary">
              Close it again
            </button>
          ) : null}
          <ErrorNote message={state.error} />
        </form>
      ) : null}
    </div>
  );
}
