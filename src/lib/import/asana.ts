import { type Sheet, cell, findHeader, parseSheet } from "@/lib/csv";
import { matchKey, parseImportDate, parseImportHours } from "./shared";

/**
 * Reader for Asana's per-project CSV export.
 *
 * Asana's column set has drifted over the years and varies with custom
 * fields, so every column is located by alias rather than by position, and
 * anything missing degrades to "not set" instead of failing the import.
 */

export interface AsanaColumnMap {
  name: string | null;
  section: string | null;
  assignee: string | null;
  assigneeEmail: string | null;
  dueDate: string | null;
  startDate: string | null;
  notes: string | null;
  completedAt: string | null;
  parentTask: string | null;
  projects: string | null;
  estimatedHours: string | null;
}

export interface PlannedTask {
  name: string;
  sectionName: string | null;
  assigneeName: string;
  assigneeEmail: string;
  dueDate: Date | null;
  notes: string | null;
  estimatedHours: number | null;
  completed: boolean;
  isSubtask: boolean;
  rowNumber: number;
}

export interface AsanaPlan {
  columns: AsanaColumnMap;
  /** Project name found in the file, if the export carried one. */
  detectedProjectName: string | null;
  sections: string[];
  tasks: PlannedTask[];
  /** Distinct assignees seen in the file. */
  assignees: { name: string; email: string; taskCount: number }[];
  startDate: Date | null;
  warnings: string[];
  skippedRows: number;
}

function detectColumns(headers: string[]): AsanaColumnMap {
  return {
    // "Task ID" must not win the "name" alias, so exact names come first.
    name: findHeader(headers, ["name", "task name", "title"]),
    section: findHeader(headers, [
      "section/column",
      "section",
      "column",
      "sectioncolumn",
    ]),
    assignee: findHeader(headers, ["assignee", "owner", "assigned to"]),
    assigneeEmail: findHeader(headers, ["assignee email", "owner email"]),
    dueDate: findHeader(headers, ["due date", "due on", "due"]),
    startDate: findHeader(headers, ["start date", "start on"]),
    notes: findHeader(headers, ["notes", "description"]),
    completedAt: findHeader(headers, ["completed at", "completed", "complete"]),
    parentTask: findHeader(headers, ["parent task", "parent"]),
    projects: findHeader(headers, ["projects", "project"]),
    estimatedHours: findHeader(headers, [
      "estimated hours",
      "estimate",
      "estimated time",
    ]),
  };
}

export function parseAsanaCsv(text: string): AsanaPlan {
  const sheet: Sheet = parseSheet(text);
  const columns = detectColumns(sheet.headers);
  const warnings: string[] = [];

  if (sheet.rows.length === 0) {
    warnings.push("That file has a header row but no tasks in it.");
  }
  if (!columns.name) {
    warnings.push(
      "Couldn't find a task-name column. Asana's export calls it “Name” — " +
        "check you exported the project as CSV rather than copying a view.",
    );
  }
  if (!columns.assignee && !columns.assigneeEmail) {
    warnings.push(
      "No assignee column, so every task will come in unassigned. You can " +
        "assign them in the project afterwards.",
    );
  }
  if (!columns.dueDate) {
    warnings.push("No due-date column, so tasks will arrive without deadlines.");
  }

  const sections: string[] = [];
  const tasks: PlannedTask[] = [];
  const assigneeMap = new Map<
    string,
    { name: string; email: string; taskCount: number }
  >();

  let detectedProjectName: string | null = null;
  let earliestStart: Date | null = null;
  let skippedRows = 0;

  sheet.rows.forEach((row, index) => {
    const name = cell(row, columns.name);
    if (!name) {
      skippedRows += 1;
      return;
    }

    const sectionName = cell(row, columns.section) || null;
    if (sectionName && !sections.includes(sectionName)) sections.push(sectionName);

    if (!detectedProjectName) {
      // The "Projects" column can hold several, comma separated. Take the first.
      const projects = cell(row, columns.projects);
      if (projects) detectedProjectName = projects.split(",")[0].trim() || null;
    }

    const assigneeName = cell(row, columns.assignee);
    const assigneeEmail = cell(row, columns.assigneeEmail).toLowerCase();

    if (assigneeName || assigneeEmail) {
      const key = assigneeEmail || matchKey(assigneeName);
      const existing = assigneeMap.get(key);
      if (existing) {
        existing.taskCount += 1;
        if (!existing.email && assigneeEmail) existing.email = assigneeEmail;
      } else {
        assigneeMap.set(key, {
          name: assigneeName || assigneeEmail,
          email: assigneeEmail,
          taskCount: 1,
        });
      }
    }

    const start = parseImportDate(cell(row, columns.startDate));
    if (start && (!earliestStart || start < earliestStart)) earliestStart = start;

    const estimatedRaw = cell(row, columns.estimatedHours);
    const estimatedMinutes = estimatedRaw ? parseImportHours(estimatedRaw) : null;

    tasks.push({
      name,
      sectionName,
      assigneeName,
      assigneeEmail,
      dueDate: parseImportDate(cell(row, columns.dueDate)),
      notes: cell(row, columns.notes) || null,
      estimatedHours:
        estimatedMinutes === null
          ? null
          : Math.round((estimatedMinutes / 60) * 100) / 100,
      // Asana writes a timestamp into "Completed At" for finished tasks and
      // leaves it blank otherwise.
      completed: Boolean(cell(row, columns.completedAt)),
      isSubtask: Boolean(cell(row, columns.parentTask)),
      rowNumber: index + 2, // +1 for the header, +1 for 1-based counting
    });
  });

  const subtaskCount = tasks.filter((t) => t.isSubtask).length;
  if (subtaskCount > 0) {
    warnings.push(
      `${subtaskCount} of these ${subtaskCount === 1 ? "is an" : "are"} Asana ` +
        `${subtaskCount === 1 ? "subtask" : "subtasks"}. OneSpace has no subtasks, ` +
        `so ${subtaskCount === 1 ? "it will" : "they'll"} come in as ordinary tasks ` +
        "in the same section — or you can leave them out below.",
    );
  }
  if (skippedRows > 0) {
    warnings.push(
      `${skippedRows} ${skippedRows === 1 ? "row has" : "rows have"} no task name ` +
        "and will be ignored.",
    );
  }

  return {
    columns,
    detectedProjectName,
    sections,
    tasks,
    assignees: [...assigneeMap.values()].sort((a, b) => b.taskCount - a.taskCount),
    startDate: earliestStart,
    warnings,
    skippedRows,
  };
}
