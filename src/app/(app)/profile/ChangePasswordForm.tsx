"use client";

import { useActionState, useEffect, useRef } from "react";
import { changeOwnPasswordAction } from "@/app/actions/people";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export function ChangePasswordForm() {
  const [state, action] = useActionState(changeOwnPasswordAction, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="current">
          Current password
        </label>
        <input
          id="current"
          name="current"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="confirm">
            Confirm
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
          />
        </div>
      </div>
      <ErrorNote message={state.error} />
      {state.ok ? <p className="text-sm text-good-700">Password updated.</p> : null}
      <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>
    </form>
  );
}
