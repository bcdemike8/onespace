import { DAY_MS, addDays, dayStart } from "./dates";

/**
 * When someone said they'd do it.
 *
 * "I'll get that over to you by Friday" carries a date, and a task without
 * one never lands in a horizon - it sits in "no date" where nobody looks.
 * Roughly two thirds of spoken promises name a time, so reading it is the
 * difference between a day view that works and a list.
 *
 * Anchored to when it was said, not to now: a call from last Tuesday saying
 * "by Friday" means that Friday, and reading it today would move the
 * deadline forward every time the page is opened.
 *
 * Deliberately conservative, for the same reason the extractor is. A wrong
 * date is worse than no date: no date shows up as "when?" and gets a real
 * one; a wrong date quietly buries the task under Thursday.
 */

/** A day of the week, 0 = Sunday, matching getUTCDay(). */
const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

const MONTHS: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10, couple: 2, few: 3,
};

/** Saturday and Sunday are not delivery days for anyone here. */
function nextWorkday(date: Date): Date {
  const day = date.getUTCDay();
  if (day === 6) return addDays(date, 2);
  if (day === 0) return addDays(date, 1);
  return date;
}

/** Add working days, skipping the weekend rather than landing on it. */
export function addWorkdays(from: Date, n: number): Date {
  let d = dayStart(from);
  let left = n;
  while (left > 0) {
    d = addDays(d, 1);
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  return d;
}

/**
 * The next occurrence of a weekday, strictly after the anchor.
 *
 * "by Friday" said on a Friday means the following one - nobody promises
 * something for a day that is nearly over and calls it a deadline.
 */
function comingWeekday(anchor: Date, target: number): Date {
  const diff = (target - anchor.getUTCDay() + 7) % 7;
  return addDays(anchor, diff === 0 ? 7 : diff);
}

/** Friday of the anchor's week; Friday of the next if the week is spent. */
function endOfWeek(anchor: Date, next = false): Date {
  const friday = addDays(anchor, (5 - anchor.getUTCDay() + 7) % 7);
  return next ? addDays(friday, 7) : friday;
}

/**
 * Read a date out of what someone said, or return null.
 *
 * `anchor` is the day it was said - the meeting's day, or the day the recap
 * email went out.
 */
export function parseWhen(text: string, anchor: Date): Date | null {
  const s = text.toLowerCase().replace(/\s+/g, " ");
  const from = dayStart(anchor);

  // ------------------------------------------------------- explicit dates
  // "by the 15th", "on March 3rd", "3 March". Only when the month is named
  // or the ordinal is unambiguous; a bare "3" is a quantity far more often
  // than it is a date.

  const monthFirst = s.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/,
  );
  const dayFirst = s.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/,
  );
  const named = monthFirst
    ? { month: MONTHS[monthFirst[1]], day: Number(monthFirst[2]) }
    : dayFirst
      ? { month: MONTHS[dayFirst[2]], day: Number(dayFirst[1]) }
      : null;

  if (named && named.month !== undefined && named.day >= 1 && named.day <= 31) {
    let year = from.getUTCFullYear();
    let d = new Date(Date.UTC(year, named.month, named.day));
    // A month already gone means they meant next year. Six months of slack,
    // so "I'll have it by January" said in December doesn't jump backwards.
    if (d.getTime() < from.getTime() - 180 * DAY_MS) {
      year += 1;
      d = new Date(Date.UTC(year, named.month, named.day));
    }
    if (d.getUTCDate() === named.day) return d;
  }

  // "by the 15th" with no month - this month, or next if it's past.
  const ordinal = s.match(/\b(?:by|before|on|due)\s+the\s+(\d{1,2})(?:st|nd|rd|th)\b/);
  if (ordinal) {
    const dayNum = Number(ordinal[1]);
    if (dayNum >= 1 && dayNum <= 31) {
      let d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), dayNum));
      if (d.getUTCDate() !== dayNum) return null;
      if (d.getTime() <= from.getTime()) {
        d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, dayNum));
        if (d.getUTCDate() !== dayNum) return null;
      }
      return d;
    }
  }

  // ------------------------------------------------------------- relative

  if (/\b(right now|straight away|immediately|as soon as we hang up|after (?:this|the) call|today)\b/.test(s)) {
    return from;
  }
  if (/\btonight\b|\bthis evening\b|\bend of (?:the )?day\b|\bby eod\b|\beod\b/.test(s)) {
    return from;
  }
  if (/\btomorrow\b|\bfirst thing (?:in the )?(?:morning|tomorrow)\b/.test(s)) {
    return nextWorkday(addDays(from, 1));
  }
  if (/\bday after tomorrow\b/.test(s)) {
    return nextWorkday(addDays(from, 2));
  }

  // "in a couple of days", "within three days", "in 2 weeks".
  // Longer number words first: an alternation that offers "a" before
  // "couple" matches the "a" in "a couple of days" and then fails.
  const inN = s.match(
    /\b(?:in|within|over the next|give me)\s+(?:the\s+)?(?:next\s+)?(?:a\s+)?(couple|few|seven|three|eight|nine|four|five|two|six|ten|one|an|a|\d{1,2})\s*(?:of\s+)?(business days?|working days?|days?|weeks?)\b/,
  );
  if (inN) {
    const raw = inN[1];
    const n = /^\d+$/.test(raw) ? Number(raw) : NUMBER_WORDS[raw];
    if (n && n <= 60) {
      if (/week/.test(inN[2])) return nextWorkday(addDays(from, n * 7));
      if (/business|working/.test(inN[2])) return addWorkdays(from, n);
      return nextWorkday(addDays(from, n));
    }
  }

  // "end of the week", "by Friday" handled below; "end of next week".
  if (/\bend of (?:the )?next week\b|\bnext week at the latest\b/.test(s)) {
    return endOfWeek(from, true);
  }
  if (/\bend of (?:the )?week\b|\bby the end of the week\b|\bbefore the weekend\b/.test(s)) {
    return endOfWeek(from);
  }
  if (/\bnext week\b/.test(s)) {
    // Monday, not Friday: "next week" is when they start, and a task that
    // appears on the Monday can still slip to the Friday. The reverse can't.
    return addDays(endOfWeek(from), 3);
  }
  if (/\bend of (?:the )?month\b/.test(s)) {
    // The last weekday of the month - back to Friday rather than forward
    // into the next month, which would miss the deadline it names.
    const last = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0));
    const day = last.getUTCDay();
    return day === 6 ? addDays(last, -1) : day === 0 ? addDays(last, -2) : last;
  }
  if (/\bthis week\b/.test(s)) {
    return endOfWeek(from);
  }

  // ----------------------------------------------------------- a weekday
  // "by Friday", "on Monday", "Tuesday at the latest". Requires a
  // preposition: "we talked about it Monday" is the past, not a deadline.

  const weekday = s.match(
    /\b(?:by|on|before|come|next|this)\s+(sunday|sun|monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat)\b/,
  );
  if (weekday) {
    const target = WEEKDAYS[weekday[1]];
    const d = comingWeekday(from, target);
    // "next Friday" said on a Tuesday means the Friday of the following
    // week, not the one in three days.
    return /\bnext\s/.test(weekday[0]) && d.getTime() - from.getTime() < 7 * DAY_MS
      ? addDays(d, 7)
      : d;
  }

  return null;
}

/**
 * A due date for a promise, whether or not it named one.
 *
 * `stated` is what they actually said; when there is none, three working
 * days is the fallback - long enough not to be nagging, short enough that
 * the task surfaces while the call is still in living memory. Callers are
 * expected to show which of the two it was, so an invented date reads as an
 * invitation to correct it rather than as a commitment nobody made.
 */
export function dueFor(text: string, anchor: Date): { date: Date; stated: boolean } {
  const stated = parseWhen(text, anchor);
  return stated
    ? { date: stated, stated: true }
    : { date: addWorkdays(anchor, 3), stated: false };
}
