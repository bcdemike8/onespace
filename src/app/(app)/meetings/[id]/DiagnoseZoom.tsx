"use client";

import { useActionState } from "react";
import { diagnoseZoomAction } from "@/app/actions/zoom";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

/**
 * Ask Zoom what it has for this call, and print the answer.
 *
 * Shown only where there's no write-up, and only to an admin - it's a
 * diagnostic, not a feature. It exists because "I can see the transcript in
 * Zoom" and "OneSpace found no transcript" can both be true, and the reason
 * is always something specific that nobody can guess at from here.
 */
export function DiagnoseZoom({ id }: { id: string }) {
  const [state, action] = useActionState(
    diagnoseZoomAction,
    {} as { error?: string; message?: string },
  );

  return (
    <div className="mt-3">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <SubmitButton pendingLabel="Asking Zoom…" className="btn-ghost btn-sm">
          Ask Zoom what it has
        </SubmitButton>
      </form>
      {state?.message ? (
        <p className="mt-2 whitespace-pre-wrap rounded-lg bg-ink-50 p-3 text-xs leading-relaxed text-ink-700">
          {state.message}
        </p>
      ) : null}
      <ErrorNote message={state?.error} />
    </div>
  );
}
