/**
 * Form fields into record fields.
 *
 * Pure: strings in, values out, no database. Four record types share these,
 * which is the point - "" and "—" and "none" all have to mean null in the
 * same way on every form, or an account edited today reads differently from
 * one edited last week.
 *
 * The rule throughout: an empty field clears the value rather than being
 * ignored. Somebody who deletes the contents of Next Step means to delete
 * the next step, and a form that silently keeps the old one is a form nobody
 * can trust to be showing the truth.
 */

/** A text box. Empty, or whitespace only, is null. */
export function text(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v === "" ? null : v;
}

/** Text that has to be there. Returns null when it isn't, for the caller to refuse. */
export const required = text;

/**
 * A select whose empty option means "nobody" or "none".
 *
 * Distinct from text() only in intent, and worth the separate name: a
 * relation set to "" is an unlink, and reading that as a literal id would
 * write an empty string into a foreign key.
 */
export const relation = text;

/** A checkbox. Unchecked fields aren't submitted at all, so absence is false. */
export function bool(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1";
}

/**
 * A date input, which submits YYYY-MM-DD.
 *
 * Read as UTC midnight, like everything else here. Reading it as local time
 * would move a close date across a quarter boundary for anyone west of
 * Greenwich, which is the one place a day's error changes a revenue report.
 */
export function date(value: FormDataEntryValue | null): Date | null {
  const v = text(value);
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const parsed = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** A date as a date input wants it back. */
export const dateValue = (d: Date | null | undefined): string =>
  d ? d.toISOString().slice(0, 10) : "";

/** A whole number. Anything unparseable is null rather than zero. */
export function int(value: FormDataEntryValue | null): number | null {
  const v = text(value);
  if (v === null) return null;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
}

/**
 * Money, or any decimal.
 *
 * Tolerant of what people actually type: "$6,300.00" and "6300" are the same
 * number. Refusing the first would be technically correct and would waste
 * somebody's afternoon.
 */
export function decimal(value: FormDataEntryValue | null): number | null {
  const v = text(value);
  if (v === null) return null;
  const n = Number(v.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** A percentage between 0 and 100, clamped rather than refused. */
export function percent(value: FormDataEntryValue | null): number | null {
  const n = int(value);
  if (n === null) return null;
  return Math.min(100, Math.max(0, n));
}

/** One of a fixed set, or the fallback. */
export function choice<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
  fallback: T,
): T {
  const v = text(value);
  return (allowed as readonly string[]).includes(v ?? "") ? (v as T) : fallback;
}

/** A semicolon or comma separated list, as a multi-select stores it. */
export function list(value: FormDataEntryValue | null): string[] {
  const v = text(value);
  if (!v) return [];
  return [...new Set(v.split(/[;,\n]/).map((s) => s.trim()).filter(Boolean))];
}

export const listValue = (values: string[] | null | undefined): string =>
  (values ?? []).join(", ");

/**
 * Whether a deal's stage means won, closed, or still open.
 *
 * Derived rather than asked for. Salesforce asked once and then had to keep
 * three fields agreeing forever; the export has deals whose stage says
 * Closed Won and whose IsWon says false, and every one of them is a bug
 * somebody had to chase. One field, two facts computed from it.
 */
export function stageFlags(stage: string): { isWon: boolean; isClosed: boolean } {
  return {
    isWon: stage === "CLOSED_WON",
    isClosed: stage === "CLOSED_WON" || stage === "CLOSED_LOST",
  };
}

/**
 * The odds a stage carries, where nobody has overridden them.
 *
 * Only applied when the field is left empty: a closed deal is 100 or 0 and
 * arguing about it wastes a click, but an open deal's probability is a
 * judgement and the form should not overwrite one.
 */
export function defaultProbability(stage: string): number | null {
  if (stage === "CLOSED_WON") return 100;
  if (stage === "CLOSED_LOST") return 0;
  return null;
}

export interface Problem {
  field: string;
  message: string;
}

/** The first problem, or null. Forms show one thing at a time. */
export function firstProblem(problems: Problem[]): string | null {
  return problems[0]?.message ?? null;
}
