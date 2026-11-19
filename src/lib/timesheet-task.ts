/**
 * Logging time against something that isn't on the plan.
 *
 * Project plans come from SOW templates, so they describe the work that was
 * sold — not the escalation call, the unplanned rebuild or the favour that
 * actually ate Tuesday. Without somewhere to put those hours they get filed
 * against whatever task is nearest, which quietly corrupts the only record
 * of where a project's time went.
 */

/** The select value that means "none of these". */
export const OTHER_VALUE = "__other__";

/**
 * Where ad-hoc tasks land on the project. A section of their own rather than
 * loose among the SOW items: a project owner reading the plan can see at a
 * glance how much of it was never planned.
 */
export const UNPLANNED_SECTION = "Unplanned work";

/** The longest a task name can be. Past this it belongs in the cell note. */
export const MAX_NAME = 120;

/** Trimmed, with runs of whitespace collapsed — what gets compared and stored. */
export function tidyName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export type NameResult = { name: string } | { error: string };

export function cleanTaskName(raw: string): NameResult {
  const name = tidyName(raw ?? "");
  if (!name) return { error: "Say what the work was." };
  if (name.length > MAX_NAME) {
    return {
      error: `Keep it under ${MAX_NAME} characters — the detail belongs in the note.`,
    };
  }
  return { name };
}

/** Case- and spacing-insensitive: "Client call" and "client  call" are one task. */
export function sameName(a: string, b: string): boolean {
  return tidyName(a).toLowerCase() === tidyName(b).toLowerCase();
}

/**
 * Typing a name that already exists should land on that task rather than
 * minting a second one beside it — two rows called "Training" on one week is
 * nobody's idea of a timesheet.
 */
export function matchExisting<T extends { id: string; name: string }>(
  name: string,
  tasks: T[],
): T | null {
  return tasks.find((t) => sameName(t.name, name)) ?? null;
}
