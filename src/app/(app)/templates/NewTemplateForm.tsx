"use client";

import { useActionState } from "react";
import { createTemplateAction } from "@/app/actions/templates";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export function NewTemplateForm() {
  const [state, action] = useActionState(createTemplateAction, {});

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="t-name">
          Name
        </label>
        <input
          id="t-name"
          name="name"
          required
          className="input"
          placeholder="Monthly SEO retainer"
        />
      </div>
      <div>
        <label className="label" htmlFor="t-description">
          Description <span className="font-normal text-ink-400">(optional)</span>
        </label>
        <textarea
          id="t-description"
          name="description"
          rows={2}
          className="input"
          placeholder="What this playbook covers."
        />
      </div>
      <ErrorNote message={state.error} />
      <SubmitButton className="btn-primary w-full" pendingLabel="Creating…">
        Create template
      </SubmitButton>
    </form>
  );
}
