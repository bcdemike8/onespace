"use client";

import { useMemo, useRef, useState } from "react";
import { setTimesheetCellAction } from "@/app/actions/time";
import { formatHours, parseDuration } from "@/lib/format";

export interface TimesheetRow {
  /** Stable per project+task pair; "" task means time logged to the project. */
  key: string;
  taskId: string | null;
  taskName: string;
  /** Minutes this grid owns and may edit, keyed by ISO date. */
  minutes: Record<string, number>;
  /**
   * Minutes booked elsewhere — a project page, the stopwatch, an import.
   * Shown here so the week reads true, but not editable from the grid.
   */
  locked: Record<string, number>;
}

export interface TimesheetProject {
  id: string;
  name: string;
  clientName: string | null;
  /** Why this project is on your sheet — owner, assigned work, or logged time. */
  reason: string;
  /** Everything this person has ever logged here, not just this week. */
  toDateMinutes: number;
  /** Every task not yet finished, for the picker. */
  openTasks: { id: string; name: string }[];
  rows: TimesheetRow[];
}

export interface Day {
  iso: string;
  weekday: string;
  label: string;
  isToday: boolean;
}

const cellValue = (minutes: number) => (minutes ? formatHours(minutes) : "");

/**
 * The week grid, organised by project.
 *
 * Every project you're on gets a block, whether or not you've logged to it —
 * that's the prompt to fill it in. Inside a block you only see the tasks you
 * actually have time against, plus a picker holding every unfinished task on
 * that project, so the sheet stays short without hiding anything.
 */
export function TimesheetGrid({
  projects,
  days,
  readOnly = false,
}: {
  projects: TimesheetProject[];
  days: Day[];
  readOnly?: boolean;
}) {
  // Rows added from a picker this session, before anything is saved to them.
  const [extra, setExtra] = useState<Record<string, TimesheetRow[]>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});

  const rowsFor = (project: TimesheetProject) => {
    const seen = new Set(project.rows.map((r) => r.key));
    return [...project.rows, ...(extra[project.id] ?? []).filter((r) => !seen.has(r.key))];
  };

  /** What the grid owns — the editable part of a cell. */
  const sheetMinutes = (row: TimesheetRow, iso: string) => {
    const key = `${row.key}|${iso}`;
    if (key in draft) return parseDuration(draft[key] || "0") ?? 0;
    return row.minutes[iso] ?? 0;
  };

  /** Everything on that day, editable plus locked — what totals must use. */
  const minutesFor = (row: TimesheetRow, iso: string) =>
    sheetMinutes(row, iso) + (row.locked[iso] ?? 0);

  const dayTotals = useMemo(
    () =>
      days.map((d) =>
        projects.reduce(
          (sum, p) => sum + rowsFor(p).reduce((s, r) => s + minutesFor(r, d.iso), 0),
          0,
        ),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects, days, extra, draft],
  );
  const weekTotal = dayTotals.reduce((a, b) => a + b, 0);

  function addRow(project: TimesheetProject, taskId: string) {
    const task = project.openTasks.find((t) => t.id === taskId);
    const key = `${project.id}|${taskId}`;
    setExtra((prev) => {
      if ((prev[project.id] ?? []).some((r) => r.key === key)) return prev;
      return {
        ...prev,
        [project.id]: [
          ...(prev[project.id] ?? []),
          {
            key,
            taskId: taskId || null,
            taskName: task?.name ?? "General project time",
            minutes: {},
            locked: {},
          },
        ],
      };
    });
  }

  if (projects.length === 0) {
    return (
      <div className="card px-6 py-12 text-center">
        <p className="text-sm font-medium text-ink-700">
          You&apos;re not on any projects yet.
        </p>
        <p className="mt-1 text-sm text-ink-500">
          Projects appear here once you own one or have a task on it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        const rows = rowsFor(project);
        const projectTotal = rows.reduce(
          (sum, r) => sum + days.reduce((s, d) => s + minutesFor(r, d.iso), 0),
          0,
        );
        const used = new Set(rows.map((r) => r.taskId ?? ""));
        const available = project.openTasks.filter((t) => !used.has(t.id));

        return (
          <section key={project.id} className="card overflow-hidden">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink-200 bg-ink-50 px-4 py-2.5">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-ink-900">
                  {project.name}
                </h3>
                <p className="truncate text-xs text-ink-500">
                  {project.clientName ?? "No client"} · {project.reason}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-medium tnum text-ink-900">
                  {projectTotal ? `${formatHours(projectTotal)}h` : "—"}
                  <span className="font-normal text-ink-500"> this week</span>
                </div>
                {project.toDateMinutes > 0 ? (
                  <div className="text-xs tnum text-ink-500">
                    {formatHours(project.toDateMinutes)}h logged all time
                  </div>
                ) : null}
              </div>
            </div>

            {/* A project with nothing logged shows just a picker — with a dozen
                projects on a sheet, repeating the day headers for each empty
                one buries the rows that matter. */}
            {rows.length === 0 ? (
              <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                {readOnly ? (
                  <p className="text-sm text-ink-500">Nothing logged this week.</p>
                ) : available.length > 0 ? (
                  <>
                    <select
                      aria-label={`Add a task from ${project.name}`}
                      className="input max-w-md py-1.5 text-sm"
                      value=""
                      onChange={(e) => {
                        if (e.target.value !== "") addRow(project, e.target.value);
                      }}
                    >
                      <option value="">+ Add a task to log against…</option>
                      {available.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-ink-500">
                      {available.length} unfinished{" "}
                      {available.length === 1 ? "task" : "tasks"}
                    </span>
                  </>
                ) : (
                  <p className="text-sm text-ink-500">
                    No unfinished tasks on this project.
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[46rem] border-collapse">
                  <thead>
                    <tr className="border-b border-ink-100">
                      <th className="th min-w-[15rem]">Task</th>
                      {days.map((d) => (
                        <th
                          key={d.iso}
                          className={`th w-20 text-center ${d.isToday ? "text-brand-800" : ""}`}
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
                    {rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={days.length + 2}
                          className="px-4 py-3 text-sm text-ink-500"
                        >
                          Nothing logged here this week — pick a task below to start.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => {
                        const rowTotal = days.reduce(
                          (sum, d) => sum + minutesFor(row, d.iso),
                          0,
                        );

                        return (
                          <tr key={row.key} className="hover:bg-ink-50/60">
                            <td className="td font-medium text-ink-900">
                              {row.taskName}
                            </td>

                            {days.map((d) => {
                              const key = `${row.key}|${d.iso}`;
                              const locked = row.locked[d.iso] ?? 0;

                              // Viewing someone else's week: a column of empty
                              // input boxes is just noise, so show figures.
                              if (readOnly) {
                                const total = locked + (row.minutes[d.iso] ?? 0);
                                return (
                                  <td
                                    key={d.iso}
                                    className="td text-center tnum text-ink-700"
                                  >
                                    {total ? formatHours(total) : "—"}
                                  </td>
                                );
                              }

                              return (
                                <td key={d.iso} className="p-1 text-center align-top">
                                  {locked > 0 ? (
                                    <div
                                      className="mb-0.5 text-xs tnum text-ink-400"
                                      title="Logged from the project page, a timer or an import — not editable here"
                                    >
                                      {formatHours(locked)} logged
                                    </div>
                                  ) : null}
                                  <form action={setTimesheetCellAction}>
                                    <input type="hidden" name="projectId" value={project.id} />
                                    <input type="hidden" name="taskId" value={row.taskId ?? ""} />
                                    <input type="hidden" name="date" value={d.iso} />
                                    <CellInput
                                      defaultValue={cellValue(row.minutes[d.iso] ?? 0)}
                                      disabled={readOnly}
                                      highlight={d.isToday}
                                      placeholder={locked > 0 ? "+" : undefined}
                                      onDraft={(v) =>
                                        setDraft((prev) => ({ ...prev, [key]: v }))
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
                </table>
              </div>

                {!readOnly ? (
                  <div className="border-t border-ink-100 bg-white px-4 py-2.5">
                    {available.length > 0 ? (
                      <select
                        aria-label={`Add a task from ${project.name}`}
                        className="input max-w-md py-1.5 text-sm"
                        value=""
                        onChange={(e) => {
                          if (e.target.value !== "") addRow(project, e.target.value);
                        }}
                      >
                        <option value="">+ Add another task…</option>
                        {available.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-ink-500">
                        Every unfinished task on this project is already here.
                      </p>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </section>
        );
      })}

      {/* Totals across everything, so the week can be checked at a glance. */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse">
            <tbody>
              <tr className="bg-ink-50">
                <td className="td min-w-[15rem] font-semibold">Week total</td>
                {dayTotals.map((minutes, i) => (
                  <td
                    key={days[i].iso}
                    className={`td w-20 text-center font-semibold tnum ${
                      days[i].isToday ? "text-brand-800" : "text-ink-900"
                    }`}
                  >
                    {minutes ? formatHours(minutes) : "—"}
                  </td>
                ))}
                <td className="td w-20 text-right font-semibold tnum text-ink-900">
                  {weekTotal ? `${formatHours(weekTotal)}h` : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {!readOnly ? (
        <p className="text-xs leading-relaxed text-ink-500">
          Type hours as <code className="font-mono">1.5</code>,{" "}
          <code className="font-mono">1:30</code> or{" "}
          <code className="font-mono">90m</code>. Cells save when you tab away.
          <br />
          Grey figures are time already booked from a project page, a stopwatch
          or an import — you can add to a day here, but this grid won&apos;t
          overwrite it.
        </p>
      ) : null}
    </div>
  );
}

/** A grid cell that saves on blur, and on Enter, but only if it changed. */
function CellInput({
  defaultValue,
  disabled,
  highlight,
  placeholder,
  onDraft,
}: {
  defaultValue: string;
  disabled?: boolean;
  highlight?: boolean;
  placeholder?: string;
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
      name="duration"
      defaultValue={defaultValue}
      disabled={disabled}
      placeholder={placeholder}
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
      className={`w-16 rounded-md border px-1.5 py-1.5 text-center text-sm tnum outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:bg-ink-50 ${
        highlight ? "border-brand-300 bg-brand-50" : "border-ink-200 bg-white"
      }`}
    />
  );
}
