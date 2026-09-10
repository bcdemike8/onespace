"use client";

import { useActionState, useState } from "react";
import {
  acceptCommitmentAction,
  dismissCommitmentAction,
} from "@/app/actions/zoom";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export interface CommitmentRow {
  id: string;
  text: string;
  speaker: string | null;
  atSeconds: number | null;
  suggestedTask: string;
  fromSummary: boolean;
}

const stamp = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * What was promised on the call, waiting to become tasks.
 *
 * Each one shows the sentence it came from. That matters more than it looks:
 * the whole feature rests on trusting that OneSpace didn't invent a promise,
 * and the fastest way to check is to read what was actually said.
 */
export function Commitments({
  items,
  projectId,
  recordingUrl,
}: {
  items: CommitmentRow[];
  projectId: string | null;
  recordingUrl: string | null;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50/40 p-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-700">
          Said on the call
        </h4>
        <span className="text-xs text-ink-500">
          {items.length} thing{items.length === 1 ? "" : "s"} you said you&apos;d do
        </span>
        {recordingUrl ? (
          <a
            href={recordingUrl}
            target="_blank"
            rel="noopener"
            className="ml-auto text-xs text-brand-700 hover:underline"
          >
            Recording ↗
          </a>
        ) : null}
      </div>

      <ul className="mt-2 grid gap-2">
        {items.map((c) => (
          <CommitmentItem key={c.id} item={c} projectId={projectId} />
        ))}
      </ul>
    </div>
  );
}

function CommitmentItem({
  item,
  projectId,
}: {
  item: CommitmentRow;
  projectId: string | null;
}) {
  const [state, action] = useActionState(
    acceptCommitmentAction,
    {} as { error?: string; ok?: boolean },
  );
  const [showSaid, setShowSaid] = useState(false);

  return (
    <li className="rounded-md border border-ink-200 bg-white p-2">
      {/* Sibling forms rather than nested: a form inside a form is invalid
          HTML and the parser drops the inner one. */}
      <div className="flex flex-wrap items-center gap-2">
        <form action={action} className="contents">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="projectId" value={projectId ?? ""} />
        <input
          name="name"
          defaultValue={item.suggestedTask}
          aria-label="Task name"
          className="input min-w-[14rem] flex-1 py-1 text-sm"
          maxLength={200}
        />
        <SubmitButton pendingLabel="Adding…" className="btn-primary btn-sm">
          Make a task
        </SubmitButton>
        </form>
        <DismissButton id={item.id} />
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-500">
        {item.fromSummary ? (
          <span>From Zoom&apos;s summary</span>
        ) : (
          <>
            <span>{item.speaker ?? "Someone"}</span>
            {item.atSeconds !== null ? <span>at {stamp(item.atSeconds)}</span> : null}
          </>
        )}
        <button
          type="button"
          onClick={() => setShowSaid((v) => !v)}
          className="text-ink-500 underline decoration-ink-300 hover:text-ink-800"
        >
          {showSaid ? "Hide" : "What was said"}
        </button>
      </div>

      {showSaid ? (
        <p className="mt-1 border-l-2 border-ink-200 pl-2 text-xs italic text-ink-600">
          &ldquo;{item.text}&rdquo;
        </p>
      ) : null}

      <ErrorNote message={state?.error} />
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
