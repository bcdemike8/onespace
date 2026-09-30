"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { matchesQuery } from "@/lib/search";

export interface SearchableRow {
  key: string;
  /** Everything about this row worth typing: name, code, client, partner, owner. */
  text: string;
  /** The <tr> itself, rendered on the server and handed over whole. */
  node: ReactNode;
}

/**
 * The Projects table, with a search box that filters it as you type.
 *
 * The filtering is done here rather than in the query on purpose. Every row
 * is already on the page, so matching them in the browser is instant and
 * costs no round trip - forty-three projects filter between keystrokes,
 * where a server search would put a database call behind every letter.
 *
 * The cost is that it can only find what the tab and filters already let
 * through. That's why an empty result on a narrowed view offers All rather
 * than just saying no: "I can't find Honeycomb" usually means Honeycomb is
 * finished, not missing.
 */
export function ProjectTable({
  header,
  rows,
  allHref,
  narrowed,
  initialQuery = "",
}: {
  header: ReactNode;
  rows: SearchableRow[];
  /** The same view with every status included. */
  allHref: string;
  /** Whether a tab or filter is currently hiding some projects. */
  narrowed: boolean;
  /** ?q= from the URL, so widening to All keeps what was typed. */
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);

  const shown = useMemo(
    () => (query.trim() ? rows.filter((r) => matchesQuery(r.text, query)) : rows),
    [rows, query],
  );

  const searching = query.trim().length > 0;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-200 p-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          {/* Deliberately not type="search": the browser's own clear cross
              sits beside this one and the pair reads as a mistake. */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
            }}
            placeholder="Search projects, clients, partners or owners…"
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
            ? `${shown.length} of ${rows.length} ${rows.length === 1 ? "project" : "projects"}`
            : `${rows.length} ${rows.length === 1 ? "project" : "projects"}`}
        </p>
      </div>

      {shown.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-ink-700">
            Nothing here matches “{query.trim()}”.
          </p>
          {narrowed ? (
            <p className="mt-1 text-sm text-ink-500">
              It may be on a project this view is hiding —{" "}
              <Link
                href={`${allHref}&q=${encodeURIComponent(query.trim())}`}
                className="underline hover:text-ink-900"
              >
                search every project instead
              </Link>
              .
            </p>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[58rem]">
            <thead className="border-b border-ink-200 bg-ink-50">{header}</thead>
            <tbody className="divide-y divide-ink-100">
              {shown.map((r) => r.node)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
