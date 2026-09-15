"use client";

import { useActionState } from "react";
import {
  discoverOutreachAction,
  huntTranscriptAction,
  type OutreachState,
} from "@/app/actions/outreach";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export function DiscoverOutreach({ hunt = false }: { hunt?: boolean }) {
  const [state, action] = useActionState(
    async (_prev: OutreachState) =>
      hunt ? huntTranscriptAction() : discoverOutreachAction(),
    {} as OutreachState,
  );

  return (
    <div>
      <form action={action}>
        <SubmitButton
          pendingLabel={hunt ? "Looking…" : "Asking Outreach…"}
          className="btn-primary"
        >
          {hunt ? "Look for the transcript" : "Ask Outreach what it has"}
        </SubmitButton>
      </form>

      {state?.report ? (
        <pre className="mt-4 max-h-[32rem] overflow-auto rounded-lg bg-ink-50 p-4 text-xs leading-relaxed whitespace-pre-wrap break-all text-ink-800">
          {state.report}
        </pre>
      ) : null}
      <div className="mt-3">
        <ErrorNote message={state?.error} />
      </div>
    </div>
  );
}
