"use client";

import { useActionState } from "react";
import { diagnoseZoomAction, readCallAction } from "@/app/actions/zoom";
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

  const [read, readAction] = useActionState(
    readCallAction,
    {} as { error?: string; message?: string },
  );

  return (
    <div className="mt-3">
      {/* Two sibling forms on one row, never nested - a form inside a form
          is invalid HTML and the browser drops the inner one. */}
      <div className="flex flex-wrap items-center gap-2">
        <form action={readAction}>
          <input type="hidden" name="id" value={id} />
          <SubmitButton pendingLabel="Reading the call…" className="btn-secondary btn-sm">
            Read this call now
          </SubmitButton>
        </form>
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <SubmitButton pendingLabel="Asking Zoom…" className="btn-ghost btn-sm">
            Ask Zoom what it has
          </SubmitButton>
        </form>
      </div>

      {[read?.message, state?.message].filter(Boolean).map((m) => (
        <p
          key={m}
          className="mt-2 whitespace-pre-wrap rounded-lg bg-ink-50 p-3 text-xs leading-relaxed text-ink-700"
        >
          {m}
        </p>
      ))}
      <ErrorNote message={read?.error} />
      <ErrorNote message={state?.error} />
    </div>
  );
}
