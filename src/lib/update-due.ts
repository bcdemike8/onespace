// When is a project's weekly status update owed?
//
// The rule: every active project gets one update a week, written on Friday
// and in by end of day Monday at the latest. So the update week runs Friday
// to Thursday - the same seven days the weekly report covers (see
// weekEndingThursday in lib/rocketlane) - and the deadline sits on its
// Monday.
//
// Why not "nothing in the last 7 days"? A rolling window drifts. Post on a
// Wednesday and a 7-day rule stays quiet until the following Wednesday,
// sailing straight past the Monday deadline. Tying it to the week means
// Friday's alert is a reminder, Tuesday's is a miss, and an update counts for
// the week it was written in, whatever day that was.
//
// All dates are calendar days at UTC midnight, like everywhere else.

import { DAY_MS, addDays, dayStart, formatMedium } from "@/lib/dates";

export type UpdateDue =
  /** Something has been posted for this week. */
  | { state: "posted"; lastUpdate: Date }
  /** Friday to Monday with nothing posted yet: a reminder, not a miss. */
  | { state: "due"; dueDate: Date; dueToday: boolean; lastUpdate: Date | null }
  /** Past Monday with nothing posted this week. */
  | { state: "overdue"; dueDate: Date; lastUpdate: Date | null }
  /** On hold, or too new to owe one yet. */
  | { state: "exempt"; dueDate: Date | null; lastUpdate: Date | null };

/** The Friday that opens the update week `today` falls in. */
export function updateWeekStart(today: Date): Date {
  const d = dayStart(today);
  const back = (d.getUTCDay() - 5 + 7) % 7; // 5 is Friday
  return addDays(d, -back);
}

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
  const weekFrom = updateWeekStart(day);
  const dueDate = addDays(weekFrom, 3); // Monday
  const last = lastUpdate ? dayStart(lastUpdate) : null;

  if (last && last >= weekFrom) return { state: "posted", lastUpdate: last };

  if (!active) return { state: "exempt", dueDate: null, lastUpdate: last };

  // A project set up after this week's deadline can't have missed it. Its
  // first update is owed next Monday.
  if (dayStart(projectCreated) > dueDate) {
    return { state: "exempt", dueDate: addDays(dueDate, 7), lastUpdate: last };
  }

  if (day <= dueDate) {
    return {
      state: "due",
      dueDate,
      dueToday: day.getTime() === dueDate.getTime(),
      lastUpdate: last,
    };
  }
  return { state: "overdue", dueDate, lastUpdate: last };
}

/** Days from the last update to today, or null if there's never been one. */
export function daysSinceUpdate(due: UpdateDue, today: Date): number | null {
  if (!due.lastUpdate) return null;
  return Math.max(
    0,
    Math.round((dayStart(today).getTime() - due.lastUpdate.getTime()) / DAY_MS),
  );
}

/** One line for under the status chip. */
export function updateDueLabel(due: UpdateDue, today: Date): string {
  const since = daysSinceUpdate(due, today);
  const last =
    since === null
      ? "no update yet"
      : since === 0
        ? "last update today"
        : since === 1
          ? "last update yesterday"
          : `last update ${since} days ago`;

  switch (due.state) {
    case "posted":
      return since === 0 ? "Updated today" : `Updated ${since === 1 ? "yesterday" : `${since} days ago`}`;
    case "due":
      return `${due.dueToday ? "Update due today" : "Update due Monday"} · ${last}`;
    case "overdue":
      return `Update overdue · ${last}`;
    case "exempt":
      return due.dueDate
        ? `New · first update due Mon ${formatMedium(due.dueDate)}`
        : `On hold, no update needed · ${last}`;
  }
}
