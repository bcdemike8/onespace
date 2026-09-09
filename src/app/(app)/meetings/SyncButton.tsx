"use client";

import { useActionState } from "react";
import { syncCalendarAction } from "@/app/actions/google";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

/**
 * Pull the calendar on demand. The nightly sync does this on its own; the
 * button is for the first run and for "I just booked that, where is it".
 */
export function SyncButton({ admin }: { admin: boolean }) {
  const [state, action] = useActionState(syncCalendarAction, {} as { error?: string; message?: string });

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name="scope" value="me" />
        <SubmitButton pendingLabel="Reading your calendar…" className="btn-secondary btn-sm">
          Sync my calendar
        </SubmitButton>
      </form>

      {admin ? (
        <form action={action}>
          <input type="hidden" name="scope" value="all" />
          <SubmitButton pendingLabel="Reading everyone's…" className="btn-ghost btn-sm">
            Sync everyone
          </SubmitButton>
        </form>
      ) : null}

      {state?.message ? (
        <span className="w-full text-right text-xs text-ink-600 sm:w-auto">
          {state.message}
        </span>
      ) : null}
      <div className="w-full">
        <ErrorNote message={state?.error} />
      </div>
    </div>
  );
}
