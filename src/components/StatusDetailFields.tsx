"use client";

import { useState } from "react";

/**
 * The rest of the RocketLane update, behind a disclosure.
 *
 * Shared by the status form on a project page and the dialog on the Projects
 * list, so there is one definition of what a full update is. Collapsed by
 * default and every field optional: the quick path - pick a colour, say what
 * is happening - has to stay quick, or the weekly updates stop getting
 * written at all, and a missing update is worse than a thin one.
 */
export interface StatusDetail {
  ragReasons?: string | null;
  painPoints?: string | null;
  risk?: string | null;
  nextSteps?: string | null;
  customerQuotes?: string | null;
  baselineMetrics?: string | null;
  projectMetrics?: string | null;
}

const FIELDS: {
  name: keyof StatusDetail;
  label: string;
  placeholder: string;
  rows?: number;
}[] = [
  {
    name: "ragReasons",
    label: "RAG status reasons",
    placeholder: "Why it's that colour.",
  },
  { name: "painPoints", label: "Pain points", placeholder: "Open blockers, named." },
  {
    name: "risk",
    label: "Risk",
    placeholder: "What could slip the timeline or outcome, and why.",
  },
  {
    name: "nextSteps",
    label: "Next steps",
    placeholder: "One per line, each with an owner.",
    rows: 3,
  },
  {
    name: "customerQuotes",
    label: "Notable customer quotes",
    placeholder: "Verbatim, with who said it and when.",
  },
  {
    name: "baselineMetrics",
    label: "Baseline metrics",
    placeholder: "Pre-engagement baseline, if there is one.",
  },
  {
    name: "projectMetrics",
    label: "Project metrics",
    placeholder: 'Results to date, or "Pre-launch — no results yet."',
  },
];

export function StatusDetailFields({
  idPrefix,
  values,
}: {
  /** Keeps the label/field ids unique when two of these are on one page. */
  idPrefix: string;
  values?: StatusDetail;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-ink-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
      >
        <span>
          Full RocketLane detail
          <span className="ml-2 text-xs text-ink-500">
            risks, next steps, metrics — optional
          </span>
        </span>
        <span className="text-ink-400">{open ? "▾" : "▸"}</span>
      </button>

      {/* Kept mounted once opened so a half-typed answer survives collapsing
          the panel by accident. */}
      <div className={open ? "space-y-3 border-t border-ink-200 p-3" : "hidden"}>
        {FIELDS.map((f) => (
          <div key={f.name}>
            <label className="label" htmlFor={`${idPrefix}-${f.name}`}>
              {f.label}
            </label>
            <textarea
              id={`${idPrefix}-${f.name}`}
              name={f.name}
              rows={f.rows ?? 2}
              defaultValue={values?.[f.name] ?? ""}
              className="input"
              placeholder={f.placeholder}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
