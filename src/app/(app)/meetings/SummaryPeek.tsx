"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CallSummary } from "@/components/CallSummary";
import type { SummaryDoc } from "@/lib/summary";

/**
 * Whether this call has a write-up, on every card, always.
 *
 * The list used to show the write-up folded away when there was one and
 * nothing at all when there wasn't, so a page of calls with no summaries
 * looked exactly like a page of calls nobody had opened yet. The state has
 * to be visible without clicking, or "is this working" needs opening
 * seventy-five meetings to answer.
 *
 * The reason is worth as much as the summary here. "Claude isn't connected
 * on this service" repeated down the page is a diagnosis; a row of blanks
 * is not.
 */
export function SummaryPeek({
  id,
  title,
  doc,
  text,
  note,
  read,
}: {
  id: string;
  title: string;
  doc: SummaryDoc | null;
  text: string | null;
  /** Why there's no write-up, when the sync worked out why. */
  note: string | null;
  /** Whether the transcript has been read at all. */
  read: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  // showModal() is the only way to get the top layer and the backdrop; it
  // can't be set declaratively, so the open state drives it.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const has = Boolean(text);

  // A call read before Claude was connected has no write-up and no reason -
  // the old reader stored neither. Saying "nothing has been read from this
  // call yet" would be wrong twice over: it has been read, and the way back
  // is a button rather than another sync, which skips anything already read.
  const why =
    note ??
    (read
      ? "This call was read before Claude was connected, so nothing was written up from it. A plain sync won't revisit it - use Read this call now on the call itself, or Re-read transcripts at the top of this page to redo them all."
      : "Nothing has been read from this call yet. If it was cloud recorded, run Sync Zoom - the write-up comes from the transcript.");

  const preview = (has ? doc?.overview || text || "" : why)
    .replace(/\s+/g, " ")
    .trim();

  return (
    <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 border-t border-ink-100 pt-3 text-xs">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`chip shrink-0 transition-colors ${
          has
            ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
            : note
              ? "bg-warn-50 text-warn-700 hover:bg-warn-100"
              : "bg-ink-100 text-ink-600 hover:bg-ink-200"
        }`}
      >
        {has ? "Summary ↗" : "No write-up ↗"}
      </button>

      {/* line-clamp rather than truncate: truncate sets white-space: nowrap,
          which makes this span's min-content width the whole sentence. That
          propagates up through the grid track and scrolls the page sideways
          on a phone. */}
      <span className="min-w-0 flex-1 line-clamp-1 text-ink-500" title={preview}>
        {preview}
      </span>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        // Clicking the backdrop closes it: the click lands on the dialog
        // itself rather than on anything inside it.
        onClick={(e) => {
          if (e.target === dialog.current) setOpen(false);
        }}
        // m-auto because Tailwind's reset zeroes the margin the browser uses
        // to centre a modal dialog, which otherwise pins it to the top left.
        className="m-auto w-[min(46rem,calc(100vw-2rem))] rounded-xl border border-ink-200 bg-white p-0 text-ink-900 shadow-xl backdrop:bg-ink-900/40"
      >
        <div className="flex items-start justify-between gap-3 border-b border-ink-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="shrink-0 text-ink-400 hover:text-ink-800"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {doc ? (
            <CallSummary doc={doc} text={text} />
          ) : text ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
              {text}
            </p>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-ink-700">{why}</p>
              <p className="mt-3 text-xs text-ink-500">
                Open the call to ask Zoom what it has for it, or to read it
                again.
              </p>
            </>
          )}
        </div>

        <div className="border-t border-ink-200 px-5 py-3">
          <Link href={`/meetings/${id}`} className="btn-secondary btn-sm">
            Open the call
          </Link>
        </div>
      </dialog>
    </div>
  );
}
