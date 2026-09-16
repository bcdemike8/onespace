/**
 * A person's own profile: how to reach them, when they work, what they want
 * to hear about.
 *
 * Pure. No database, no `server-only`, no React — the same parsing runs in a
 * server action and in the browser, and every rule below is covered by
 * tests/profile.test.ts. The rules are small and boring, which is the point:
 * the interesting failure here is not a crash, it is a colleague's working
 * day quietly stored as 9pm because "9" was read as an hour in a string.
 */

// ------------------------------------------------------------------- days

export interface WorkDay {
  /** 0 for Sunday, matching Date#getDay and Date#getUTCDay. */
  value: number;
  /** "Mon" — for the checkbox row. */
  short: string;
  /** "Monday" — for screen readers and for prose. */
  label: string;
}

export const WORK_DAYS: WorkDay[] = [
  { value: 0, short: "Sun", label: "Sunday" },
  { value: 1, short: "Mon", label: "Monday" },
  { value: 2, short: "Tue", label: "Tuesday" },
  { value: 3, short: "Wed", label: "Wednesday" },
  { value: 4, short: "Thu", label: "Thursday" },
  { value: 5, short: "Fri", label: "Friday" },
  { value: 6, short: "Sat", label: "Saturday" },
];

/** Monday to Friday. What almost everybody picks, so it is the starting state. */
export const WEEKDAYS = [1, 2, 3, 4, 5];

/** Sorted, de-duplicated, and with anything that isn't a day dropped. */
export function cleanWorkDays(values: readonly number[]): number[] {
  const seen = new Set<number>();
  for (const v of values) {
    if (Number.isInteger(v) && v >= 0 && v <= 6) seen.add(v);
  }
  return [...seen].sort((a, b) => a - b);
}

/**
 * "Mon–Fri", "Mon–Wed, Fri", "Sun". Runs of consecutive days collapse.
 *
 * The week starts on Sunday in the data and reads better starting on Monday,
 * so Sunday sorts last here: somebody who works Sunday through Thursday gets
 * "Mon–Thu, Sun" rather than a run that appears to wrap.
 */
export function workDaysLabel(days: readonly number[]): string {
  const clean = cleanWorkDays(days);
  if (clean.length === 0) return "";
  if (clean.length === 7) return "Every day";

  // Monday first, Sunday last.
  const ordered = [...clean].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
  const rank = (d: number) => (d === 0 ? 7 : d);
  const name = (d: number) => WORK_DAYS[d].short;

  const runs: number[][] = [];
  for (const day of ordered) {
    const last = runs[runs.length - 1];
    if (last && rank(day) === rank(last[last.length - 1]) + 1) last.push(day);
    else runs.push([day]);
  }

  return runs
    .map((run) =>
      run.length === 1
        ? name(run[0])
        : run.length === 2
          ? `${name(run[0])}, ${name(run[1])}`
          : `${name(run[0])}–${name(run[run.length - 1])}`,
    )
    .join(", ");
}

// ------------------------------------------------------------------ hours

export const MINUTES_IN_DAY = 24 * 60;

/**
 * A typed time to minutes from midnight, or null if it isn't one.
 *
 * Accepts what people actually type and what `<input type="time">` submits:
 * "09:00", "9:00", "9", "9am", "9 AM", "5:30pm", "17:30". Rejects the rest
 * rather than guessing — a profile field left alone is better than one
 * silently set to something nobody chose.
 */
export function parseClock(input: string | null | undefined): number | null {
  const raw = (input ?? "").trim().toLowerCase();
  if (raw === "") return null;

  const m = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;

  let hour = Number(m[1]);
  const minute = m[2] === undefined ? 0 : Number(m[2]);
  const suffix = m[3];

  if (minute > 59) return null;

  if (suffix) {
    if (hour < 1 || hour > 12) return null;
    if (suffix === "pm" && hour !== 12) hour += 12;
    if (suffix === "am" && hour === 12) hour = 0;
  } else if (hour > 24) {
    return null;
  }

  const minutes = hour * 60 + minute;
  // 24:00 is a legitimate way to write the end of the day; 24:30 is not.
  if (minutes > MINUTES_IN_DAY) return null;
  return minutes;
}

/** Minutes from midnight as "09:00" — the value `<input type="time">` wants. */
export function formatClock(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "";
  const m = Math.max(0, Math.min(MINUTES_IN_DAY, Math.round(minutes)));
  const hh = String(Math.floor(m / 60) % 24).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Minutes from midnight as "9:00 AM" — for reading, not for an input. */
export function formatClockLabel(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "";
  const m = ((Math.round(minutes) % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const hour24 = Math.floor(m / 60);
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const suffix = hour24 < 12 ? "AM" : "PM";
  return `${hour}:${String(m % 60).padStart(2, "0")} ${suffix}`;
}

/** "9:00 AM – 5:30 PM", or "" when either end is unset. */
export function workHoursLabel(
  start: number | null | undefined,
  end: number | null | undefined,
): string {
  if (start === null || start === undefined) return "";
  if (end === null || end === undefined) return "";
  return `${formatClockLabel(start)} – ${formatClockLabel(end)}`;
}

// -------------------------------------------------------------- birthdays

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * How many days a month can have, at most.
 *
 * February gets 29. A birthday has no year, so there is no leap year to
 * check against - and somebody born on the 29th has a birthday on the 29th,
 * whatever a given calendar does with it.
 */
export function daysInMonth(month: number): number {
  if (!Number.isInteger(month) || month < 1 || month > 12) return 0;
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

/** Both set and inside the month, or both unset. Half a birthday is neither. */
export function isValidBirthday(
  month: number | null | undefined,
  day: number | null | undefined,
): boolean {
  if (month === null || month === undefined) return false;
  if (day === null || day === undefined) return false;
  if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
  return day >= 1 && day <= daysInMonth(month);
}

/** "March 14", or "" when there isn't one. */
export function formatBirthday(
  month: number | null | undefined,
  day: number | null | undefined,
): string {
  if (!isValidBirthday(month, day)) return "";
  return `${MONTHS[(month as number) - 1]} ${day}`;
}

/**
 * The next time this birthday comes round, as a UTC calendar day.
 *
 * Today counts as today rather than as a year away - the whole point of
 * knowing is to say something on the day. February 29 in a non-leap year
 * lands on March 1: better than skipping three years of somebody's birthday.
 */
export function nextBirthday(
  month: number,
  day: number,
  from: Date = new Date(),
): Date | null {
  if (!isValidBirthday(month, day)) return null;

  const todayUtc = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );

  const on = (year: number): Date => {
    const d = new Date(Date.UTC(year, month - 1, day));
    // Date.UTC rolls Feb 29 into March 1 on a non-leap year, which is the
    // behaviour we want and worth saying out loud rather than relying on.
    return d;
  };

  const thisYear = on(todayUtc.getUTCFullYear());
  return thisYear >= todayUtc ? thisYear : on(todayUtc.getUTCFullYear() + 1);
}

/** Whole days until the next one. 0 means today. */
export function daysUntilBirthday(
  month: number | null | undefined,
  day: number | null | undefined,
  from: Date = new Date(),
): number | null {
  if (!isValidBirthday(month, day)) return null;
  const next = nextBirthday(month as number, day as number, from);
  if (!next) return null;
  const todayUtc = Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
  );
  return Math.round((next.getTime() - todayUtc) / 86_400_000);
}

/** "Today", "Tomorrow", "in 5 days", "March 14" — for a line in a card. */
export function birthdayLabel(
  month: number | null | undefined,
  day: number | null | undefined,
  from: Date = new Date(),
): string {
  const on = formatBirthday(month, day);
  if (on === "") return "";
  const away = daysUntilBirthday(month, day, from);
  if (away === 0) return `${on} — today`;
  if (away === 1) return `${on} — tomorrow`;
  if (away !== null && away <= 14) return `${on} — in ${away} days`;
  return on;
}

// -------------------------------------------------------------- time zones

/**
 * Does the platform know this zone?
 *
 * Intl throws on an unknown zone, and it throws from whatever formats a date
 * later rather than from where the bad value was saved. Checking on the way
 * in turns a 500 on somebody else's page into a message on the field that
 * caused it.
 */
export function isValidTimeZone(zone: string | null | undefined): boolean {
  const value = (zone ?? "").trim();
  if (value === "") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

/**
 * Every zone this platform knows, for the dropdown.
 *
 * `supportedValuesOf` is Node 18+ and every current browser; the fallback is
 * the handful a US consultancy with UK and Indian contacts actually needs,
 * so an old runtime gets a short list rather than an empty one.
 */
export function timeZoneOptions(): string[] {
  const supported = (
    Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
  ).supportedValuesOf;

  if (typeof supported === "function") {
    try {
      return supported.call(Intl, "timeZone");
    } catch {
      // fall through
    }
  }

  return [
    "America/Los_Angeles",
    "America/Denver",
    "America/Chicago",
    "America/New_York",
    "Europe/London",
    "Europe/Dublin",
    "Asia/Kolkata",
    "UTC",
  ];
}

/** "America/Los_Angeles" → "Los Angeles (America)". Sorted lists stay readable. */
export function timeZoneLabel(zone: string): string {
  const [area, ...rest] = zone.split("/");
  if (rest.length === 0) return zone;
  return `${rest.join("/").replace(/_/g, " ")} (${area})`;
}

/** The current clock time in somebody's zone, e.g. "4:12 PM". */
export function clockIn(zone: string, at: Date = new Date()): string | null {
  if (!isValidTimeZone(zone)) return null;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "numeric",
    minute: "2-digit",
  }).format(at);
}

/** Minutes past midnight in a zone, for comparing against working hours. */
export function minutesIn(zone: string, at: Date = new Date()): number | null {
  if (!isValidTimeZone(zone)) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? NaN);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? NaN);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  // Some ICU builds render midnight as 24 in hour12: false.
  return (hour % 24) * 60 + minute;
}

/** The day of the week in a zone, 0 for Sunday. */
export function weekdayIn(zone: string, at: Date = new Date()): number | null {
  if (!isValidTimeZone(zone)) return null;
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "short",
  }).format(at);
  const index = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
  return index === -1 ? null : index;
}

export interface WorkingHours {
  timeZone: string | null;
  workStartMinute: number | null;
  workEndMinute: number | null;
  workDays: number[];
}

/**
 * Is this person at work right now?
 *
 * `null` where we can't say — no zone, no hours, no days — which is not the
 * same as "no". Somewhere between a badge that says "away" about somebody at
 * their desk and no badge at all, the honest answer is no badge.
 */
export function workingNow(
  person: WorkingHours,
  at: Date = new Date(),
): boolean | null {
  const zone = person.timeZone;
  if (!zone || !isValidTimeZone(zone)) return null;
  if (person.workStartMinute === null || person.workEndMinute === null) return null;

  const days = cleanWorkDays(person.workDays);
  if (days.length === 0) return null;

  const day = weekdayIn(zone, at);
  const minutes = minutesIn(zone, at);
  if (day === null || minutes === null) return null;
  if (!days.includes(day)) return false;

  const { workStartMinute: start, workEndMinute: end } = person;
  // An end before the start is an overnight shift, not a typo to reject.
  return start <= end
    ? minutes >= start && minutes < end
    : minutes >= start || minutes < end;
}

// ------------------------------------------------------------------ links

/**
 * Whatever somebody pastes for LinkedIn, as a URL — or null.
 *
 * People paste "linkedin.com/in/x", "in/x", a full https URL with a tracking
 * query on the end, or the whole thing with a trailing slash. All of those
 * mean the same profile, and a stored value that only sometimes has a scheme
 * is a link that only sometimes works.
 */
export function normalizeLinkedIn(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (raw === "") return null;

  let value = raw.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  value = value.split(/[?#]/)[0].replace(/\/+$/, "");

  // A bare handle, or "in/handle" — the two things people type from memory.
  if (!value.includes("/") && !value.includes(".")) {
    return `https://www.linkedin.com/in/${value}`;
  }
  if (/^in\/[^/]+$/i.test(value)) {
    return `https://www.linkedin.com/in/${value.slice(3)}`;
  }

  if (!/(^|\.)linkedin\.com\//i.test(value)) return null;
  return `https://www.${value.replace(/^linkedin\.com/i, "linkedin.com")}`;
}

/** The handle out of a LinkedIn URL, for showing something shorter than the URL. */
export function linkedInHandle(url: string | null | undefined): string {
  const value = (url ?? "").trim();
  if (value === "") return "";
  const m = value.match(/linkedin\.com\/(?:in|company)\/([^/?#]+)/i);
  return m ? m[1] : value.replace(/^https?:\/\/(www\.)?/i, "");
}

/**
 * A phone number as typed, minus the characters that came along with it.
 *
 * Deliberately not reformatted. This team calls UK and Indian numbers, and
 * every library that "tidies" an international number eventually mangles one;
 * a number somebody typed and can read back is worth more than a consistent
 * one.
 */
export function cleanPhone(input: string | null | undefined): string | null {
  const value = (input ?? "").replace(/[^\d+()\-.\s x]/gi, "").trim();
  return value === "" ? null : value.replace(/\s{2,}/g, " ");
}

// ---------------------------------------------------------------- avatars

/**
 * Two initials from a name.
 *
 * The fallback when there's no photo, and it is on every page, so it handles
 * a single word, an empty string, and the person whose name is an email
 * address because that's what the import had.
 */
export function initialsOf(name: string | null | undefined): string {
  let raw = (name ?? "").trim();

  // The import fills a missing name with the email address, so "CO" for
  // christian@revoptics.co is a real thing that would otherwise appear on
  // three pages. Read the part before the @ as the name it stands in for.
  const at = raw.indexOf("@");
  if (at > 0) raw = raw.slice(0, at).replace(/[._-]+/g, " ");

  const words = raw
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** What the browser is allowed to send us, and what we are willing to serve. */
export const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

/**
 * The ceiling on a stored photo.
 *
 * The upload resizes to 512px in a canvas before it is sent, which lands
 * around 60–120KB; 600KB leaves room for a browser that encodes badly and
 * still refuses the 8MB straight off a phone.
 */
export const MAX_AVATAR_BYTES = 600 * 1024;

export function avatarProblem(type: string, bytes: number): string | null {
  if (!(AVATAR_TYPES as readonly string[]).includes(type)) {
    return "Photos need to be a PNG, JPEG or WebP.";
  }
  if (bytes <= 0) return "That file came through empty.";
  if (bytes > MAX_AVATAR_BYTES) {
    return `That photo is too big — keep it under ${Math.round(MAX_AVATAR_BYTES / 1024)}KB.`;
  }
  return null;
}
