"use client";

import { useActionState, useState } from "react";
import { fileMailAction } from "@/app/actions/mail";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export interface ProjectOption {
  id: string;
  name: string;
  clientName: string | null;
  tasks: { id: string; name: string }[];
}

/**
 * Which project this thread's time belongs to.
 *
 * Separate from replying on purpose: filing is worth doing even when the
 * answer is "no reply needed", and time can't be booked until it's done.
 */
export function FileToProject({
  threadId,
  projects,
  projectId,
  taskId,
  reason,
}: {
  threadId: string;
  projects: ProjectOption[];
  projectId: string | null;
  taskId: string | null;
  reason: string | null;
}) {
  const [state, action] = useActionState(fileMailAction, {} as { error?: string; ok?: boolean });
  const [selected, setSelected] = useState(projectId ?? "");
  const [task, setTask] = useState(taskId ?? "");

  const tasks = projects.find((p) => p.id === selected)?.tasks ?? [];

  return (
    <form action={action} className="card p-3">
      <input type="hidden" name="id" value={threadId} />

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[14rem] flex-1">
          <label className="label" htmlFor="file-project">
            Filed under
          </label>
          <select
            id="file-project"
            name="projectId"
            className="input"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setTask("");
            }}
          >
            <option value="">Not filed</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.clientName ? `${p.clientName} — ` : ""}
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[10rem] flex-1">
          <label className="label" htmlFor="file-task">
            Task <span className="font-normal text-ink-400">optional</span>
          </label>
          <select
            id="file-task"
            name="taskId"
            className="input"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            disabled={tasks.length === 0}
          >
            <option value="">
              {tasks.length === 0 ? "No open tasks" : "No specific task"}
            </option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <SubmitButton pendingLabel="Saving…" className="btn-secondary">
          Save
        </SubmitButton>
      </div>

      {reason && !projectId ? (
        <p className="mt-2 text-xs text-ink-500">{reason}</p>
      ) : null}
      <ErrorNote message={state?.error} />
    </form>
  );
}
