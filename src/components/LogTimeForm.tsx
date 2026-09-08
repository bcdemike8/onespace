"use client";

import type { BillingType } from "@prisma/client";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { logTimeAction } from "@/app/actions/time";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export interface LoggableProject {
  id: string;
  name: string;
  clientName: string | null;
  billingType: BillingType;
  tasks: { id: string; name: string }[];
}

/**
 * The manual "I worked N hours on this" form. Task list narrows to the chosen
 * project client-side — the whole set is small enough to ship at once, which
 * keeps the form instant.
 */
export function LogTimeForm({
  projects,
  defaultDate,
  defaultProjectId,
  defaultTaskId,
  earliestDate,
  compact = false,
}: {
  projects: LoggableProject[];
  defaultDate: string;
  defaultProjectId?: string;
  defaultTaskId?: string;
  /** First open day — anything earlier sits in a closed month. */
  earliestDate?: string;
  compact?: boolean;
}) {
  const [state, action] = useActionState(logTimeAction, {});
  const [projectId, setProjectId] = useState(
    defaultProjectId ?? projects[0]?.id ?? "",
  );
  const formRef = useRef<HTMLFormElement>(null);

  const nonBillable =
    projects.find((p) => p.id === projectId)?.billingType === "NON_BILLABLE";

  const tasks = useMemo(
    () => projects.find((p) => p.id === projectId)?.tasks ?? [],
    [projects, projectId],
  );

  // Clear the inputs after a successful save so the next entry is one keystroke away.
  useEffect(() => {
    if (state.ok) {
      const form = formRef.current;
      if (!form) return;
      (form.elements.namedItem("duration") as HTMLInputElement | null)?.focus();
      (form.elements.namedItem("duration") as HTMLInputElement | null)?.value &&
        ((form.elements.namedItem("duration") as HTMLInputElement).value = "");
      const notes = form.elements.namedItem("notes") as HTMLInputElement | null;
      if (notes) notes.value = "";
    }
  }, [state]);

  if (projects.length === 0) {
    return (
      <p className="text-sm text-ink-500">
        No active projects yet — create one before logging time.
      </p>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div className={compact ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
        <div>
          <label className="label" htmlFor="lt-project">
            Project
          </label>
          <select
            id="lt-project"
            name="projectId"
            required
            className="input"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.clientName ? `${p.clientName} — ${p.name}` : p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="lt-task">
            Task
          </label>
          <select
            id="lt-task"
            name="taskId"
            className="input"
            defaultValue={defaultTaskId ?? ""}
            key={projectId}
          >
            <option value="">— No specific task —</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="lt-date">
            Date
          </label>
          <input
            id="lt-date"
            name="date"
            type="date"
            required
            defaultValue={defaultDate}
            min={earliestDate}
            className="input"
          />
          {earliestDate ? (
            <p className="mt-1 text-xs text-ink-500">
              Months before this have been closed.
            </p>
          ) : null}
        </div>
        <div>
          <label className="label" htmlFor="lt-duration">
            Time
          </label>
          <input
            id="lt-duration"
            name="duration"
            required
            placeholder="1.5, 1:30 or 90m"
            className="input"
            autoComplete="off"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="lt-notes">
          Notes <span className="font-normal text-ink-400">(optional)</span>
        </label>
        <input id="lt-notes" name="notes" className="input" autoComplete="off" />
      </div>

      <ErrorNote message={state.error} />

      <div className="flex items-center justify-between gap-3">
        {nonBillable ? (
          // Nothing to decide: the server would force this off anyway.
          <span className="text-sm text-ink-500">
            Non-billable project — this time won&apos;t be invoiced.
          </span>
        ) : (
          <label className="flex items-center gap-2 text-sm text-ink-600">
            <input
              type="checkbox"
              name="billable"
              defaultChecked
              className="h-4 w-4 rounded border-ink-300"
            />
            Billable
          </label>
        )}
        <SubmitButton pendingLabel="Logging…">Log time</SubmitButton>
      </div>

      {state.ok ? (
        <p className="text-sm text-good-700">Logged.</p>
      ) : null}
    </form>
  );
}
