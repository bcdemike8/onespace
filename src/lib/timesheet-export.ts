/**
 * The timesheet as a document somebody files with a billing team.
 *
 * Grouping and totals only — the page draws it, the browser makes the PDF.
 * No PDF library and no headless browser on the Railway image: every browser
 * already prints to PDF, and a print stylesheet is both the smallest way to
 * get one and the only way that doesn't add a dependency to generate a page
 * the app can already render.
 *
 * Plain module, no database: the arithmetic is the part worth testing, and
 * tests can't import anything server-only.
 */

export interface ExportEntry {
  date: Date;
  projectName: string;
  clientName: string | null;
  taskName: string | null;
  notes: string | null;
  minutes: number;
  billable: boolean;
  billRateCents: number;
}

export interface ExportLine {
  dateISO: string;
  taskName: string;
  notes: string | null;
  minutes: number;
  billable: boolean;
}

export interface ExportGroup {
  projectName: string;
  clientName: string | null;
  lines: ExportLine[];
  minutes: number;
  billableMinutes: number;
  billableCents: number;
}

export interface TimesheetDocument {
  groups: ExportGroup[];
  minutes: number;
  billableMinutes: number;
  nonBillableMinutes: number;
  billableCents: number;
  /** Distinct days with any time on them — what "days worked" means here. */
  daysWorked: number;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * One row per entry, grouped by project.
 *
 * Entries are not merged, even when two land on the same task on the same
 * day. A billing team reconciling an invoice is matching individual pieces
 * of work; silently adding two 30-minute entries into one hour loses the
 * second note, which is the half that explains the hour.
 */
export function buildTimesheet(entries: ExportEntry[]): TimesheetDocument {
  const byProject = new Map<string, ExportGroup>();
  const days = new Set<string>();

  let minutes = 0;
  let billableMinutes = 0;
  let billableCents = 0;

  // Oldest first: a timesheet reads forwards, however the query returned it.
  const sorted = [...entries].sort(
    (a, b) =>
      a.projectName.localeCompare(b.projectName) ||
      a.date.getTime() - b.date.getTime() ||
      (a.taskName ?? "").localeCompare(b.taskName ?? ""),
  );

  for (const e of sorted) {
    const group = byProject.get(e.projectName) ?? {
      projectName: e.projectName,
      clientName: e.clientName,
      lines: [],
      minutes: 0,
      billableMinutes: 0,
      billableCents: 0,
    };

    group.lines.push({
      dateISO: iso(e.date),
      taskName: e.taskName ?? "General project time",
      notes: e.notes,
      minutes: e.minutes,
      billable: e.billable,
    });
    group.minutes += e.minutes;
    minutes += e.minutes;
    days.add(iso(e.date));

    if (e.billable) {
      group.billableMinutes += e.minutes;
      billableMinutes += e.minutes;
      // Rounded once per entry, at the entry's own stored rate — the same
      // order the reports round in, so the two always agree.
      const cents = Math.round((e.minutes * e.billRateCents) / 60);
      group.billableCents += cents;
      billableCents += cents;
    }

    byProject.set(e.projectName, group);
  }

  return {
    groups: [...byProject.values()],
    minutes,
    billableMinutes,
    nonBillableMinutes: minutes - billableMinutes,
    billableCents,
    daysWorked: days.size,
  };
}

/** "7.5", "0.25" — hours to a quarter, never "7.50". */
export function exportHours(minutes: number): string {
  return String(Math.round((minutes / 60) * 100) / 100);
}

/**
 * What the file is called when it lands in Downloads.
 *
 * Name, then period, because a billing inbox sorts by filename and the
 * person is what somebody is looking for. Anything that isn't a letter, a
 * digit or a dash becomes a dash: a filename is not the place to discover
 * that somebody's surname has a slash in it.
 */
export function exportFilename(
  personName: string,
  fromISO: string,
  toISO: string,
): string {
  const slug = personName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `timesheet-${slug || "onespace"}-${fromISO}-to-${toISO}`;
}
