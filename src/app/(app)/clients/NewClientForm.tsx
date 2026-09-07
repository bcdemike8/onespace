"use client";

import { useActionState, useEffect, useRef } from "react";
import { createClientAction } from "@/app/actions/projects";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export function NewClientForm() {
  const [state, action] = useActionState(createClientAction, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="c-name">
          Name
        </label>
        <input id="c-name" name="name" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="c-notes">
          Notes <span className="font-normal text-ink-400">(optional)</span>
        </label>
        <textarea id="c-notes" name="notes" rows={2} className="input" />
      </div>
      <ErrorNote message={state.error} />
      <SubmitButton className="btn-primary w-full" pendingLabel="Adding…">
        Add client
      </SubmitButton>
    </form>
  );
}
