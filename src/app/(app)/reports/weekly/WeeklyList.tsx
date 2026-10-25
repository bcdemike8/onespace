"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { Rag } from "@/lib/rocketlane";
import { matchesQuery } from "@/lib/search";
import {
  FILTER_LABEL,
  type WeeklyFilter,
  countFor,
  countWeekly,
  matchesFilter,
  toggleFilter,
} from "@/lib/weekly-filter";
import { CopyBlock } from "./CopyBlock";

export interface WeeklyRow {
  key: string;
  /** Project, client and owner — what somebody would type to find this one. */
  text: string;
  /** The rendered update, so "Copy all" copies what's on screen. */
  copy: string;
  missing: boolean;
  health: Rag | null;
  node: ReactNode;
}

/**
 * The week's projects: the figures, the search, and the blocks they filter.
 *
 * The figures are the controls. Reading "39 missing" and then scrolling
 * fifty-five blocks to find them is the work the number was meant to save,
 * so pressing it keeps those thirty-nine. Pressing it again goes back.
 *
 * All of it happens here rather than in the query — the rows are rendered
 * already, so filtering them is instant and a server round trip would buy
 * nothing. "Copy all" copies what is left after both the figure and the
 * search, because copying fifty-five updates while three are on screen is
 * never what the button looked like it would do.
 */
export function WeeklyList({
  rows,
  weekLabel,
  weekFrom,
}: {
  rows: WeeklyRow[];
  weekLabel: string;
  weekFrom: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<WeeklyFilter>("all");

  const counts = useMemo(() => countWeekly(rows), [rows]);

  const shown = useMemo(
    () =>
      rows
        .filter((r) => matchesFilter(r, filter))
        .filter((r) => (query.trim() ? matchesQuery(r.text, query) : true)),
    [rows, filter, query],
  );

  const searching = query.trim().length > 0;
  const narrowed = searching || filter !== "all";
  const everything = shown.map((r) => r.copy).join("\n\n---\n\n");

  const press = (f: WeeklyFilter) => setFilter((c) => toggleFilter(c, f));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* The week isn't a filter — there is only one of it. */}
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-ink-500">Week</p>
          <p className="text-2xl font-semibold text-ink-900">{weekLabel}</p>
          <p className="text-xs text-ink-500">from {weekFrom}</p>
        </div>

        <FilterCard
          label="Updated"
          value={`${counts.updated} of ${counts.total}`}
          hint="live projects with an update this week"
          active={filter === "updated"}
          disabled={counts.updated === 0}
          onPress={() => press("updated")}
        />

        <FilterCard
          label="Missing"
          value={String(counts.missing)}
          hint={
            counts.missing
              ? "drafted from the week's activity below"
              : "nothing outstanding"
          }
          active={filter === "missing"}
          disabled={counts.missing === 0}
          onPress={() => press("missing")}
        />

        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-ink-500">RAG</p>
          <p className="flex items-baseline gap-1 text-2xl font-semibold">
            {(
              [
                ["ON_TRACK", "text-good-700", "green"],
                ["AT_RISK", "text-warn-700", "amber"],
                ["OFF_TRACK", "text-bad-700", "red"],
              ] as const
            ).map(([key, tone, word], i) => (
              <span key={key} className="flex items-baseline">
                {i > 0 ? <span className="px-1 text-ink-300">/</span> : null}
                <button
                  type="button"
                  disabled={counts[key] === 0}
                  onClick={() => press(key)}
                  aria-pressed={filter === key}
                  aria-label={`Show only ${word} projects`}
                  className={`rounded px-1 ${tone} ${
                    filter === key ? "bg-ink-900 text-white" : "hover:bg-ink-100"
                  } disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent`}
                >
                  {counts[key]}
                </button>
              </span>
            ))}
          </p>
          <p className="text-xs text-ink-500">green / amber / red, this week</p>
        </div>
      </div>

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
          {narrowed
            ? `${shown.length} of ${rows.length} projects`
            : `${rows.length} ${rows.length === 1 ? "project" : "projects"}`}
        </p>

        {filter !== "all" ? (
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="chip bg-ink-900 text-white hover:bg-ink-700"
          >
            Showing {FILTER_LABEL[filter]} ×
          </button>
        ) : null}

        <div className="ml-auto">
          {shown.length > 0 ? (
            <CopyBlock
              text={everything}
              label={narrowed ? `Copy these ${shown.length}` : `Copy all ${shown.length}`}
              className="btn-primary btn-sm"
            />
          ) : null}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="card p-6 text-center text-sm text-ink-700">
          {searching
            ? `Nothing matches “${query.trim()}”${
                filter === "all" ? "" : ` among the ${FILTER_LABEL[filter]}`
              } this week.`
            : `There are no ${FILTER_LABEL[filter]} this week.`}
        </div>
      ) : (
        shown.map((r) => <div key={r.key}>{r.node}</div>)
      )}
    </div>
  );
}

function FilterCard({
  label,
  value,
  hint,
  active,
  disabled,
  onPress,
}: {
  label: string;
  value: string;
  hint: string;
  active: boolean;
  /** A figure of zero filters to an empty page, so it isn't a button. */
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-pressed={active}
      className={`card p-4 text-left transition-colors ${
        active ? "ring-2 ring-ink-900" : ""
      } ${disabled ? "cursor-default opacity-60" : "hover:bg-ink-50"}`}
    >
      <p className="text-xs uppercase tracking-wide text-ink-500">{label}</p>
      <p className="text-2xl font-semibold text-ink-900">{value}</p>
      <p className="text-xs text-ink-500">
        {active ? "Showing these — press to clear" : hint}
      </p>
    </button>
  );
}
