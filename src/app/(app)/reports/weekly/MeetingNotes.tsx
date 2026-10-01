"use client";

import { useState } from "react";
import { CopyBlock } from "./CopyBlock";

export interface MeetingRow {
  id: string;
  title: string;
  dateLabel: string;
  minutes: number;
  recordingUrl: string | null;
  summary: string | null;
  /** Why there's no write-up, when there isn't one. */
  note: string | null;
  commitments: { id: string; task: string; speaker: string | null; when: string | null }[];
}

/**
 * What was actually said this week, under the update that has to describe it.
 *
 * Deliberately outside the copied block: the RocketLane template is fixed and
 * adding a section to it is not this page's call. This is source material —
 * open it, read what the call covered, and write the Current Status and the
 * Risk from something better than memory.
 *
 * These summaries are a real record of a client conversation. They are here
 * because this whole page is admin-only, which is the same rule the meetings
 * list itself follows.
 */
export function MeetingNotes({ meetings }: { meetings: MeetingRow[] }) {
  const [open, setOpen] = useState(false);

  if (meetings.length === 0) return null;

  const written = meetings.filter((m) => m.summary).length;
  const promises = meetings.flatMap((m) => m.commitments);

  return (
    <div className="border-t border-ink-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-xs text-ink-600 hover:bg-ink-50"
      >
        <span>
          <span className="font-medium text-ink-900">
            {meetings.length} {meetings.length === 1 ? "meeting" : "meetings"} this week
          </span>
          {written > 0 ? ` · ${written} with a write-up from the recording` : null}
          {promises.length > 0
            ? ` · ${promises.length} ${promises.length === 1 ? "commitment" : "commitments"} made`
            : null}
        </span>
        <span className="text-ink-400">{open ? "▾" : "▸"}</span>
      </button>

      {open ? (
        <ul className="divide-y divide-ink-100 border-t border-ink-100">
          {meetings.map((m) => (
            <li key={m.id} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-ink-900">{m.title}</span>
                <span className="text-xs text-ink-500">
                  {m.dateLabel} · {m.minutes} min
                  {m.recordingUrl ? (
                    <>
                      {" · "}
                      <a
                        href={m.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-ink-900"
                      >
                        Recording
                      </a>
                    </>
                  ) : null}
                </span>
              </div>

              {m.summary ? (
                <>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-ink-700">
                    {m.summary}
                  </p>
                  <div className="mt-1.5">
                    <CopyBlock
                      text={m.summary}
                      label="Copy write-up"
                      className="btn-ghost btn-sm text-xs"
                    />
                  </div>
                </>
              ) : (
                // "Nobody recorded this" and "Zoom refused the download" look
                // the same from a list, and only one is worth chasing.
                <p className="mt-1 text-xs text-ink-400">
                  {m.note ?? "No write-up — this call wasn't recorded to the cloud."}
                </p>
              )}

              {m.commitments.length > 0 ? (
                <ul className="mt-2 space-y-0.5 text-xs text-ink-600">
                  {m.commitments.map((c) => (
                    <li key={c.id}>
                      → {c.task}
                      {c.speaker ? ` — ${c.speaker}` : ""}
                      {c.when ? `, ${c.when}` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
