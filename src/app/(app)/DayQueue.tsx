"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  acceptCommitmentAction,
  dismissCommitmentAction,
} from "@/app/actions/zoom";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export interface QueueProject {
  id: string;
  name: string;
  clientName: string | null;
}

export interface QueueCommitment {
  id: string;
  text: string;
  suggestedTask: string;
  /** Who is on the hook, when the recap named someone. */
  speaker: string | null;
  source: "TRANSCRIPT" | "ZOOM_SUMMARY" | "RECAP_EMAIL";
  /** ISO date for the input, or null when nothing was said. */
  dueDate: string | null;
  dueStated: boolean;
  /** Where it came from, for the line under the task name. */
  originLabel: string;
  originHref: string | null;
  /** The project the meeting or thread is already filed against. */
  projectId: string | null;
}

const WHERE: Record<QueueCommitment["source"], string> = {
  TRANSCRIPT: "You said this on the call",
  ZOOM_SUMMARY: "From Zoom's summary of the call",
  RECAP_EMAIL: "You wrote this in the recap",
};

/**
 * What the last few days produced, waiting to become work.
 *
 * The queue is the point of the page. A consultant comes off three calls and
 * writes two recaps, and by Thursday nobody remembers what they said they'd
 * do on Tuesday. Everything here is a suggestion with the sentence attached:
 * turning one into a task takes a click, and so does saying no.
 */
export function DayQueue({
  items,
  projects,
}: {
  items: QueueCommitment[];
  projects: QueueProject[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-600">
          You said you&apos;d do this
        </h2>
        <span className="text-xs text-ink-500 tnum">{items.length}</span>
      </div>

      <ul className="card divide-y divide-ink-100">
        {items.map((item) => (
          <QueueRow key={item.id} item={item} projects={projects} />
        ))}
      </ul>
    </section>
  );
}

function QueueRow({
  item,
  projects,
}: {
  item: QueueCommitment;
  projects: QueueProject[];
}) {
  const [state, action] = useActionState(
    acceptCommitmentAction,
    {} as { error?: string; ok?: boolean },
  );
  const [showSaid, setShowSaid] = useState(false);

  return (
    <li className="px-4 py-3">
      {/* Two sibling forms, not nested: a form inside a form is invalid HTML
          and the browser's parser drops the inner one. `display: contents`
          lets both sets of controls sit on the same flex row anyway. */}
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <form action={action} className="contents">
          <input type="hidden" name="id" value={item.id} />
          <input
            id={`n-${item.id}`}
            name="name"
            defaultValue={item.suggestedTask}
            aria-label="Task name"
            className="input min-w-[11rem] flex-1 py-1 text-sm"
            maxLength={200}
          />

          <label className="sr-only" htmlFor={`d-${item.id}`}>
            Due
          </label>
          <input
            id={`d-${item.id}`}
            name="dueDate"
            type="date"
            defaultValue={item.dueDate ?? ""}
            className={`input w-[8.5rem] shrink-0 py-1 text-sm tnum ${
              item.dueStated ? "" : "text-ink-500"
            }`}
            title={
              item.dueStated
                ? "The date you named"
                : "Nothing was said about when — three working days, change it"
            }
          />

          <label className="sr-only" htmlFor={`p-${item.id}`}>
            Project
          </label>
          <select
            id={`p-${item.id}`}
            name="projectId"
            defaultValue={item.projectId ?? ""}
            className="input w-[11rem] shrink-0 py-1 text-sm"
            required
          >
            <option value="">Which project?</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.clientName ? `${p.clientName} — ` : ""}
                {p.name}
              </option>
            ))}
          </select>

          <SubmitButton pendingLabel="Adding…" className="btn-primary btn-sm">
            Add it
          </SubmitButton>
          </form>
          <DismissButton id={item.id} />
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
          <span>{WHERE[item.source]}</span>
          {item.speaker && item.source === "RECAP_EMAIL" ? (
            <span className="chip bg-ink-100 text-ink-700">{item.speaker}</span>
          ) : null}
          <span aria-hidden="true">·</span>
          {item.originHref ? (
            <Link href={item.originHref} className="hover:text-ink-800 hover:underline">
              {item.originLabel}
            </Link>
          ) : (
            <span>{item.originLabel}</span>
          )}
          {!item.dueStated ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-warn-700">no date given</span>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => setShowSaid((v) => !v)}
            className="ml-auto text-ink-500 underline decoration-ink-300 hover:text-ink-800"
          >
            {showSaid ? "Hide" : "What was said"}
          </button>
        </div>

        {showSaid ? (
          <p className="border-l-2 border-ink-200 pl-2 text-xs italic text-ink-600">
            &ldquo;{item.text}&rdquo;
          </p>
        ) : null}

        <ErrorNote message={state?.error} />
      </div>
    </li>
  );
}

function DismissButton({ id }: { id: string }) {
  return (
    <form action={dismissCommitmentAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton pendingLabel="…" className="btn-ghost btn-sm">
        Not a task
      </SubmitButton>
    </form>
  );
}
