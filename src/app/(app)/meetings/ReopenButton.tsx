"use client";

import { reopenMeetingAction } from "@/app/actions/google";
import { SubmitButton } from "@/components/SubmitButton";

/**
 * Put a meeting back in the list to be dealt with again.
 *
 * Two words for one action, because they undo two different decisions. On a
 * logged meeting this is Undo, and the time entry goes with it so nothing is
 * orphaned. On a dismissed one there is no entry to remove — it is somebody
 * deciding, possibly weeks later, that a call they wrote off is billable
 * after all. Calling both "Undo" made the second read like taking something
 * back rather than changing your mind.
 */
export function ReopenButton({
  id,
  dismissed = false,
}: {
  id: string;
  dismissed?: boolean;
}) {
  return (
    <form action={reopenMeetingAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        pendingLabel={dismissed ? "Moving…" : "Undoing…"}
        className={dismissed ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
      >
        {dismissed ? "Billable after all" : "Undo"}
      </SubmitButton>
    </form>
  );
}
