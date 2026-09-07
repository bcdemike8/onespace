"use client";

import { useMemo, useRef, useState } from "react";
import { setTimesheetCellAction } from "@/app/actions/time";
import { formatHours, parseDuration } from "@/lib/format";

export interface TimesheetRow {
  /** Stable per project+task pair; "" task means time logged to the project. */
  key: string;
  projectId: string;
  taskId: string | null;
  projectName: string;
  clientName: string | null;
  taskName: string;
  /** Minutes already logged, keyed by ISO date. */
  minutes: Record<string, number>;
}

export interface PickerProject {
  id: string;
  name: string;
  clientName: string | null;
  tasks: { id: string; name: string }[];
}

const cellValue = (minutes: number) => (minutes ? formatHours(minutes) : "");

/**
 * The week grid: one row per task, one column per day, type hours into a cell.
 *
 * Each cell is its own form posting to the server action on blur, so there's
 * no save button and nothing to lose. Totals are recomputed locally as you
 * type, then reconciled when the server revalidates.
 */
export function TimesheetGrid({
  rows,
  days,
  projects,
  readOnly = false,
}: {
  rows: TimesheetRow[];
  days: { iso: string; weekday: string; label: string; isToday: boolean }[];
  projects: PickerProject[];
  readOnly?: boolean;
}) {
  // Locally-added rows for tasks with no time logged yet.
  const [extraRows, setExtraRows] = useState<TimesheetRow[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [picking, setPicking] = useState(false);
  const [pickProject, setPickProject] = useState(projects[0]?.id ?? "");

  const allRows = useMemo(() => {
    const seen = new Set(rows.map((r) => r.key));
    return [...rows, ...extraRows.filter((r) => !seen.has(r.key))];
  }, [rows, extraRows]);

  const minutesFor = (row: TimesheetRow, iso: string) => {
    const key = `${row.key}|${iso}`;
    if (key in draft) return parseDuration(draft[key] || "0") ?? 0;
    return row.minutes[iso] ?? 0;
  };

  const dayTotals = days.map((d) =>
    allRows.reduce((sum, row) => sum + minutesFor(row, d.iso), 0),
  );
  const weekTotal = dayTotals.reduce((a, b) => a + b, 0);

  const pickerTasks = projects.find((p) => p.id === pickProject)?.tasks ?? [];

  function addRow(projectId: string, taskId: string) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const task = project.tasks.find((t) => t.id === taskId);

    setExtraRows((prev) => [
      ...prev,
      {
        key: `${projectId}|${taskId}`,
        projectId,
        taskId: taskId || null,
        projectName: project.name,
        clientName: project.clientName,
        taskName: task?.name ?? "General project time",
        minutes: {},
      },
    ]);
    setPicking(false);
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50">
              <th className="th sticky left-0 z-10 bg-ink-50 min-w-[16rem]">
                Task
              </th>
              {days.map((d) => (
                <th
                  key={d.iso}
                  className={`th w-20 text-center ${
                    d.isToday ? "text-brand-700" : ""
                  }`}
                >
                  <div>{d.weekday}</div>
                  <div className="font-normal normal-case tracking-normal text-ink-400">
                    {d.label}
                  </div>
                </th>
              ))}
              <th className="th w-20 text-right">Total</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-ink-100">
            {allRows.length === 0 ? (
              <tr>
                <td
                  colSpan={days.length + 2}
                  className="px-4 py-10 text-center text-sm text-ink-500"
                >
                  Nothing on this week&apos;s timesheet yet. Add a task row to
                  start filling it in.
                </td>
              </tr>
            ) : (
              allRows.map((row) => {
                const rowTotal = days.reduce(
                  (sum, d) => sum + minutesFor(row, d.iso),
                  0,
                );

                return (
                  <tr key={row.key} className="hover:bg-ink-50/60">
                    <td className="td sticky left-0 z-10 bg-white">
                      <div className="truncate font-medium text-ink-900">
                        {row.taskName}
                      </div>
                      <div className="truncate text-xs text-ink-500">
                        {row.clientName ? `${row.clientName} · ` : ""}
                        {row.projectName}
                      </div>
                    </td>

                    {days.map((d) => {
                      const key = `${row.key}|${d.iso}`;
                      const stored = row.minutes[d.iso] ?? 0;

                      return (
                        <td key={d.iso} className="p-1 text-center">
                          <form action={setTimesheetCellAction}>
                            <input type="hidden" name="projectId" value={row.projectId} />
                            <input type="hidden" name="taskId" value={row.taskId ?? ""} />
                            <input type="hidden" name="date" value={d.iso} />
                            <CellInput
                              name="duration"
                              defaultValue={cellValue(stored)}
                              disabled={readOnly}
                              highlight={d.isToday}
                              onDraft={(value) =>
                                setDraft((prev) => ({ ...prev, [key]: value }))
                              }
                            />
                          </form>
                        </td>
                      );
                    })}

                    <td className="td text-right font-medium tnum">
                      {rowTotal ? `${formatHours(rowTotal)}h` : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          <tfoot>
            <tr className="border-t-2 border-ink-200 bg-ink-50">
              <td className="td sticky left-0 z-10 bg-ink-50 font-semibold">
                Daily total
              </td>
              {dayTotals.map((minutes, i) => (
                <td
                  key={days[i].iso}
                  className="td text-center font-semibold tnum text-ink-900"
                >
                  {minutes ? formatHours(minutes) : "—"}
                </td>
              ))}
              <td className="td text-right font-semibold tnum text-ink-900">
                {weekTotal ? `${formatHours(weekTotal)}h` : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {!readOnly ? (
        <div className="border-t border-ink-200 bg-white p-3">
          {picking ? (
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[12rem] flex-1">
                <label className="label" htmlFor="ts-project">
                  Project
                </label>
                <select
                  id="ts-project"
                  className="input"
                  value={pickProject}
                  onChange={(e) => setPickProject(e.target.value)}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.clientName ? `${p.clientName} — ${p.name}` : p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[12rem] flex-1">
                <label className="label" htmlFor="ts-task">
                  Task
                </label>
                <select
                  id="ts-task"
                  className="input"
                  defaultValue=""
                  onChange={(e) => addRow(pickProject, e.target.value)}
                >
                  <option value="" disabled>
                    Choose a task…
                  </option>
                  <option value="">General project time</option>
                  {pickerTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setPicking(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setPicking(true)}
              disabled={projects.length === 0}
            >
              + Add a task row
            </button>
          )}
          <p className="mt-2 text-xs text-ink-500">
            Type hours as <code className="font-mono">1.5</code>,{" "}
            <code className="font-mono">1:30</code> or{" "}
            <code className="font-mono">90m</code>. Cells save when you tab away.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** A grid cell that saves on blur, and on Enter, but only if it changed. */
function CellInput({
  name,
  defaultValue,
  disabled,
  highlight,
  onDraft,
}: {
  name: string;
  defaultValue: string;
  disabled?: boolean;
  highlight?: boolean;
  onDraft: (value: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const committed = useRef(defaultValue);

  const commit = () => {
    const el = ref.current;
    if (!el || el.value === committed.current) return;

    if (el.value !== "" && parseDuration(el.value) === null) {
      el.value = committed.current; // unparseable — put it back
      onDraft(committed.current);
      return;
    }

    committed.current = el.value;
    el.form?.requestSubmit();
  };

  return (
    <input
      ref={ref}
      name={name}
      defaultValue={defaultValue}
      disabled={disabled}
      inputMode="decimal"
      autoComplete="off"
      aria-label="Hours"
      onChange={(e) => onDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          ref.current?.blur();
        }
        if (e.key === "Escape") {
          if (ref.current) ref.current.value = committed.current;
          onDraft(committed.current);
          ref.current?.blur();
        }
      }}
      className={`w-16 rounded-md border px-1.5 py-1.5 text-center text-sm tnum outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-ink-50 ${
        highlight ? "border-brand-200 bg-brand-50/40" : "border-ink-200 bg-white"
      }`}
    />
  );
}
