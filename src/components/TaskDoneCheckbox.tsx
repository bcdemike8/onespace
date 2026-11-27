"use client";

import { useFormStatus } from "react-dom";
import { toggleTaskDoneAction } from "@/app/actions/tasks";

/**
 * Marking a task done, in one of two shapes.
 *
 * - "box": the small tick box on dense lists (a project's task list). It
 *   ticks the moment it's clicked, not when the server answers - on a list of
 *   open tasks a finished task simply vanishes on the refresh, and without the
 *   tick in between it looked as if the click did nothing.
 * - "button": a labelled "Mark done" button, for My Work. A bare box beside a
 *   task name read as "select this", not "finish this", and nobody could tell
 *   what ticking it would do.
 *
 * Finishing a task also finishes its open subtasks (see toggleTaskDoneAction),
 * so when there are any it says so and asks first, rather than quietly
 * closing work nobody looked at.
 */
export function TaskDoneCheckbox({
  taskId,
  taskName,
  done,
  openSubtasks = 0,
  variant = "box",
}: {
  taskId: string;
  taskName: string;
  done: boolean;
  /** Open subtasks under this task, which marking it done also closes. */
  openSubtasks?: number;
  variant?: "box" | "button";
}) {
  return (
    <form
      action={toggleTaskDoneAction}
      className={variant === "box" ? "shrink-0 pt-0.5" : "shrink-0"}
      onSubmit={(e) => {
        if (done || openSubtasks === 0) return;
        const n = openSubtasks;
        if (
          !window.confirm(
            `Mark "${taskName}" done?\n\nIts ${n} open subtask${n === 1 ? "" : "s"} will be marked done too.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={taskId} />
      {variant === "box" ? (
        <Box taskName={taskName} done={done} openSubtasks={openSubtasks} />
      ) : (
        <LabelledButton taskName={taskName} done={done} openSubtasks={openSubtasks} />
      )}
    </form>
  );
}

function tooltip(done: boolean, openSubtasks: number): string {
  if (done) return "Reopen this task";
  if (openSubtasks === 0) return "Mark this task done";
  return `Mark this task done. Its ${openSubtasks} open subtask${
    openSubtasks === 1 ? "" : "s"
  } will be marked done too.`;
}

function Box({
  taskName,
  done,
  openSubtasks,
}: {
  taskName: string;
  done: boolean;
  openSubtasks: number;
}) {
  const { pending } = useFormStatus();
  const ticked = pending ? !done : done;

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={done ? `Reopen ${taskName}` : `Mark ${taskName} done`}
      title={tooltip(done, openSubtasks)}
      className={`flex items-center justify-center rounded border text-[11px] leading-none transition-colors ${
        ticked
          ? "border-good-500 bg-good-500 text-white"
          : "border-ink-300 bg-white text-transparent hover:border-good-500 hover:text-good-500"
      }`}
      style={{ height: "1.125rem", width: "1.125rem" }}
    >
      ✓
    </button>
  );
}

function LabelledButton({
  taskName,
  done,
  openSubtasks,
}: {
  taskName: string;
  done: boolean;
  openSubtasks: number;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={done ? `Reopen ${taskName}` : `Mark ${taskName} done`}
      title={tooltip(done, openSubtasks)}
      className="btn-secondary btn-sm"
    >
      {pending ? (done ? "Reopening…" : "Marking done…") : done ? "Reopen" : "✓ Mark done"}
    </button>
  );
}
