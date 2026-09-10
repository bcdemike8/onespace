"use client";

import { useActionState } from "react";
import { syncCalendarAction } from "@/app/actions/google";
import { rereadTranscriptsAction, syncZoomAction } from "@/app/actions/zoom";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

/**
 * Pull the calendar on demand. The nightly sync does this on its own; the
 * button is for the first run and for "I just booked that, where is it".
 */
export function SyncButton({ admin, zoom }: { admin: boolean; zoom: boolean }) {
  const [state, action] = useActionState(syncCalendarAction, {} as { error?: string; message?: string });
  const [zoomState, zoomAction] = useActionState(syncZoomAction, {} as { error?: string; message?: string });
  const [rereadState, rereadAction] = useActionState(
    rereadTranscriptsAction,
    {} as { error?: string; message?: string },
  );

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

      {zoom ? (
        <form action={zoomAction}>
          <input type="hidden" name="scope" value={admin ? "all" : "me"} />
          <SubmitButton pendingLabel="Reading Zoom…" className="btn-ghost btn-sm">
            Sync Zoom
          </SubmitButton>
        </form>
      ) : null}

      {admin && zoom ? (
        <form action={rereadAction}>
          <SubmitButton pendingLabel="Clearing…" className="btn-ghost btn-sm">
            Re-read transcripts
          </SubmitButton>
        </form>
      ) : null}

      {rereadState?.message ? (
        <span className="w-full text-right text-xs text-ink-600 sm:w-auto">
          {rereadState.message}
        </span>
      ) : null}

      {zoomState?.message ? (
        <span className="w-full text-right text-xs text-ink-600 sm:w-auto">
          {zoomState.message}
        </span>
      ) : null}

      {state?.message ? (
        <span className="w-full text-right text-xs text-ink-600 sm:w-auto">
          {state.message}
        </span>
      ) : null}
      <div className="w-full">
        <ErrorNote message={state?.error} />
        <ErrorNote message={zoomState?.error} />
        <ErrorNote message={rereadState?.error} />
      </div>
    </div>
  );
}
