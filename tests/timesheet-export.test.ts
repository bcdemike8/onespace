import test from "node:test";
import assert from "node:assert/strict";
import {
  type ExportEntry,
  buildTimesheet,
  exportFilename,
  exportHours,
} from "../src/lib/timesheet-export";

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const e = (over: Partial<ExportEntry> = {}): ExportEntry => ({
  date: d("2026-10-05"),
  projectName: "Honeycomb | Amplify Core",
  clientName: "Honeycomb",
  taskName: "Configuration",
  notes: null,
  minutes: 60,
  billable: true,
  billRateCents: 17_500,
  ...over,
});

test("an empty period is a document of zeroes, not a crash", () => {
  const doc = buildTimesheet([]);
  assert.deepEqual(doc.groups, []);
  assert.equal(doc.minutes, 0);
  assert.equal(doc.billableCents, 0);
  assert.equal(doc.daysWorked, 0);
});

test("entries group under their project and carry a subtotal", () => {
  const doc = buildTimesheet([
    e({ minutes: 90 }),
    e({ minutes: 30 }),
    e({ projectName: "Vertiv | Starter", clientName: "Vertiv", minutes: 60 }),
  ]);
  assert.equal(doc.groups.length, 2);
  const honeycomb = doc.groups.find((g) => g.projectName.startsWith("Honeycomb"))!;
  assert.equal(honeycomb.minutes, 120);
  assert.equal(honeycomb.lines.length, 2);
  assert.equal(doc.minutes, 180);
});

test("two entries on one task on one day stay two lines", () => {
  // Merging them would lose the second note, which is the half that explains
  // the hour to whoever is reconciling the invoice.
  const doc = buildTimesheet([
    e({ minutes: 30, notes: "Call with their admin" }),
    e({ minutes: 30, notes: "Field mapping fixes" }),
  ]);
  assert.equal(doc.groups[0].lines.length, 2);
  assert.deepEqual(
    doc.groups[0].lines.map((l) => l.notes),
    ["Call with their admin", "Field mapping fixes"],
  );
});

test("billable and non-billable are both counted, and only one is valued", () => {
  const doc = buildTimesheet([
    e({ minutes: 120, billable: true }),
    e({ minutes: 60, billable: false }),
  ]);
  assert.equal(doc.minutes, 180);
  assert.equal(doc.billableMinutes, 120);
  assert.equal(doc.nonBillableMinutes, 60);
  assert.equal(doc.billableCents, 35_000);
});

test("each entry is valued at its own stored rate", () => {
  const doc = buildTimesheet([
    e({ minutes: 60, billRateCents: 17_500 }),
    e({ minutes: 60, billRateCents: 22_500 }),
  ]);
  assert.equal(doc.billableCents, 40_000);
});

test("days worked counts distinct days, not entries", () => {
  const doc = buildTimesheet([
    e({ date: d("2026-10-05") }),
    e({ date: d("2026-10-05") }),
    e({ date: d("2026-10-07"), projectName: "Other" }),
  ]);
  assert.equal(doc.daysWorked, 2);
});

test("lines read forwards in time inside a project", () => {
  const doc = buildTimesheet([
    e({ date: d("2026-10-09") }),
    e({ date: d("2026-10-05") }),
    e({ date: d("2026-10-07") }),
  ]);
  assert.deepEqual(
    doc.groups[0].lines.map((l) => l.dateISO),
    ["2026-10-05", "2026-10-07", "2026-10-09"],
  );
});

test("a project entry with no task still says what it was", () => {
  const doc = buildTimesheet([e({ taskName: null })]);
  assert.equal(doc.groups[0].lines[0].taskName, "General project time");
});

test("hours print to the quarter, without trailing zeroes", () => {
  assert.equal(exportHours(450), "7.5");
  assert.equal(exportHours(15), "0.25");
  assert.equal(exportHours(60), "1");
  assert.equal(exportHours(0), "0");
});

test("the filename leads with the person and survives their punctuation", () => {
  assert.equal(
    exportFilename("Brianna Dunbar-DeMike", "2026-10-01", "2026-10-31"),
    "timesheet-brianna-dunbar-demike-2026-10-01-to-2026-10-31",
  );
  assert.equal(
    exportFilename("  ", "2026-10-01", "2026-10-31"),
    "timesheet-onespace-2026-10-01-to-2026-10-31",
  );
  assert.equal(
    exportFilename("Ana / Solovey", "2026-10-01", "2026-10-31"),
    "timesheet-ana-solovey-2026-10-01-to-2026-10-31",
  );
});
