"use client";

import { useActionState } from "react";
import {
  clearInboxAction,
  markMailDoneAction,
  reopenMailAction,
} from "@/app/actions/mail";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

type State = { error?: string; ok?: boolean; message?: string };

/**
 * One inbox row with "Mark done" beside it.
 *
 * Plenty of client mail needs no answer - a "thanks", a confirmation - and
 * opening each thread just to close it is the friction. The row's link and
 * the button are siblings, never nested, so clicking the button doesn't open
 * the thread.
 */
export function InboxRow({
  id,
  done,
  children,
}: {
  id: string;
  /** On the Done tab: offer Reopen instead. */
  done: boolean;
  children: React.ReactNode;
}) {
  const [state, action] = useActionState(markMailDoneAction, {} as State);
  // Hide straight away so a run of "done, done, done" doesn't have rows
  // jumping under the cursor while the page refreshes.
  if (state?.ok) return null;

  return (
    <li className="flex items-start gap-2 pr-3 transition-colors hover:bg-ink-50">
      <div className="min-w-0 flex-1">{children}</div>
      <div className="shrink-0 pt-2.5">
        {done ? (
          <form action={reopenMailAction}>
            <input type="hidden" name="id" value={id} />
            <SubmitButton pendingLabel="…" className="btn-ghost btn-sm" title="Move back to To answer">
              Reopen
            </SubmitButton>
          </form>
        ) : (
          <form action={action}>
            <input type="hidden" name="id" value={id} />
            <SubmitButton pendingLabel="…" className="btn-secondary btn-sm" title="No reply needed">
              Mark done
            </SubmitButton>
          </form>
        )}
        <ErrorNote message={state?.error} />
      </div>
    </li>
  );
}

/** Mark every thread currently listed as done, after a confirm. */
export function ClearAllButton({ ids, label }: { ids: string[]; label: string }) {
  const [state, action] = useActionState(clearInboxAction, {} as State);
  if (ids.length === 0) return null;
  const n = ids.length;

  return (
    <>
      <form
        action={action}
        onSubmit={(e) => {
          if (
            !window.confirm(
              `Mark ${n === 1 ? "this thread" : `all ${n} ${label} threads`} as done? They'll come back if the client writes again.`,
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        {ids.map((id) => (
          <input key={id} type="hidden" name="id" value={id} />
        ))}
        <SubmitButton pendingLabel="Clearing…" className="btn-ghost btn-sm">
          Clear all ({n})
        </SubmitButton>
      </form>
      <ErrorNote message={state?.error} />
    </>
  );
}
