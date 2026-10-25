import type { Rag } from "@/lib/rocketlane";

/**
 * Which slice of the Thursday report is on screen.
 *
 * The figures at the top of that page are the questions people actually have
 * — who wrote one, who didn't, what's red — so they are the controls too.
 * Reading "39 missing" and then scrolling 55 blocks to find them is the
 * work the number was supposed to save.
 *
 * Plain module, no database: the counting and the matching are the parts
 * worth testing, and tests can't import anything server-only.
 */

export type WeeklyFilter = "all" | "updated" | "missing" | Rag;

export interface Filterable {
  /** Nobody wrote an update dated inside the week. */
  missing: boolean;
  /** The RAG on this week's update. Null when there wasn't one. */
  health: Rag | null;
}

export interface WeeklyCounts {
  total: number;
  updated: number;
  missing: number;
  ON_TRACK: number;
  AT_RISK: number;
  OFF_TRACK: number;
}

export function countWeekly(rows: Filterable[]): WeeklyCounts {
  const counts: WeeklyCounts = {
    total: rows.length,
    updated: 0,
    missing: 0,
    ON_TRACK: 0,
    AT_RISK: 0,
    OFF_TRACK: 0,
  };

  for (const r of rows) {
    if (r.missing) counts.missing += 1;
    else counts.updated += 1;
    // Only a RAG from this week's update counts, so the three colours always
    // add up to `updated` rather than to some number in between.
    if (!r.missing && r.health) counts[r.health] += 1;
  }

  return counts;
}

export function matchesFilter(row: Filterable, filter: WeeklyFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "updated":
      return !row.missing;
    case "missing":
      return row.missing;
    default:
      return !row.missing && row.health === filter;
  }
}

/** How many a filter would leave, without applying it. */
export function countFor(filter: WeeklyFilter, counts: WeeklyCounts): number {
  return filter === "all" ? counts.total : counts[filter];
}

export const FILTER_LABEL: Record<WeeklyFilter, string> = {
  all: "every project",
  updated: "projects updated this week",
  missing: "projects with no update this week",
  ON_TRACK: "green projects",
  AT_RISK: "amber projects",
  OFF_TRACK: "red projects",
};

/**
 * Pressing the figure you are already looking at goes back to everything.
 *
 * A filter with no way out that is as obvious as the way in is a filter
 * somebody leaves on by accident and then reads the wrong total from.
 */
export function toggleFilter(
  current: WeeklyFilter,
  pressed: WeeklyFilter,
): WeeklyFilter {
  return current === pressed ? "all" : pressed;
}
