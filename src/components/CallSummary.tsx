"use client";

import { useState } from "react";
import type { SummaryDoc } from "@/lib/summary";

/**
 * A call write-up, laid out.
 *
 * Overview, the substance under its own headings, what people undertook,
 * and a finer outline underneath. The outline is folded away by default -
 * it's the part you go to when the sections above haven't answered your
 * question, which is most of the time not.
 *
 * `text` is the same thing rendered flat, for the copy button. Most of
 * these end up pasted into a recap email an hour later, and retyping a
 * write-up from a screen is exactly the work this was meant to remove.
 */
export function CallSummary({
  doc,
  text,
}: {
  doc: SummaryDoc;
  text: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard blocked. The text is on screen; nothing more to do.
    }
  };

  const ours = doc.actionItems.filter((a) => a.ours);
  const theirs = doc.actionItems.filter((a) => !a.ours);

  return (
    <div className="text-sm leading-relaxed text-ink-700">
      {doc.overview ? (
        <p className="text-ink-800">{doc.overview}</p>
      ) : null}

      {doc.sections.map((s) => (
        <section key={s.heading} className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-600">
            {s.heading}
          </h4>
          <ul className="mt-1.5 grid gap-1.5 pl-4">
            {s.bullets.map((b, i) => (
              <li key={i} className="list-disc">
                {b}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {doc.actionItems.length > 0 ? (
        <section className="mt-4 rounded-lg border border-brand-200 bg-brand-50/40 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-700">
            Action items
          </h4>
          <ul className="mt-1.5 grid gap-2">
            {[...ours, ...theirs].map((a, i) => (
              <li key={i} className="flex gap-2">
                <span
                  aria-hidden="true"
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    a.ours ? "bg-brand-600" : "bg-ink-300"
                  }`}
                />
                <span>
                  {a.task}
                  {a.when ? (
                    <span className="text-ink-500"> — {a.when}</span>
                  ) : null}
                  {a.owner ? (
                    <span className="ml-1.5 chip bg-ink-100 text-ink-700">
                      {a.owner}
                    </span>
                  ) : null}
                  {!a.ours ? (
                    <span className="ml-1.5 text-xs text-ink-500">theirs</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {doc.outline.length > 0 ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-ink-500 hover:text-ink-800">
            Outline
          </summary>
          <div className="mt-2 border-l-2 border-ink-200 pl-3">
            {doc.outline.map((s) => (
              <section key={s.heading} className="mt-3 first:mt-0">
                <h5 className="text-xs font-semibold text-ink-700">{s.heading}</h5>
                <ul className="mt-1 grid gap-1 pl-4 text-ink-600">
                  {s.bullets.map((b, i) => (
                    <li key={i} className="list-disc">
                      {b}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </details>
      ) : null}

      {text ? (
        <button
          type="button"
          onClick={copy}
          className="mt-4 text-xs text-brand-700 underline decoration-brand-300 hover:decoration-brand-700"
        >
          {copied ? "Copied — paste it into the recap" : "Copy the write-up"}
        </button>
      ) : null}
    </div>
  );
}

