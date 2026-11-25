"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { clearAwaitingMailAction, markMailDoneAction } from "@/app/actions/mail";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

type State = { error?: string; ok?: boolean; message?: string };

export interface AwaitingThread {
  id: string;
  subject: string;
  from: string;
  clientName: string | null;
  waitingDays: number;
  /** Filed to a project, so time can be booked against it. */
  projectName: string | null;
  /** The client's newest message, for the preview. */
  preview: {
    fromName: string | null;
    fromEmail: string;
    sentLabel: string;
    to: string[];
    cc: string[];
    body: string;
  } | null;
}

/** How many rows show before "Show more". The section is a nudge, not an inbox. */
const VISIBLE = 8;

const waitingLabel = (days: number) =>
  days === 0 ? "today" : days === 1 ? "1 day" : `${days} days`;

/**
 * "Waiting on your reply" on My work.
 *
 * Most of these need no reply at all - a "thanks", a confirmation, a
 * notification - and opening each one just to mark it done is the friction.
 * So each row can be read in place and marked done in place, and the whole
 * list can be cleared at once. Opening the thread is still one click away
 * for the ones that do need an answer.
 */
export function AwaitingReply({ threads }: { threads: AwaitingThread[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [clearState, clearAction] = useActionState(clearAwaitingMailAction, {} as State);

  if (threads.length === 0) return null;
  const shown = showAll ? threads : threads.slice(0, VISIBLE);
  const hidden = threads.length - shown.length;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-600">
          Waiting on your reply
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-500 tnum">{threads.length}</span>
          <form
            action={clearAction}
            onSubmit={(e) => {
              const n = threads.length;
              if (
                !window.confirm(
                  `Mark all ${n} thread${n === 1 ? "" : "s"} as done with no reply? They'll come back if the client writes again.`,
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            {threads.map((t) => (
              <input key={t.id} type="hidden" name="id" value={t.id} />
            ))}
            <SubmitButton pendingLabel="Clearing…" className="btn-ghost btn-sm">
              Clear all
            </SubmitButton>
          </form>
        </div>
      </div>
      <ErrorNote message={clearState?.error} />

      <ul className="card divide-y divide-ink-100">
        {shown.map((thread) => (
          <Row
            key={thread.id}
            thread={thread}
            expanded={open === thread.id}
            onToggle={() => setOpen((cur) => (cur === thread.id ? null : thread.id))}
          />
        ))}
      </ul>

      {hidden > 0 ? (
        <button
          type="button"
          className="mt-2 text-xs font-medium text-brand-700 hover:underline"
          onClick={() => setShowAll(true)}
        >
          Show {hidden} more
        </button>
      ) : null}
    </section>
  );
}

function Row({
  thread,
  expanded,
  onToggle,
}: {
  thread: AwaitingThread;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [doneState, doneAction] = useActionState(markMailDoneAction, {} as State);
  // Hidden straight away rather than waiting for the page to come back, so a
  // run of "done, done, done" doesn't have rows jumping under the cursor.
  if (doneState?.ok) return null;

  const previewId = `preview-${thread.id}`;

  return (
    <li className="px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link
          href={`/inbox/${thread.id}`}
          className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5 hover:text-brand-700"
        >
          <span className="text-sm font-medium text-ink-900">{thread.subject}</span>
          <span className="text-xs text-ink-500">
            {thread.from}
            {thread.clientName ? ` · ${thread.clientName}` : ""}
          </span>
        </Link>

        <span
          className={`text-xs tnum ${
            thread.waitingDays >= 2 ? "font-medium text-warn-700" : "text-ink-500"
          }`}
        >
          {waitingLabel(thread.waitingDays)}
        </span>

        <button
          type="button"
          className="btn-ghost btn-sm"
          aria-expanded={expanded}
          aria-controls={previewId}
          onClick={onToggle}
        >
          {expanded ? "Hide" : "Preview"}
        </button>

        <form action={doneAction}>
          <input type="hidden" name="id" value={thread.id} />
          <SubmitButton pendingLabel="…" className="btn-secondary btn-sm" title="No reply needed">
            Mark done
          </SubmitButton>
        </form>
      </div>

      <ErrorNote message={doneState?.error} />

      {expanded ? (
        <div id={previewId} className="mt-2 rounded-lg border border-ink-200 bg-ink-50 p-3">
          {thread.preview ? (
            <>
              <div className="flex flex-wrap items-baseline gap-2 text-sm">
                <span className="font-medium text-ink-900">
                  {thread.preview.fromName || thread.preview.fromEmail}
                </span>
                <span className="text-xs text-ink-500">{thread.preview.fromEmail}</span>
                <span className="ml-auto text-xs text-ink-400 tnum">
                  {thread.preview.sentLabel}
                </span>
              </div>
              {thread.preview.to.length > 0 ? (
                <p className="mt-0.5 truncate text-xs text-ink-400">
                  to {thread.preview.to.join(", ")}
                  {thread.preview.cc.length > 0 ? ` · cc ${thread.preview.cc.join(", ")}` : ""}
                </p>
              ) : null}
              <p className="mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap text-sm text-ink-800">
                {thread.preview.body || (
                  <span className="text-ink-400">(no text in this message)</span>
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-ink-500">No message to show.</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-ink-200 pt-3">
            <Link href={`/inbox/${thread.id}`} className="btn-primary btn-sm">
              Open to reply
            </Link>
            <form action={doneAction} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={thread.id} />
              <span className="text-xs text-ink-500">No reply needed?</span>
              <SubmitButton pendingLabel="…" className="btn-secondary btn-sm">
                Mark done
              </SubmitButton>
              {thread.projectName ? (
                <>
                  <label className="inline-flex items-center gap-1.5 text-xs text-ink-600">
                    <input type="checkbox" name="logTime" className="rounded" />
                    and log
                  </label>
                  <input
                    name="duration"
                    className="input w-20 py-1 text-xs tnum"
                    aria-label="Time spent reading"
                    placeholder="5m"
                  />
                  <span className="text-xs text-ink-500">to {thread.projectName}</span>
                </>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </li>
  );
}
