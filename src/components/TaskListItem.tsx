import Link from "next/link";
import type { TaskStatus } from "@prisma/client";
import { startTimerAction, stopTimerAction } from "@/app/actions/time";
import { formatHours } from "@/lib/format";
import { relativeDueLabel, toISODate, today } from "@/lib/dates";
import { TaskStatusChip } from "@/components/ui";
import { TaskDueDateButton } from "@/components/TaskDueDateButton";
import { TaskDoneCheckbox } from "@/components/TaskDoneCheckbox";
import { SubmitButton } from "@/components/SubmitButton";

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
  /** Open subtasks, which marking this task done also closes. */
  openSubtasks?: number;
}

/**
 * One row in any task list. Mark done, the timer button and the link to the
 * project are the three things people actually do from here.
 */
export function TaskListItem({
  task,
  showProject = true,
  showAssignee = false,
  timerRunning = false,
  canReschedule = false,
  timing = false,
}: {
  task: TaskListItemData;
  showProject?: boolean;
  showAssignee?: boolean;
  timerRunning?: boolean;
  /** Show "Change due date" beside the timer button. */
  canReschedule?: boolean;
  /** The running timer is on this task: offer Stop instead of Start. */
  timing?: boolean;
}) {
  const done = task.status === "DONE";
  const overdue = !done && task.dueDate && task.dueDate < today();

  return (
    <li className="flex flex-wrap items-start gap-3 px-4 py-3 sm:flex-nowrap">
      {/* A finished task keeps the tick box, to reopen it. An open one is
          finished with the labelled button on the right instead: a bare box
          read as "select", and nobody could tell what ticking it did. */}
      {done ? <TaskDoneCheckbox taskId={task.id} taskName={task.name} done /> : null}

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
          {timing ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-700" />
              Timer running
            </span>
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

      {!done && canReschedule ? (
        <div className="shrink-0">
          <TaskDueDateButton
            taskId={task.id}
            taskName={task.name}
            dueDate={task.dueDate ? toISODate(task.dueDate) : null}
          />
        </div>
      ) : null}

      {!done && timing ? (
        <form action={stopTimerAction} className="shrink-0">
          <SubmitButton
            className="btn-primary btn-sm"
            pendingLabel="Logging…"
            title="Stop the timer and log the time to your timesheet"
          >
            ■ Stop &amp; log
          </SubmitButton>
        </form>
      ) : !done ? (
        <form action={startTimerAction} className="shrink-0">
          <input type="hidden" name="taskId" value={task.id} />
          <SubmitButton
            className="btn-secondary btn-sm"
            pendingLabel="Starting…"
            title={
              timerRunning
                ? "Logs the timer that's already running, then starts one on this task"
                : "Start a timer on this task. Stop it to log the time to your timesheet."
            }
          >
            ▶ Start timer
          </SubmitButton>
        </form>
      ) : null}

      {!done ? (
        <TaskDoneCheckbox
          taskId={task.id}
          taskName={task.name}
          done={false}
          openSubtasks={task.openSubtasks ?? 0}
          variant="button"
        />
      ) : null}
    </li>
  );
}
