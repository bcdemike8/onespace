"use client";

import { useActionState } from "react";
import {
  discoverOutreachAction,
  huntTranscriptAction,
  reconcileKaiaAction,
  type OutreachState,
} from "@/app/actions/outreach";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

type Job = "discover" | "hunt" | "reconcile";

const LABEL: Record<Job, { idle: string; busy: string }> = {
  discover: { idle: "Ask Outreach what it has", busy: "Asking Outreach…" },
  hunt: { idle: "Look for the transcript", busy: "Looking…" },
  reconcile: { idle: "Check every recorded call", busy: "Comparing…" },
};

const RUN: Record<Job, () => Promise<OutreachState>> = {
  discover: discoverOutreachAction,
  hunt: huntTranscriptAction,
  reconcile: reconcileKaiaAction,
};

export function DiscoverOutreach({ job = "discover" }: { job?: Job }) {
  const [state, action] = useActionState(
    async (_prev: OutreachState) => RUN[job](),
    {} as OutreachState,
  );

  return (
    <div>
      <form action={action}>
        <SubmitButton pendingLabel={LABEL[job].busy} className="btn-primary">
          {LABEL[job].idle}
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
