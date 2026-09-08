"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPartnerAction } from "@/app/actions/projects";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export function NewPartnerForm() {
  const [state, action] = useActionState(createPartnerAction, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="flex items-end gap-2">
      <div className="flex-1">
        <label className="label" htmlFor="pt-name">
          Partner name
        </label>
        <input
          id="pt-name"
          name="name"
          required
          className="input"
          placeholder="Outreach"
        />
      </div>
      <SubmitButton className="btn-secondary" pendingLabel="Adding…">
        Add
      </SubmitButton>
      <ErrorNote message={state.error} />
    </form>
  );
}
