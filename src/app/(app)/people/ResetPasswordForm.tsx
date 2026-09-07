"use client";

import { useActionState, useState } from "react";
import { resetPasswordAction } from "@/app/actions/people";
import { SubmitButton } from "@/components/SubmitButton";

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, action] = useActionState(resetPasswordAction, {});
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        className="text-xs text-ink-400 hover:text-ink-700"
        onClick={() => setOpen(true)}
      >
        Reset password
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={userId} />
      <input
        name="password"
        type="text"
        required
        minLength={8}
        placeholder="New password"
        className="input w-40 py-1 text-xs"
        autoComplete="off"
      />
      <SubmitButton className="btn-secondary btn-sm" pendingLabel="…">
        Set
      </SubmitButton>
      <button
        type="button"
        className="text-xs text-ink-400"
        onClick={() => setOpen(false)}
      >
        cancel
      </button>
      {state.error ? (
        <span className="text-xs text-bad-700">{state.error}</span>
      ) : null}
      {state.ok ? <span className="text-xs text-good-700">Done</span> : null}
    </form>
  );
}
