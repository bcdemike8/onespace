"use client";

import { useFormStatus } from "react-dom";
import { toggleTaskDoneAction } from "@/app/actions/tasks";

/**
 * The "mark done" box on a task row. It ticks the moment it's clicked, not
 * when the server answers - on a list of open tasks a finished task simply
 * vanishes on the refresh, and without the tick in between it looked as if
 * the click did nothing.
 */
export function TaskDoneCheckbox({
  taskId,
  taskName,
  done,
}: {
  taskId: string;
  taskName: string;
  done: boolean;
}) {
  return (
    <form action={toggleTaskDoneAction} className="pt-0.5">
      <input type="hidden" name="id" value={taskId} />
      <Box taskName={taskName} done={done} />
    </form>
  );
}

function Box({ taskName, done }: { taskName: string; done: boolean }) {
  const { pending } = useFormStatus();
  const ticked = pending ? !done : done;

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={done ? `Reopen ${taskName}` : `Mark ${taskName} done`}
      title={done ? "Reopen this task" : "Mark this task done"}
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
