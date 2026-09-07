import type { TaskStatus } from "@prisma/client";
import { startTimerAction } from "@/app/actions/time";
import {
  deleteTaskAction,
  moveTaskAction,
  setTaskAssigneeAction,
  setTaskStatusAction,
  toggleTaskDoneAction,
} from "@/app/actions/tasks";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { formatHours } from "@/lib/format";
import { relativeDueLabel, today } from "@/lib/dates";

export interface ProjectTaskData {
  id: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  estimatedHours: number | null;
  assigneeId: string | null;
  loggedMinutes: number;
}

const STATUS_OPTIONS = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "DONE", label: "Done" },
];

/** One task inside a project, with everything editable in place. */
export function ProjectTaskRow({
  task,
  people,
  canDelete,
}: {
  task: ProjectTaskData;
  people: { id: string; name: string }[];
  canDelete: boolean;
}) {
  const done = task.status === "DONE";
  const overdue = !done && task.dueDate && task.dueDate < today();
  const over =
    task.estimatedHours != null &&
    task.estimatedHours > 0 &&
    task.loggedMinutes / 60 > task.estimatedHours;

  return (
    <li className="group flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 hover:bg-ink-50/60">
      <form action={toggleTaskDoneAction} className="shrink-0">
        <input type="hidden" name="id" value={task.id} />
        <button
          type="submit"
          aria-label={done ? `Reopen ${task.name}` : `Complete ${task.name}`}
          className={`flex items-center justify-center rounded border text-[11px] leading-none transition-colors ${
            done
              ? "border-good-500 bg-good-500 text-white"
              : "border-ink-300 bg-white text-transparent hover:border-good-500"
          }`}
          style={{ height: "1.125rem", width: "1.125rem" }}
        >
          ✓
        </button>
      </form>

      <div className="min-w-[12rem] flex-1">
        <div
          className={`text-sm font-medium ${
            done ? "text-ink-400 line-through" : "text-ink-900"
          }`}
        >
          {task.name}
        </div>
        {task.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">
            {task.description}
          </p>
        ) : null}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
          {task.dueDate ? (
            <span className={overdue ? "font-medium text-bad-700" : undefined}>
              {relativeDueLabel(task.dueDate)}
            </span>
          ) : null}
          <span className={`tnum ${over ? "font-medium text-warn-700" : ""}`}>
            {formatHours(task.loggedMinutes)}h
            {task.estimatedHours ? ` / ${task.estimatedHours}h` : " logged"}
          </span>
        </div>
      </div>

      <form action={setTaskAssigneeAction} className="shrink-0">
        <input type="hidden" name="id" value={task.id} />
        <AutoSubmitSelect
          name="assigneeId"
          ariaLabel={`Assignee for ${task.name}`}
          defaultValue={task.assigneeId ?? ""}
          className="input w-36 py-1 text-xs"
          options={[
            { value: "", label: "Unassigned" },
            ...people.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
      </form>

      <form action={setTaskStatusAction} className="shrink-0">
        <input type="hidden" name="id" value={task.id} />
        <AutoSubmitSelect
          name="status"
          ariaLabel={`Status for ${task.name}`}
          defaultValue={task.status}
          className="input w-32 py-1 text-xs"
          options={STATUS_OPTIONS}
        />
      </form>

      <div className="flex shrink-0 items-center gap-1">
        {!done ? (
          <form action={startTimerAction}>
            <input type="hidden" name="taskId" value={task.id} />
            <button type="submit" className="btn-secondary btn-sm" title="Start timer">
              ▶
            </button>
          </form>
        ) : null}

        <form action={moveTaskAction}>
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="direction" value="up" />
          <button
            type="submit"
            className="btn-ghost btn-sm opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Move up"
          >
            ↑
          </button>
        </form>
        <form action={moveTaskAction}>
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="direction" value="down" />
          <button
            type="submit"
            className="btn-ghost btn-sm opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Move down"
          >
            ↓
          </button>
        </form>

        {canDelete ? (
          <form action={deleteTaskAction}>
            <input type="hidden" name="id" value={task.id} />
            <button
              type="submit"
              className="btn-ghost btn-sm text-ink-400 opacity-0 transition-opacity hover:text-bad-700 group-hover:opacity-100"
              aria-label={`Delete ${task.name}`}
            >
              ×
            </button>
          </form>
        ) : null}
      </div>
    </li>
  );
}
