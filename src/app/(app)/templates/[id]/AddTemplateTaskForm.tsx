"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTemplateTaskAction } from "@/app/actions/templates";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export function AddTemplateTaskForm({
  templateId,
  sectionId,
  people,
}: {
  templateId: string;
  sectionId: string | null;
  people: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(createTemplateTaskAction, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      (ref.current?.elements.namedItem("name") as HTMLInputElement)?.focus();
    }
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-2 bg-ink-50/60 p-3">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="sectionId" value={sectionId ?? ""} />

      <input
        name="name"
        required
        placeholder="Step name — e.g. Kickoff call with client"
        className="input"
        autoComplete="off"
      />

      <div className="grid gap-2 sm:grid-cols-3">
        <select name="defaultAssigneeId" className="input" defaultValue="">
          <option value="">Assign later</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          name="offsetDays"
          type="number"
          step="1"
          placeholder="Due day (0 = kickoff)"
          className="input"
          aria-label="Due day offset from kickoff"
        />
        <input
          name="estimatedHours"
          type="number"
          min="0"
          step="0.25"
          placeholder="Est. hours"
          className="input"
          aria-label="Estimated hours"
        />
      </div>

      <ErrorNote message={state.error} />

      <SubmitButton className="btn-primary btn-sm" pendingLabel="Adding…">
        Add step
      </SubmitButton>
    </form>
  );
}
