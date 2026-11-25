"use client";

import { useActionState, useState } from "react";
import { dismissMeetingsBeforeAction } from "@/app/actions/google";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

/**
 * One control for the backlog: set aside everything of yours from before a
 * day. Shown only when there is something old enough to be worth it, and it
 * says how many before you press it, because a bulk write-off you can't size
 * up first is one you won't trust.
 *
 * `days` is the calendar day of each of your own waiting meetings, as
 * YYYY-MM-DD in the org's zone, so the count here matches what the server
 * will do.
 */
export function ClearBacklog({
  days,
  defaultBefore,
}: {
  days: string[];
  defaultBefore: string;
}) {
  const [before, setBefore] = useState(defaultBefore);
  const [state, action] = useActionState(dismissMeetingsBeforeAction, {} as {
    error?: string;
    message?: string;
  });
  const count = days.filter((d) => d < before).length;

  if (days.length === 0 && !state.message) return null;

  return (
    <div className="mb-4 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-700">
      {state.message ? <p className="mb-2 text-ink-800">{state.message}</p> : null}
      <ErrorNote message={state.error} />
      {days.length > 0 ? (
        <form
          action={action}
          onSubmit={(e) => {
            if (count === 0 || !window.confirm(`Set aside ${count} meeting${count === 1 ? "" : "s"} from before ${before}?`)) {
              e.preventDefault();
            }
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <span>Clear the backlog: set aside everything of mine from before</span>
          <input
            type="date"
            name="before"
            value={before}
            onChange={(e) => setBefore(e.target.value)}
            className="input w-auto py-1 text-sm"
            required
          />
          <SubmitButton
            pendingLabel="Setting aside…"
            className="btn-secondary btn-sm"
          >
            {count === 0
              ? "Nothing before then"
              : `Set aside ${count} meeting${count === 1 ? "" : "s"}`}
          </SubmitButton>
          <span className="w-full text-xs text-ink-500">
            They move to &ldquo;meetings you set aside&rdquo; below, not away. Any of
            them can still be logged with &ldquo;Billable after all&rdquo;.
          </span>
        </form>
      ) : null}
    </div>
  );
}
