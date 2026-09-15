"use client";

import { useActionState } from "react";
import { sweepZoomAction } from "@/app/actions/zoom";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

type State = { error?: string; report?: string };

export function SweepZoom() {
  const [state, action] = useActionState(
    async (_prev: State) => sweepZoomAction(),
    {} as State,
  );

  return (
    <div>
      <form action={action}>
        <SubmitButton pendingLabel="Asking Zoom…" className="btn-primary">
          Ask Zoom about every call
        </SubmitButton>
      </form>

      {state?.report ? (
        <pre className="mt-4 max-h-[32rem] overflow-auto rounded-lg bg-ink-50 p-4 text-xs leading-relaxed whitespace-pre-wrap text-ink-800">
          {state.report}
        </pre>
      ) : null}
      <div className="mt-3">
        <ErrorNote message={state?.error} />
      </div>
    </div>
  );
}
