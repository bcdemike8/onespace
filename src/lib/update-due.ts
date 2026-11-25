// When is a project's weekly status update owed?
//
// The rule: every active project gets a status update by end of day Monday.
// Anything posted from the Tuesday before through that Monday counts for it,
// so a project whose weekly call is on a Tuesday, Wednesday or Thursday can be
// written up straight after the call and that clears the coming Monday. Most
// consultants post on the Friday or the Monday.
//
//   Tue  Wed  Thu  Fri  Sat  Sun  Mon      <- one update in here clears Monday
//
// Reminders show Friday to Monday for anything with nothing posted since the
// Tuesday. From Tuesday, a project that got nothing in the whole window is
// overdue until somebody posts.
//
// The workflow starts on Friday 27 November 2026: nothing is flagged before
// then, and the first deadline is Monday 30 November (window 24-30 Nov).
//
// All dates are calendar days at UTC midnight, like everywhere else.

import { DAY_MS, addDays, dayStart, formatMedium } from "@/lib/dates";

/** The day the weekly-update workflow switched on. */
export const UPDATES_START = dayStart("2026-11-27");
/** The first Monday anything was due. */
export const FIRST_DEADLINE = addDays(UPDATES_START, 3);

export type UpdateDue =
  /** Something posted in this week's window: next Monday is covered. */
  | { state: "posted"; dueDate: Date; lastUpdate: Date }
  /** Tuesday to Thursday, last Monday was met, nothing expected yet. */
  | { state: "ok"; dueDate: Date; lastUpdate: Date | null }
  /** Friday to Monday with nothing posted since Tuesday. */
  | { state: "due"; dueDate: Date; dueToday: boolean; lastUpdate: Date | null }
  /** Nothing posted for last Monday's deadline, or since. */
  | { state: "overdue"; missed: Date; dueDate: Date; lastUpdate: Date | null }
  /** Not judged: not active, too new, or the workflow hasn't started. */
  | {
      state: "exempt";
      reason: "inactive" | "new" | "not-started";
      dueDate: Date | null;
      lastUpdate: Date | null;
    };

/** The Monday deadline the week `today` sits in: today if it's a Monday. */
export function deadlineFor(today: Date): Date {
  const d = dayStart(today);
  return addDays(d, (8 - d.getUTCDay()) % 7); // 1 is Monday
}

/** The Tuesday that opens the window for a Monday deadline. */
export const windowStart = (deadline: Date) => addDays(deadline, -6);

/**
 * Does a project owe the update due on `deadline`? Only if it existed by the
 * Friday before: a project set up on a Sunday doesn't owe one on Monday.
 */
const owes = (created: Date, deadline: Date) =>
  deadline >= FIRST_DEADLINE && dayStart(created) <= addDays(deadline, -3);

export function updateDue({
  today,
  lastUpdate,
  projectCreated,
  active,
}: {
  today: Date;
  lastUpdate: Date | null;
  projectCreated: Date;
  /** Only ACTIVE projects owe an update; on-hold ones don't. */
  active: boolean;
}): UpdateDue {
  const day = dayStart(today);
  const dueDate = deadlineFor(day);
  const last = lastUpdate ? dayStart(lastUpdate) : null;

  if (!active) return { state: "exempt", reason: "inactive", dueDate: null, lastUpdate: last };
  if (day < UPDATES_START) {
    return { state: "exempt", reason: "not-started", dueDate: FIRST_DEADLINE, lastUpdate: last };
  }

  if (last && last >= windowStart(dueDate)) {
    return { state: "posted", dueDate, lastUpdate: last };
  }

  const prevDeadline = addDays(dueDate, -7);
  const metPrev = last !== null && last >= windowStart(prevDeadline);
  if (owes(projectCreated, prevDeadline) && !metPrev) {
    return { state: "overdue", missed: prevDeadline, dueDate, lastUpdate: last };
  }

  if (!owes(projectCreated, dueDate)) {
    return { state: "exempt", reason: "new", dueDate: addDays(dueDate, 7), lastUpdate: last };
  }

  // Friday, Saturday, Sunday or Monday: the reminder days.
  if ([5, 6, 0, 1].includes(day.getUTCDay())) {
    return {
      state: "due",
      dueDate,
      dueToday: day.getTime() === dueDate.getTime(),
      lastUpdate: last,
    };
  }
  return { state: "ok", dueDate, lastUpdate: last };
}

/** Days from the last update to today, or null if there's never been one. */
export function daysSinceUpdate(lastUpdate: Date | null, today: Date): number | null {
  if (!lastUpdate) return null;
  return Math.max(
    0,
    Math.round((dayStart(today).getTime() - dayStart(lastUpdate).getTime()) / DAY_MS),
  );
}

/**
 * My work only flags a project with nothing posted in the last 7 days
 * (today and the six before it). It's the daily dashboard, so a project
 * written up on Wednesday isn't nagged about on Friday.
 *
 * On a Monday "the last 7 days" is exactly the deadline's window, so a
 * project that's clear on My work on Monday evening has met the deadline.
 */
export function staleForMyWork(due: UpdateDue, today: Date): boolean {
  if (due.state === "exempt" || due.state === "posted") return false;
  const since = daysSinceUpdate(due.lastUpdate, today);
  return since === null || since >= 7;
}

function lastLabel(lastUpdate: Date | null, today: Date): string {
  const since = daysSinceUpdate(lastUpdate, today);
  if (since === null) return "never posted";
  if (since === 0) return "last update today";
  if (since === 1) return "last update yesterday";
  return `last update ${since} days ago`;
}

const dueWhen = (due: { dueDate: Date; dueToday?: boolean }) =>
  due.dueToday ? "due today" : `due Mon ${formatMedium(due.dueDate)}`;

/**
 * The line under the status chip, and whether it's an alert. `null` means
 * nothing to flag: the page shows its usual "as of" line.
 */
export function updateAlert(
  due: UpdateDue,
  today: Date,
): { label: string; tone: "warn" | "bad" } | null {
  const last = lastLabel(due.lastUpdate, today);
  switch (due.state) {
    case "overdue":
      return {
        label: `Missed Mon ${formatMedium(due.missed)} update · ${last}`,
        tone: "bad",
      };
    case "due":
      return {
        label: `Update ${dueWhen(due)} · ${last}`,
        tone: "warn",
      };
    case "ok":
      // Only reachable with an update in last week's window, or none ever.
      return due.lastUpdate
        ? null
        : { label: `Never posted · next ${dueWhen(due)}`, tone: "warn" };
    default:
      return null;
  }
}

/** My work: the same alert, but only once nothing's been posted for 7 days. */
export function myWorkAlert(
  due: UpdateDue,
  today: Date,
): { label: string; tone: "warn" | "bad" } | null {
  if (!staleForMyWork(due, today)) return null;
  if (due.state === "overdue") return updateAlert(due, today);
  const since = daysSinceUpdate(due.lastUpdate, today);
  const head = since === null ? "Never posted" : `No update in ${since} days`;
  return {
    label: `${head} · ${dueWhen(due as { dueDate: Date; dueToday?: boolean })}`,
    tone: "warn",
  };
}
