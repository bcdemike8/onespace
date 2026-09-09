"use client";

import { reopenMeetingAction } from "@/app/actions/google";
import { SubmitButton } from "@/components/SubmitButton";

/** Undo a logged meeting: the time entry goes with it, so nothing is orphaned. */
export function ReopenButton({ id }: { id: string }) {
  return (
    <form action={reopenMeetingAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton pendingLabel="Undoing..." className="btn-ghost btn-sm">
        Undo
      </SubmitButton>
    </form>
  );
}
