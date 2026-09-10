"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { markMailDoneAction, replyAction } from "@/app/actions/mail";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

/**
 * Reply, and book the time it took.
 *
 * The clock starts when someone actually begins typing, not when the page
 * loads: a thread left open in a tab all afternoon is not four hours of
 * billable work, and a timer that says it was would be worse than no timer.
 * It pauses after two minutes of no typing for the same reason.
 */
const IDLE_MS = 2 * 60_000;

/** Rounded up to the nearest five minutes, with five as the floor. */
function billableMinutes(activeMs: number): number {
  return Math.max(5, Math.ceil(activeMs / 60_000 / 5) * 5);
}

function useTypingClock() {
  const [activeMs, setActiveMs] = useState(0);
  const lastTyped = useRef<number | null>(null);

  useEffect(() => {
    const tick = setInterval(() => {
      const last = lastTyped.current;
      if (last === null) return;
      const since = Date.now() - last;
      if (since > IDLE_MS) return; // gone quiet; stop counting
      setActiveMs((ms) => ms + 1000);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return {
    activeMs,
    noteActivity: () => {
      lastTyped.current = Date.now();
    },
    started: activeMs > 0,
  };
}

export function ReplyBox({
  threadId,
  canLogTime,
  projectName,
}: {
  threadId: string;
  canLogTime: boolean;
  projectName: string | null;
}) {
  const [state, action] = useActionState(replyAction, {} as { error?: string; ok?: boolean; message?: string });
  const [doneState, doneAction] = useActionState(markMailDoneAction, {} as { error?: string; ok?: boolean });
  const { activeMs, noteActivity, started } = useTypingClock();
  const [duration, setDuration] = useState("");
  const [touched, setTouched] = useState(false);

  // The suggestion follows the clock until someone types over it, after which
  // it is theirs and the clock stops arguing.
  const suggested = `${billableMinutes(activeMs)}m`;
  const value = touched ? duration : started ? suggested : "";

  return (
    <div className="card mt-4 p-4">
      <form action={action}>
        <input type="hidden" name="id" value={threadId} />

        <label className="label" htmlFor="reply-body">
          Reply
        </label>
        <textarea
          id="reply-body"
          name="body"
          rows={8}
          className="input font-normal"
          placeholder="Write your reply…"
          onChange={noteActivity}
          onKeyDown={noteActivity}
          required
        />

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <SubmitButton pendingLabel="Sending…" className="btn-primary">
            Send reply
          </SubmitButton>

          {canLogTime ? (
            <>
              <label className="inline-flex items-center gap-1.5 text-sm text-ink-700">
                <input type="checkbox" name="logTime" defaultChecked className="rounded" />
                Log
              </label>
              <input
                name="duration"
                className="input w-20 tnum"
                aria-label="Time spent"
                placeholder="15m"
                value={value}
                onChange={(e) => {
                  setTouched(true);
                  setDuration(e.target.value);
                }}
              />
              <span className="pb-2 text-xs text-ink-500">
                to {projectName}
                {started && !touched ? " · timed while you typed" : ""}
              </span>
            </>
          ) : (
            <span className="pb-2 text-xs text-warn-700">
              File this to a project above and the time can go on your timesheet too.
            </span>
          )}
        </div>

        {state?.message ? (
          <p className="mt-2 text-xs text-warn-700">{state.message}</p>
        ) : null}
        <ErrorNote message={state?.error} />
      </form>

      <form action={doneAction} className="mt-3 flex flex-wrap items-center gap-3 border-t border-ink-100 pt-3">
        <input type="hidden" name="id" value={threadId} />
        <span className="text-xs text-ink-500">No reply needed?</span>
        <SubmitButton pendingLabel="…" className="btn-secondary btn-sm">
          Mark done
        </SubmitButton>
        {canLogTime ? (
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
          </>
        ) : null}
        <ErrorNote message={doneState?.error} />
      </form>
    </div>
  );
}
