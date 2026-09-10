"use client";

import { useActionState } from "react";
import { syncMailAction } from "@/app/actions/mail";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

/**
 * Pull client mail on demand.
 *
 * Slower than the calendar sync — it reads a thread at a time — so the
 * pending label says what it's doing rather than leaving someone wondering.
 */
export function MailSyncButton({ admin }: { admin: boolean }) {
  const [state, action] = useActionState(syncMailAction, {} as { error?: string; message?: string });

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <form action={action}>
        <input type="hidden" name="scope" value="me" />
        <SubmitButton pendingLabel="Reading client mail…" className="btn-secondary btn-sm">
          Sync my mail
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
