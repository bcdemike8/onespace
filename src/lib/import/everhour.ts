import { type Sheet, cell, findHeader, parseCSV, parseSheet } from "@/lib/csv";
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
  /** Who the work came through — Everhour's "Client" column. */
  partnerName: string;
  /** Project lead, where the report names one. */
  leadName: string;
  rowNumber: number;
}

export interface EverhourPlan {
  columns: EverhourColumnMap;
  entries: PlannedEntry[];
  members: { name: string; email: string; minutes: number }[];
  projects: {
    name: string;
    clientName: string;
    partnerName: string;
    leadName: string;
    minutes: number;
  }[];
  partners: string[];
  /** True when the source was a month-grouped report, so dates are month-level. */
  monthly: boolean;
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
  // Everhour's "Historical Report" groups rows under month headings instead of
  // giving each row a date, so it needs its own reader.
  if (looksGrouped(text)) return parseGroupedEverhourCsv(text, opts);

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
    {
      name: string;
      clientName: string;
      partnerName: string;
      leadName: string;
      minutes: number;
    }
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
      partnerName: "",
      leadName: "",
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
      else
        projectMap.set(key, {
          name: projectName,
          clientName,
          partnerName: "",
          leadName: "",
          minutes,
        });
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
    partners: [],
    monthly: false,
    earliest,
    latest,
    totalMinutes,
    warnings,
    skippedRows,
  };
}

// ------------------------------------------------- month-grouped reports

const MONTH_ROW = /^(\d{4})-(\d{2})$/;
const ROLLUP = /^\d+\s+(members|items|types|projects)$/i;

/**
 * Everhour's saved "Historical Report" is a different animal from a detailed
 * export: a title and period preamble, then a header, then blocks of rows
 * under a bare `YYYY-MM` line, with Subtotal and Total rows mixed in.
 */
function looksGrouped(text: string): boolean {
  const rows = parseCSV(text).slice(0, 40);
  const hasMonthRow = rows.some((r) => r.length === 3 && MONTH_ROW.test(r[0].trim()));
  const hasSplitTimeCols = rows.some((r) =>
    r.some((c) => /non-?billable time/i.test(c)),
  );
  return hasMonthRow && hasSplitTimeCols;
}

function parseGroupedEverhourCsv(
  text: string,
  opts: { from?: Date | null; to?: Date | null } = {},
): EverhourPlan {
  const rows = parseCSV(text);
  const warnings: string[] = [];

  // Locate the header so columns can still be found by name.
  const headerIndex = rows.findIndex(
    (r) => r.length >= 8 && r.some((c) => /^client$/i.test(c.trim())),
  );
  const headers = headerIndex >= 0 ? rows[headerIndex].map((h) => h.trim()) : [];

  const col = {
    client: headers.findIndex((h) => /^client$/i.test(h)),
    project: headers.findIndex((h) => /^project$/i.test(h)),
    task: headers.findIndex((h) => /^task$/i.test(h)),
    member: headers.findIndex((h) => /^member$/i.test(h)),
    billable: headers.findIndex((h) => /^billable time$/i.test(h)),
    nonbillable: headers.findIndex((h) => /^non-?billable time$/i.test(h)),
    billingType: headers.findIndex((h) => /^billing type$/i.test(h)),
    leads: headers.findIndex((h) => /^leads?$/i.test(h)),
  };

  const entries: PlannedEntry[] = [];
  const memberMap = new Map<string, { name: string; email: string; minutes: number }>();
  const projectMap = new Map<
    string,
    { name: string; clientName: string; partnerName: string; leadName: string; minutes: number }
  >();
  const partnerSet = new Set<string>();

  let month: Date | null = null;
  let lastPartner = "";
  let earliest: Date | null = null;
  let latest: Date | null = null;
  let totalMinutes = 0;
  let skippedRows = 0;
  let outOfRange = 0;
  let rollupRows = 0;

  rows.forEach((row, index) => {
    // A bare `YYYY-MM` line opens a new block; everything after it is that month.
    if (row.length <= 3 && MONTH_ROW.test((row[0] ?? "").trim())) {
      const m = (row[0] ?? "").trim().match(MONTH_ROW)!;
      month = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
      return;
    }
    if (index <= headerIndex || row.length < 8) return;

    const first = (row[col.client] ?? "").trim();
    // Subtotal and Total lines repeat the numbers above them.
    if (/^(subtotal|total)$/i.test(first)) {
      rollupRows += 1;
      return;
    }

    const projectName = (row[col.project] ?? "").trim();
    // The Client column is only printed on the first row of each group.
    if (first) lastPartner = first;

    const rawMember = (row[col.member] ?? "").trim();
    if (ROLLUP.test(rawMember.split("\n")[0].trim())) {
      rollupRows += 1;
      return;
    }
    // Member and Task both carry a second line — a job title, and the task's
    // open/completed state — which is noise for the import.
    const memberName = rawMember.split("\n")[0].trim();

    const rawTask = (row[col.task] ?? "").trim();
    const taskLine = rawTask.split("\n")[0].trim();
    // "Weekly sync < Ongoing (Monthly Retainer)" — the part after "<" is the
    // parent, which OneSpace models as a section rather than a task.
    const taskName = taskLine.includes(" < ")
      ? taskLine.split(" < ")[0].trim()
      : taskLine;

    const billableHours = Number((row[col.billable] ?? "0").trim() || 0);
    const nonBillableHours = Number((row[col.nonbillable] ?? "0").trim() || 0);
    const leadRaw = col.leads >= 0 ? (row[col.leads] ?? "").trim() : "";
    const leadName = ROLLUP.test(leadRaw) ? "" : leadRaw.split(",")[0].trim();

    if (!month || (!billableHours && !nonBillableHours)) {
      skippedRows += 1;
      return;
    }
    if ((opts.from && month < opts.from) || (opts.to && month > opts.to)) {
      outOfRange += 1;
      return;
    }

    if (lastPartner) partnerSet.add(lastPartner);

    // Billable and non-billable are separate columns, so a row carrying both
    // becomes two entries rather than losing one of them.
    for (const [hours, billable] of [
      [billableHours, true],
      [nonBillableHours, false],
    ] as [number, boolean][]) {
      if (!hours) continue;
      const minutes = Math.round(hours * 60);

      entries.push({
        date: month,
        memberName,
        memberEmail: "",
        clientName: "",
        projectName,
        taskName,
        minutes,
        billable,
        notes: null,
        billRateCents: null,
        costRateCents: null,
        partnerName: lastPartner,
        leadName,
        rowNumber: index + 1,
      });

      totalMinutes += minutes;
      if (!earliest || month < earliest) earliest = month;
      if (!latest || month > latest) latest = month;

      if (memberName) {
        const k = memberName.toLowerCase();
        const e = memberMap.get(k) ?? { name: memberName, email: "", minutes: 0 };
        e.minutes += minutes;
        memberMap.set(k, e);
      }
      if (projectName) {
        const k = matchKey(projectName);
        const e = projectMap.get(k);
        if (e) {
          e.minutes += minutes;
          if (!e.leadName && leadName) e.leadName = leadName;
        } else {
          projectMap.set(k, {
            name: projectName,
            clientName: "",
            partnerName: lastPartner,
            leadName,
            minutes,
          });
        }
      }
    }
  });

  warnings.push(
    "This is a month-grouped report, so it carries no day-level dates. Every " +
      "entry is filed on the first of its month — month, quarter and year " +
      "reports will be exact, weekly ones won't be meaningful.",
  );
  warnings.push(
    "It has no rate columns either, so each person's current cost and bill " +
      "rates are applied. Set those under People before importing.",
  );
  if (rollupRows > 0) {
    warnings.push(`${rollupRows} subtotal rows were skipped, as they repeat other rows.`);
  }
  if (skippedRows > 0) {
    warnings.push(`${skippedRows} rows had no hours on them and were ignored.`);
  }
  if (outOfRange > 0) {
    warnings.push(
      `${outOfRange} ${outOfRange === 1 ? "row falls" : "rows fall"} outside the ` +
        "date range you set.",
    );
  }

  return {
    columns: {
      date: "month blocks",
      member: headers[col.member] ?? null,
      memberEmail: null,
      client: null,
      project: headers[col.project] ?? null,
      task: headers[col.task] ?? null,
      time: headers[col.billable] ?? null,
      billable: headers[col.billingType] ?? null,
      notes: null,
      billableAmount: null,
      cost: null,
    },
    entries,
    members: [...memberMap.values()].sort((a, b) => b.minutes - a.minutes),
    projects: [...projectMap.values()].sort((a, b) => b.minutes - a.minutes),
    partners: [...partnerSet].sort(),
    monthly: true,
    earliest,
    latest,
    totalMinutes,
    warnings,
    skippedRows,
  };
}
