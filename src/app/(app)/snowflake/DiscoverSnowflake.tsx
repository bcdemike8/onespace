"use client";

import { useActionState } from "react";
import { discoverSnowflakeAction, type SnowflakeState } from "@/app/actions/snowflake";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export function DiscoverSnowflake() {
  const [state, action] = useActionState(
    async (_prev: SnowflakeState) => discoverSnowflakeAction(),
    {} as SnowflakeState,
  );

  return (
    <div>
      <form action={action}>
        <SubmitButton pendingLabel="Asking Snowflake…" className="btn-primary">
          Ask Snowflake what it has
        </SubmitButton>
      </form>

      {state?.report ? (
        <pre className="mt-4 overflow-x-auto rounded-lg bg-ink-50 p-4 text-xs leading-relaxed text-ink-800">
          {state.report}
        </pre>
      ) : null}
      <div className="mt-3">
        <ErrorNote message={state?.error} />
      </div>
    </div>
  );
}
