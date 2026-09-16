import { test } from "node:test";
import assert from "node:assert/strict";
import {
  WORK_DAYS,
  avatarProblem,
  cleanPhone,
  cleanWorkDays,
  clockIn,
  formatClock,
  formatClockLabel,
  initialsOf,
  isValidTimeZone,
  linkedInHandle,
  minutesIn,
  normalizeLinkedIn,
  parseClock,
  timeZoneLabel,
  timeZoneOptions,
  weekdayIn,
  workDaysLabel,
  workHoursLabel,
  workingNow,
} from "@/lib/profile";

// ------------------------------------------------------------------ hours

test("a typed time becomes minutes from midnight", () => {
  assert.equal(parseClock("09:00"), 540);
  assert.equal(parseClock("9:00"), 540);
  assert.equal(parseClock("9"), 540);
  assert.equal(parseClock("9am"), 540);
  assert.equal(parseClock("9 AM"), 540);
  assert.equal(parseClock("12am"), 0);
  assert.equal(parseClock("12pm"), 720);
  assert.equal(parseClock("5:30pm"), 17 * 60 + 30);
  assert.equal(parseClock("17:30"), 17 * 60 + 30);
  assert.equal(parseClock("00:00"), 0);
  assert.equal(parseClock("24:00"), 1440);
});

test("something that isn't a time is left alone rather than guessed at", () => {
  for (const bad of ["", "   ", "lunchtime", "9:75", "25:00", "24:30", "13pm", "0pm", "9:5"]) {
    assert.equal(parseClock(bad), null, `expected ${JSON.stringify(bad)} to be rejected`);
  }
  assert.equal(parseClock(null), null);
  assert.equal(parseClock(undefined), null);
});

test("minutes come back as the value a time input wants, and as something readable", () => {
  assert.equal(formatClock(540), "09:00");
  assert.equal(formatClock(0), "00:00");
  assert.equal(formatClock(1050), "17:30");
  assert.equal(formatClock(null), "");

  assert.equal(formatClockLabel(540), "9:00 AM");
  assert.equal(formatClockLabel(0), "12:00 AM");
  assert.equal(formatClockLabel(720), "12:00 PM");
  assert.equal(formatClockLabel(1050), "5:30 PM");
  assert.equal(formatClockLabel(null), "");
});

test("a round trip through the form doesn't move anybody's hours", () => {
  for (let m = 0; m < 1440; m += 5) {
    assert.equal(parseClock(formatClock(m)), m);
  }
});

test("working hours read as a range, and say nothing when half of it is missing", () => {
  assert.equal(workHoursLabel(540, 1050), "9:00 AM – 5:30 PM");
  assert.equal(workHoursLabel(540, null), "");
  assert.equal(workHoursLabel(null, 1050), "");
});

// ------------------------------------------------------------------- days

test("days are sorted, de-duplicated, and free of things that aren't days", () => {
  assert.deepEqual(cleanWorkDays([5, 1, 1, 3]), [1, 3, 5]);
  assert.deepEqual(cleanWorkDays([-1, 7, 2.5, 4]), [4]);
  assert.deepEqual(cleanWorkDays([]), []);
});

test("consecutive days collapse into a range, starting the week on Monday", () => {
  assert.equal(workDaysLabel([1, 2, 3, 4, 5]), "Mon–Fri");
  assert.equal(workDaysLabel([1, 2, 3, 5]), "Mon–Wed, Fri");
  assert.equal(workDaysLabel([2, 4]), "Tue, Thu");
  assert.equal(workDaysLabel([1]), "Mon");
  assert.equal(workDaysLabel([1, 2]), "Mon, Tue");
  assert.equal(workDaysLabel([0, 1, 2, 3, 4, 5, 6]), "Every day");
  assert.equal(workDaysLabel([]), "");
  // Sunday sorts last, so a Sunday-to-Thursday week doesn't appear to wrap.
  assert.equal(workDaysLabel([0, 1, 2, 3, 4]), "Mon–Thu, Sun");
});

test("the seven days are in Date#getDay order", () => {
  assert.equal(WORK_DAYS.length, 7);
  assert.deepEqual(
    WORK_DAYS.map((d) => d.value),
    [0, 1, 2, 3, 4, 5, 6],
  );
  assert.equal(WORK_DAYS[0].label, "Sunday");
});

// -------------------------------------------------------------- time zones

test("a real zone passes and a typo doesn't", () => {
  assert.equal(isValidTimeZone("America/Chicago"), true);
  assert.equal(isValidTimeZone("UTC"), true);
  assert.equal(isValidTimeZone("America/Chigago"), false);
  assert.equal(isValidTimeZone(""), false);
  assert.equal(isValidTimeZone(null), false);
});

test("every zone offered in the dropdown is one the platform accepts", () => {
  const zones = timeZoneOptions();
  assert.ok(zones.length >= 8);
  assert.ok(zones.includes("America/Chicago"));
  for (const zone of zones.slice(0, 50)) assert.equal(isValidTimeZone(zone), true);
});

test("a zone reads as a place rather than a path", () => {
  assert.equal(timeZoneLabel("America/Los_Angeles"), "Los Angeles (America)");
  assert.equal(timeZoneLabel("Europe/London"), "London (Europe)");
  assert.equal(timeZoneLabel("UTC"), "UTC");
});

test("the clock in a zone is that zone's clock", () => {
  // 2026-09-16T17:00:00Z is 12:00 in Chicago (CDT) and 10:00 in Los Angeles.
  const at = new Date("2026-09-16T17:00:00Z");
  assert.equal(clockIn("America/Chicago", at), "12:00 PM");
  assert.equal(clockIn("America/Los_Angeles", at), "10:00 AM");
  assert.equal(minutesIn("America/Chicago", at), 12 * 60);
  assert.equal(minutesIn("America/Los_Angeles", at), 10 * 60);
  assert.equal(clockIn("Nowhere/Real", at), null);
});

test("midnight in a zone is minute zero, not minute 1440", () => {
  // The hour12:false trap: some builds render midnight as "24".
  const at = new Date("2026-09-16T05:00:00Z"); // midnight in Chicago
  assert.equal(minutesIn("America/Chicago", at), 0);
});

test("the weekday in a zone is the weekday there", () => {
  // 03:00Z on a Thursday is still Wednesday evening in Los Angeles.
  const at = new Date("2026-09-17T03:00:00Z");
  assert.equal(weekdayIn("UTC", at), 4);
  assert.equal(weekdayIn("America/Los_Angeles", at), 3);
});

// ---------------------------------------------------------- working or not

const nineToFive = {
  timeZone: "America/Chicago",
  workStartMinute: 9 * 60,
  workEndMinute: 17 * 60,
  workDays: [1, 2, 3, 4, 5],
};

test("somebody is at work during their hours on their days", () => {
  // Wednesday 2026-09-16, 17:00Z = 12:00 in Chicago.
  assert.equal(workingNow(nineToFive, new Date("2026-09-16T17:00:00Z")), true);
  // 03:00Z = 22:00 the previous evening.
  assert.equal(workingNow(nineToFive, new Date("2026-09-16T03:00:00Z")), false);
  // Saturday.
  assert.equal(workingNow(nineToFive, new Date("2026-09-19T17:00:00Z")), false);
});

test("the end of the day is the end, not one more minute of it", () => {
  // 22:00Z = 17:00 in Chicago, which is when they stop.
  assert.equal(workingNow(nineToFive, new Date("2026-09-16T22:00:00Z")), false);
  assert.equal(workingNow(nineToFive, new Date("2026-09-16T21:59:00Z")), true);
});

test("an unfilled profile says nothing rather than saying away", () => {
  const at = new Date("2026-09-16T17:00:00Z");
  assert.equal(workingNow({ ...nineToFive, timeZone: null }, at), null);
  assert.equal(workingNow({ ...nineToFive, workStartMinute: null }, at), null);
  assert.equal(workingNow({ ...nineToFive, workEndMinute: null }, at), null);
  assert.equal(workingNow({ ...nineToFive, workDays: [] }, at), null);
});

test("a shift that runs past midnight is a shift, not a typo", () => {
  const nightShift = {
    timeZone: "America/Chicago",
    workStartMinute: 22 * 60,
    workEndMinute: 6 * 60,
    workDays: [1, 2, 3, 4, 5],
  };
  // Wednesday 23:00 Chicago = Thursday 04:00Z.
  assert.equal(workingNow(nightShift, new Date("2026-09-17T04:00:00Z")), true);
  // Wednesday 02:00 Chicago = Wednesday 07:00Z, still inside the night before.
  assert.equal(workingNow(nightShift, new Date("2026-09-16T07:00:00Z")), true);
  // Wednesday 12:00 Chicago.
  assert.equal(workingNow(nightShift, new Date("2026-09-16T17:00:00Z")), false);
});

// ------------------------------------------------------------------ links

test("every way somebody writes a LinkedIn profile becomes the same URL", () => {
  const expected = "https://www.linkedin.com/in/brianna-revoptics";
  for (const typed of [
    "https://www.linkedin.com/in/brianna-revoptics",
    "http://linkedin.com/in/brianna-revoptics",
    "www.linkedin.com/in/brianna-revoptics",
    "linkedin.com/in/brianna-revoptics/",
    "linkedin.com/in/brianna-revoptics?utm_source=share",
    "in/brianna-revoptics",
    "brianna-revoptics",
  ]) {
    assert.equal(normalizeLinkedIn(typed), expected, `from ${JSON.stringify(typed)}`);
  }
  assert.equal(normalizeLinkedIn(""), null);
  assert.equal(normalizeLinkedIn("   "), null);
  // Not LinkedIn at all — better to say so than to store a link that lies.
  assert.equal(normalizeLinkedIn("https://twitter.com/someone"), null);
});

test("a company page survives normalising", () => {
  assert.equal(
    normalizeLinkedIn("linkedin.com/company/revoptics"),
    "https://www.linkedin.com/company/revoptics",
  );
});

test("the handle is what gets shown, not the whole URL", () => {
  assert.equal(
    linkedInHandle("https://www.linkedin.com/in/brianna-revoptics"),
    "brianna-revoptics",
  );
  assert.equal(linkedInHandle("https://www.linkedin.com/company/revoptics"), "revoptics");
  assert.equal(linkedInHandle(""), "");
});

test("a phone number keeps the shape it was typed in", () => {
  assert.equal(cleanPhone("+44 20 7946 0958"), "+44 20 7946 0958");
  assert.equal(cleanPhone("(312) 555-0142 x204"), "(312) 555-0142 x204");
  assert.equal(cleanPhone("  "), null);
  assert.equal(cleanPhone(null), null);
  // Whatever came along with a paste from a signature block goes.
  assert.equal(cleanPhone("Tel: 312-555-0142"), "312-555-0142");
});

// ---------------------------------------------------------------- avatars

test("initials handle one name, two names, three, and none", () => {
  assert.equal(initialsOf("Brianna Callahan"), "BC");
  assert.equal(initialsOf("Ricky"), "RI");
  assert.equal(initialsOf("Mary-Jane van der Berg"), "MB");
  assert.equal(initialsOf("christian@revoptics.co"), "CH");
  assert.equal(initialsOf("brianna.callahan@revoptics.co"), "BC");
  assert.equal(initialsOf(""), "?");
  assert.equal(initialsOf(null), "?");
});

test("a photo has to be an image, non-empty, and small", () => {
  assert.equal(avatarProblem("image/png", 50_000), null);
  assert.equal(avatarProblem("image/jpeg", 50_000), null);
  assert.equal(avatarProblem("image/webp", 50_000), null);
  assert.match(avatarProblem("image/gif", 50_000) ?? "", /PNG, JPEG or WebP/);
  assert.match(avatarProblem("application/pdf", 50_000) ?? "", /PNG, JPEG or WebP/);
  assert.match(avatarProblem("image/png", 0) ?? "", /empty/);
  assert.match(avatarProblem("image/png", 5_000_000) ?? "", /too big/);
});
