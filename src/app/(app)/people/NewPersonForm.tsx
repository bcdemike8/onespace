"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPersonAction } from "@/app/actions/people";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export function NewPersonForm() {
  const [state, action] = useActionState(createPersonAction, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="p-name">
          Name
        </label>
        <input id="p-name" name="name" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="p-email">
          Email
        </label>
        <input id="p-email" name="email" type="email" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="p-password">
          Starting password
        </label>
        <input
          id="p-password"
          name="password"
          type="text"
          required
          minLength={8}
          className="input"
          autoComplete="off"
        />
        <p className="mt-1 text-xs text-ink-500">
          Share it with them — they can change it from their account page.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="p-cost">
            Cost / hour
          </label>
          <input
            id="p-cost"
            name="costRate"
            className="input"
            placeholder="45"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="label" htmlFor="p-bill">
            Bill / hour
          </label>
          <input
            id="p-bill"
            name="billRate"
            className="input"
            placeholder="125"
            autoComplete="off"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="p-role">
          Role
        </label>
        <select id="p-role" name="role" className="input" defaultValue="MEMBER">
          <option value="MEMBER">Member — sees their own tasks and time</option>
          <option value="ADMIN">Admin — full access and reports</option>
        </select>
      </div>
      <ErrorNote message={state.error} />
      <SubmitButton className="btn-primary w-full" pendingLabel="Adding…">
        Add person
      </SubmitButton>
    </form>
  );
}
