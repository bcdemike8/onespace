"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { discardTimerAction, stopTimerAction } from "@/app/actions/time";
import { SubmitButton } from "@/components/SubmitButton";

export interface RunningTimerInfo {
  startedAt: string;
  taskName: string;
  projectName: string;
  projectId: string;
  notes: string | null;
}

const two = (n: number) => String(n).padStart(2, "0");

/**
 * Sticky bar shown whenever a stopwatch is running. The elapsed clock is
 * computed from the server-provided start time on every tick, so it stays
 * correct even if the tab was asleep for an hour.
 */
export function TimerBar({ timer }: { timer: RunningTimerInfo }) {
  const started = new Date(timer.startedAt).getTime();
  const [elapsed, setElapsed] = useState(() => Date.now() - started);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - started), 1000);
    return () => clearInterval(id);
  }, [started]);

  const total = Math.max(0, Math.floor(elapsed / 1000));
  const clock = `${two(Math.floor(total / 3600))}:${two(
    Math.floor((total % 3600) / 60),
  )}:${two(total % 60)}`;

  return (
    <div className="sticky top-0 z-20 border-b border-brand-300 bg-brand-200/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-700 opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-800" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink-900">
            {timer.taskName}
          </div>
          <Link
            href={`/projects/${timer.projectId}`}
            className="truncate text-xs text-brand-800 hover:text-ink-900"
          >
            {timer.projectName}
          </Link>
        </div>

        <div className="text-lg font-semibold tnum text-brand-900">{clock}</div>

        <form action={stopTimerAction}>
          <SubmitButton className="btn-primary btn-sm" pendingLabel="Stopping…">
            Stop &amp; log
          </SubmitButton>
        </form>
        <form action={discardTimerAction}>
          <SubmitButton className="btn-ghost btn-sm text-brand-900 hover:bg-brand-300" pendingLabel="…">
            Discard
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
