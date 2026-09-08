import { type Sheet, cell, findHeader, parseSheet } from "@/lib/csv";
import {
  matchKey,
  parseImportDate,
  parseImportHours,
  parseImportMoneyCents,
  truthy,
} from "./shared";

/**
 * Reader for an Everhour time-report CSV export.
 *
 * Everhour lets you choose the columns in a report, so the shape varies a
 * lot between exports. Only date, person and time are genuinely required.
 */

export interface EverhourColumnMap {
  date: string | null;
  member: string | null;
  memberEmail: string | null;
  client: string | null;
  project: string | null;
  task: string | null;
  time: string | null;
  billable: string | null;
  notes: string | null;
  billableAmount: string | null;
  cost: string | null;
}

export interface PlannedEntry {
  date: Date;
  memberName: string;
  memberEmail: string;
  clientName: string;
  projectName: string;
  taskName: string;
  minutes: number;
  billable: boolean;
  notes: string | null;
  /** Derived from the exported amount when present, so historical rates survive. */
  billRateCents: number | null;
  costRateCents: number | null;
  rowNumber: number;
}

export interface EverhourPlan {
  columns: EverhourColumnMap;
  entries: PlannedEntry[];
  members: { name: string; email: string; minutes: number }[];
  projects: { name: string; clientName: string; minutes: number }[];
  earliest: Date | null;
  latest: Date | null;
  totalMinutes: number;
  warnings: string[];
  skippedRows: number;
}

function detectColumns(headers: string[]): EverhourColumnMap {
  return {
    date: findHeader(headers, ["date", "day"]),
    member: findHeader(headers, ["member", "user", "person", "name"]),
    memberEmail: findHeader(headers, ["member email", "user email", "email"]),
    client: findHeader(headers, ["client", "customer"]),
    project: findHeader(headers, ["project"]),
    task: findHeader(headers, ["task", "issue"]),
    time: findHeader(headers, ["time", "hours", "duration"]),
    billable: findHeader(headers, ["billable"]),
    notes: findHeader(headers, ["comment", "note", "description"]),
    billableAmount: findHeader(headers, [
      "billable amount",
      "revenue",
      "amount",
    ]),
    cost: findHeader(headers, ["cost", "expense"]),
  };
}

export function parseEverhourCsv(
  text: string,
  opts: { from?: Date | null; to?: Date | null } = {},
): EverhourPlan {
  const sheet: Sheet = parseSheet(text);
  const columns = detectColumns(sheet.headers);
  const warnings: string[] = [];

  if (!columns.date) warnings.push("No date column — this file can't be imported.");
  if (!columns.time) warnings.push("No time column — this file can't be imported.");
  if (!columns.member) {
    warnings.push(
      "No member column, so every entry would land on one person. Re-export " +
        "from Everhour with the Member column included.",
    );
  }

  const entries: PlannedEntry[] = [];
  const memberMap = new Map<string, { name: string; email: string; minutes: number }>();
  const projectMap = new Map<
    string,
    { name: string; clientName: string; minutes: number }
  >();

  let earliest: Date | null = null;
  let latest: Date | null = null;
  let totalMinutes = 0;
  let skippedRows = 0;
  let outOfRange = 0;

  sheet.rows.forEach((row, index) => {
    const date = parseImportDate(cell(row, columns.date));
    const minutes = parseImportHours(cell(row, columns.time));

    if (!date || !minutes || minutes <= 0) {
      skippedRows += 1;
      return;
    }
    if ((opts.from && date < opts.from) || (opts.to && date > opts.to)) {
      outOfRange += 1;
      return;
    }

    const memberName = cell(row, columns.member);
    const memberEmail = cell(row, columns.memberEmail).toLowerCase();
    const projectName = cell(row, columns.project);
    const clientName = cell(row, columns.client);
    const billable = columns.billable ? truthy(cell(row, columns.billable)) : true;

    // If the export carried money columns we can recover the rate that was
    // actually in force, which beats stamping today's rate onto old work.
    const amountCents = columns.billableAmount
      ? parseImportMoneyCents(cell(row, columns.billableAmount))
      : null;
    const costCents = columns.cost
      ? parseImportMoneyCents(cell(row, columns.cost))
      : null;

    const perHour = (total: number | null) =>
      total === null || total <= 0 ? null : Math.round((total / minutes) * 60);

    entries.push({
      date,
      memberName,
      memberEmail,
      clientName,
      projectName,
      taskName: cell(row, columns.task),
      minutes,
      billable,
      notes: cell(row, columns.notes) || null,
      billRateCents: perHour(amountCents),
      costRateCents: perHour(costCents),
      rowNumber: index + 2,
    });

    totalMinutes += minutes;
    if (!earliest || date < earliest) earliest = date;
    if (!latest || date > latest) latest = date;

    if (memberName || memberEmail) {
      const key = memberEmail || matchKey(memberName);
      const existing = memberMap.get(key);
      if (existing) {
        existing.minutes += minutes;
        if (!existing.email && memberEmail) existing.email = memberEmail;
      } else {
        memberMap.set(key, {
          name: memberName || memberEmail,
          email: memberEmail,
          minutes,
        });
      }
    }

    if (projectName) {
      const key = matchKey(projectName);
      const existing = projectMap.get(key);
      if (existing) existing.minutes += minutes;
      else projectMap.set(key, { name: projectName, clientName, minutes });
    }
  });

  if (skippedRows > 0) {
    warnings.push(
      `${skippedRows} ${skippedRows === 1 ? "row had" : "rows had"} no usable date ` +
        "or duration and will be ignored.",
    );
  }
  if (outOfRange > 0) {
    warnings.push(
      `${outOfRange} ${outOfRange === 1 ? "row falls" : "rows fall"} outside the ` +
        "date range you set.",
    );
  }

  return {
    columns,
    entries,
    members: [...memberMap.values()].sort((a, b) => b.minutes - a.minutes),
    projects: [...projectMap.values()].sort((a, b) => b.minutes - a.minutes),
    earliest,
    latest,
    totalMinutes,
    warnings,
    skippedRows,
  };
}
