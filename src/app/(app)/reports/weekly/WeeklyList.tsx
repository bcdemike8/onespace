"use client";

import { useMemo, useState, type ReactNode } from "react";
import { matchesQuery } from "@/lib/search";
import { CopyBlock } from "./CopyBlock";

export interface WeeklyRow {
  key: string;
  /** Project, client and owner — what somebody would type to find this one. */
  text: string;
  /** The rendered update, so "Copy all" copies what's on screen. */
  copy: string;
  node: ReactNode;
}

/**
 * The week's projects, filtered as you type.
 *
 * Forty-nine blocks is a long page, and the week you are chasing is usually
 * one account. Filtering happens here rather than in the query: the rows are
 * all rendered already, so matching them costs nothing and a server search
 * would put a database call behind every keystroke.
 *
 * "Copy all" copies what the filter left, not everything — copying forty-nine
 * updates when three are on screen is never what the button looked like it
 * would do.
 */
export function WeeklyList({ rows }: { rows: WeeklyRow[] }) {
  const [query, setQuery] = useState("");

  const shown = useMemo(
    () => (query.trim() ? rows.filter((r) => matchesQuery(r.text, query)) : rows),
    [rows, query],
  );

  const searching = query.trim().length > 0;
  const everything = shown.map((r) => r.copy).join("\n\n---\n\n");

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
            }}
            placeholder="Search projects, clients or owners…"
            aria-label="Search projects"
            className="input pr-14"
          />
          {searching ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs text-ink-500 hover:bg-ink-100 hover:text-ink-900"
            >
              Clear
            </button>
          ) : null}
        </div>

        <p className="text-sm text-ink-500" aria-live="polite">
          {searching
            ? `${shown.length} of ${rows.length} projects`
            : `${rows.length} ${rows.length === 1 ? "project" : "projects"}`}
        </p>

        <div className="ml-auto">
          {shown.length > 0 ? (
            <CopyBlock
              text={everything}
              label={searching ? `Copy these ${shown.length}` : `Copy all ${shown.length}`}
              className="btn-primary btn-sm"
            />
          ) : null}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="card p-6 text-center text-sm text-ink-700">
          No live project matches “{query.trim()}” this week.
        </div>
      ) : (
        shown.map((r) => <div key={r.key}>{r.node}</div>)
      )}
    </div>
  );
}
