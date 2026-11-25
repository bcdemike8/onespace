"use client";

import { useActionState } from "react";
import { markMeetingsLoggedAction, removeMeetingsAction } from "@/app/actions/google";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

type State = { error?: string; ok?: boolean; message?: string };

/**
 * The time is on the timesheet already, entered by hand: take the call off
 * the list as logged, without booking the hour a second time.
 */
export function AlreadyLoggedButton({
  id,
  className = "btn-ghost btn-sm",
  onDone,
}: {
  id: string;
  className?: string;
  onDone?: () => void;
}) {
  const [state, action] = useActionState(
    async (prev: { error?: string }, formData: FormData) => {
      const result = await markMeetingsLoggedAction(prev, formData);
      if (!result.error) onDone?.();
      return result;
    },
    {} as { error?: string },
  );
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        pendingLabel="…"
        className={className}
        title="You've already put this time on the timesheet yourself. Labels it Manually logged, without adding the time again."
      >
        Already logged
      </SubmitButton>
      <ErrorNote message={state?.error} />
    </form>
  );
}

/**
 * Not work at all - a focus block, a doctor's appointment. Out of every
 * list; "Show them" at the top of All brings it back into view.
 */
export function RemoveButton({ id }: { id: string }) {
  const [state, action] = useActionState(removeMeetingsAction, {} as State);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        pendingLabel="…"
        className="btn-ghost btn-sm text-ink-500"
        title="Not work - a block, an appointment. Takes it out of every view; the calendar sync won't bring it back."
      >
        Remove
      </SubmitButton>
      <ErrorNote message={state?.error} />
    </form>
  );
}
