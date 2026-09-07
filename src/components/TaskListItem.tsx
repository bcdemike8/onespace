import Link from "next/link";
import type { TaskStatus } from "@prisma/client";
import { startTimerAction } from "@/app/actions/time";
import { toggleTaskDoneAction } from "@/app/actions/tasks";
import { formatHours } from "@/lib/format";
import { relativeDueLabel, today } from "@/lib/dates";
import { TaskStatusChip } from "@/components/ui";

export interface TaskListItemData {
  id: string;
  name: string;
  status: TaskStatus;
  dueDate: Date | null;
  estimatedHours: number | null;
  loggedMinutes: number;
  projectId: string;
  projectName: string;
  clientName: string | null;
  assigneeName: string | null;
}

/**
 * One row in any task list. The checkbox, the timer button and the link to
 * the project are the three things people actually do from here.
 */
export function TaskListItem({
  task,
  showProject = true,
  showAssignee = false,
  timerRunning = false,
}: {
  task: TaskListItemData;
  showProject?: boolean;
  showAssignee?: boolean;
  timerRunning?: boolean;
}) {
  const done = task.status === "DONE";
  const overdue = !done && task.dueDate && task.dueDate < today();

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <form action={toggleTaskDoneAction} className="pt-0.5">
        <input type="hidden" name="id" value={task.id} />
        <button
          type="submit"
          aria-label={done ? `Reopen ${task.name}` : `Complete ${task.name}`}
          className={`flex h-4.5 w-4.5 items-center justify-center rounded border text-[11px] leading-none transition-colors ${
            done
              ? "border-good-500 bg-good-500 text-white"
              : "border-ink-300 bg-white text-transparent hover:border-good-500"
          }`}
          style={{ height: "1.125rem", width: "1.125rem" }}
        >
          ✓
        </button>
      </form>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-sm font-medium ${
              done ? "text-ink-400 line-through" : "text-ink-900"
            }`}
          >
            {task.name}
          </span>
          {task.status !== "TODO" && task.status !== "DONE" ? (
            <TaskStatusChip status={task.status} />
          ) : null}
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
          {showProject ? (
            <Link
              href={`/projects/${task.projectId}`}
              className="hover:text-brand-700"
            >
              {task.clientName ? `${task.clientName} · ` : ""}
              {task.projectName}
            </Link>
          ) : null}

          {showAssignee ? (
            <span>{task.assigneeName ?? "Unassigned"}</span>
          ) : null}

          {task.dueDate ? (
            <span className={overdue ? "font-medium text-bad-700" : undefined}>
              {relativeDueLabel(task.dueDate)}
            </span>
          ) : null}

          <span className="tnum">
            {formatHours(task.loggedMinutes)}h logged
            {task.estimatedHours ? ` of ${task.estimatedHours}h` : ""}
          </span>
        </div>
      </div>

      {!done ? (
        <form action={startTimerAction} className="shrink-0">
          <input type="hidden" name="taskId" value={task.id} />
          <button
            type="submit"
            className={timerRunning ? "btn-secondary btn-sm" : "btn-secondary btn-sm"}
            title={
              timerRunning
                ? "Banks the timer that's already running, then starts this one"
                : "Start a timer on this task"
            }
          >
            ▶ Start
          </button>
        </form>
      ) : null}
    </li>
  );
}
