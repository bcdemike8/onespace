// Every "date" in OneSpace is a calendar day, not an instant. We store them
// as UTC midnight and read them back with UTC getters, so a timesheet entry
// logged on the 3rd stays on the 3rd no matter where the server or the
// browser happens to be.

export const DAY_MS = 86_400_000;

/** Normalise anything date-ish to UTC midnight of that calendar day. */
export function dayStart(input: Date | string): Date {
  if (typeof input === "string") {
    const [y, m, d] = input.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  return new Date(
    Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()),
  );
}

/** Today, as a calendar day in the given IANA zone (defaults to the server's). */
export function today(timeZone?: string): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone || undefined,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return dayStart(parts);
}

export const addDays = (date: Date, n: number) =>
  new Date(date.getTime() + n * DAY_MS);

/** `YYYY-MM-DD` — the form used in URLs, `<input type="date">` and CSV. */
export const toISODate = (date: Date) => date.toISOString().slice(0, 10);

/** Monday-start week containing `date`. */
export function weekStart(date: Date): Date {
  const d = dayStart(date);
  const dow = d.getUTCDay(); // 0 = Sunday
  return addDays(d, dow === 0 ? -6 : 1 - dow);
}

export const weekEnd = (date: Date) => addDays(weekStart(date), 6);

export const monthStart = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

export const monthEnd = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));

export const quarterStart = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), Math.floor(date.getUTCMonth() / 3) * 3, 1));

export const quarterEnd = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), Math.floor(date.getUTCMonth() / 3) * 3 + 3, 0),
  );

export const yearStart = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
export const yearEnd = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), 11, 31));

// ------------------------------------------------------------- range presets

export type RangePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "last_30"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "custom";

export const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This week" },
  { value: "last_week", label: "Last week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_30", label: "Last 30 days" },
  { value: "this_quarter", label: "This quarter" },
  { value: "last_quarter", label: "Last quarter" },
  { value: "this_year", label: "This year" },
  { value: "custom", label: "Custom range" },
];

export function resolveRange(
  preset: RangePreset,
  fromISO?: string | null,
  toISO?: string | null,
): { from: Date; to: Date } {
  const now = today();

  switch (preset) {
    case "today":
      return { from: now, to: now };
    case "yesterday": {
      const y = addDays(now, -1);
      return { from: y, to: y };
    }
    case "this_week":
      return { from: weekStart(now), to: weekEnd(now) };
    case "last_week": {
      const prev = addDays(weekStart(now), -7);
      return { from: prev, to: addDays(prev, 6) };
    }
    case "this_month":
      return { from: monthStart(now), to: monthEnd(now) };
    case "last_month": {
      const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      return { from: prev, to: monthEnd(prev) };
    }
    case "last_30":
      return { from: addDays(now, -29), to: now };
    case "this_quarter":
      return { from: quarterStart(now), to: quarterEnd(now) };
    case "last_quarter": {
      const prev = new Date(Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3 - 3, 1));
      return { from: quarterStart(prev), to: quarterEnd(prev) };
    }
    case "this_year":
      return { from: yearStart(now), to: yearEnd(now) };
    case "custom":
      return {
        from: fromISO ? dayStart(fromISO) : monthStart(now),
        to: toISO ? dayStart(toISO) : now,
      };
  }
}

// ---------------------------------------------------------------- formatting

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts });

const shortFmt = fmt({ month: "short", day: "numeric" });
const mediumFmt = fmt({ month: "short", day: "numeric", year: "numeric" });
const weekdayFmt = fmt({ weekday: "short" });
const monthFmt = fmt({ month: "short", year: "numeric" });

export const formatShort = (d: Date) => shortFmt.format(d);
export const formatMedium = (d: Date) => mediumFmt.format(d);
export const formatWeekday = (d: Date) => weekdayFmt.format(d);
export const formatMonth = (d: Date) => monthFmt.format(d);

export function formatRange(from: Date, to: Date): string {
  if (from.getTime() === to.getTime()) return formatMedium(from);
  if (from.getUTCFullYear() === to.getUTCFullYear()) {
    return `${formatShort(from)} – ${formatMedium(to)}`;
  }
  return `${formatMedium(from)} – ${formatMedium(to)}`;
}

/** "3 days overdue", "due today", "in 5 days" — for keeping people on track. */
export function relativeDueLabel(due: Date, now = today()): string {
  const days = Math.round((dayStart(due).getTime() - now.getTime()) / DAY_MS);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days === -1) return "1 day overdue";
  if (days < 0) return `${-days} days overdue`;
  if (days <= 7) return `Due in ${days} days`;
  return `Due ${formatMedium(due)}`;
}

// ------------------------------------------------------------------ buckets

export type Granularity = "day" | "week" | "month";

export const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

/** The bucket a date falls into, as a sortable key plus a display label. */
export function bucketOf(date: Date, granularity: Granularity) {
  switch (granularity) {
    case "day":
      return { key: toISODate(date), label: formatShort(date) };
    case "week": {
      const start = weekStart(date);
      return { key: toISODate(start), label: `Wk of ${formatShort(start)}` };
    }
    case "month": {
      const start = monthStart(date);
      return { key: toISODate(start), label: formatMonth(start) };
    }
  }
}

/** Every bucket in [from, to], so empty periods still show as zero columns. */
export function bucketsBetween(from: Date, to: Date, granularity: Granularity) {
  const out: { key: string; label: string }[] = [];
  const seen = new Set<string>();
  let cursor = dayStart(from);

  while (cursor <= to) {
    const bucket = bucketOf(cursor, granularity);
    if (!seen.has(bucket.key)) {
      seen.add(bucket.key);
      out.push(bucket);
    }
    cursor =
      granularity === "month"
        ? new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
        : addDays(cursor, granularity === "week" ? 7 : 1);
  }
  return out;
}
