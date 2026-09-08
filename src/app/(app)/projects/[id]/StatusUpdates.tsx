"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ProjectHealth } from "@prisma/client";
import {
  addStatusUpdateAction,
  deleteStatusUpdateAction,
} from "@/app/actions/status";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";
import { HealthChip, HEALTH_LABEL } from "@/components/HealthChip";

export interface StatusUpdateView {
  id: string;
  health: ProjectHealth;
  note: string | null;
  dateLabel: string;
  authorName: string;
  canDelete: boolean;
}

const OPTIONS: { value: ProjectHealth; hint: string }[] = [
  { value: "ON_TRACK", hint: "Going to plan" },
  { value: "AT_RISK", hint: "Something could derail it" },
  { value: "OFF_TRACK", hint: "Already slipped" },
];

const TONE: Record<ProjectHealth, string> = {
  ON_TRACK: "border-good-500 bg-good-50 text-good-700",
  AT_RISK: "border-warn-500 bg-warn-50 text-warn-700",
  OFF_TRACK: "border-bad-500 bg-bad-50 text-bad-700",
};

export function StatusUpdates({
  projectId,
  today,
  current,
  history,
}: {
  projectId: string;
  today: string;
  current: StatusUpdateView | null;
  history: StatusUpdateView[];
}) {
  const [state, action] = useActionState(addStatusUpdateAction, {});
  const [health, setHealth] = useState<ProjectHealth>(current?.health ?? "ON_TRACK");
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-ink-900">Status</h2>
          <HealthChip health={current?.health ?? null} />
          {current ? (
            <span className="text-xs text-ink-500">
              {current.dateLabel} · {current.authorName}
            </span>
          ) : (
            <span className="text-xs text-ink-500">
              Nobody has said how this is going yet.
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Cancel" : "Post an update"}
        </button>
      </div>

      {current?.note && !open ? (
        <p className="whitespace-pre-line border-b border-ink-100 px-4 py-3 text-sm text-ink-700">
          {current.note}
        </p>
      ) : null}

      {open ? (
        <form ref={formRef} action={action} className="space-y-3 border-b border-ink-100 p-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="health" value={health} />

          <div className="flex flex-wrap gap-2">
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setHealth(o.value)}
                aria-pressed={health === o.value}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  health === o.value
                    ? TONE[o.value]
                    : "border-ink-200 bg-white text-ink-600 hover:border-ink-300"
                }`}
              >
                <span className="block font-medium">{HEALTH_LABEL[o.value]}</span>
                <span className="block text-xs opacity-80">{o.hint}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <div>
              <label className="label" htmlFor="su-date">
                As of
              </label>
              <input
                id="su-date"
                name="date"
                type="date"
                defaultValue={today}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="su-note">
                What&apos;s happening
                {health === "ON_TRACK" ? (
                  <span className="font-normal text-ink-400"> (optional)</span>
                ) : null}
              </label>
              <textarea
                id="su-note"
                name="note"
                rows={3}
                className="input"
                placeholder={
                  health === "ON_TRACK"
                    ? "Anything worth noting for whoever reads this next."
                    : "What's the problem, and what happens next?"
                }
              />
            </div>
          </div>

          <ErrorNote message={state.error} />

          <SubmitButton pendingLabel="Posting…">Post update</SubmitButton>
        </form>
      ) : null}

      {history.length > 0 ? (
        <div>
          <h3 className="border-b border-ink-100 bg-ink-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-600">
            History
          </h3>
          <ul className="divide-y divide-ink-100">
            {history.map((u) => (
              <li key={u.id} className="group flex gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <HealthChip health={u.health} size="sm" />
                    <span className="text-xs text-ink-500">
                      {u.dateLabel} · {u.authorName}
                    </span>
                  </div>
                  {u.note ? (
                    <p className="mt-1 whitespace-pre-line text-sm text-ink-700">
                      {u.note}
                    </p>
                  ) : null}
                </div>
                {u.canDelete ? (
                  <form action={deleteStatusUpdateAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <button
                      type="submit"
                      aria-label="Delete this update"
                      className="px-1 text-ink-400 opacity-0 transition-opacity hover:text-bad-700 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
