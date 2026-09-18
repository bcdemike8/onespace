"use client";

import type { ProjectStatus } from "@prisma/client";
import { setProjectStatusAction } from "@/app/actions/projects";
import { SubmitButton } from "@/components/SubmitButton";

/**
 * Finish a project, put it away, or bring it back.
 *
 * In the header, next to the project's name, because it is the last thing
 * somebody does on a project and it was previously a dropdown inside an
 * admin-only settings dialog — which meant the person who actually finished
 * the work could not say so.
 *
 * Only the move that makes sense from here is offered. A list of four
 * statuses asks you to know the model; two buttons ask you what happened.
 */
export function ProjectLifecycle({
  projectId,
  status,
  openTasks,
}: {
  projectId: string;
  status: ProjectStatus;
  /** Shown in the confirmation, because finishing with work left is a choice. */
  openTasks: number;
}) {
  const done = status === "COMPLETED";
  const archived = status === "ARCHIVED";

  return (
    <>
      {!done && !archived ? (
        <form
          action={setProjectStatusAction}
          onSubmit={(e) => {
            if (openTasks === 0) return;
            const ok = confirm(
              `${openTasks} task${openTasks === 1 ? " is" : "s are"} still open. ` +
                "Mark this project complete anyway?",
            );
            if (!ok) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={projectId} />
          <input type="hidden" name="status" value="COMPLETED" />
          <SubmitButton pendingLabel="Completing…" className="btn-primary">
            Mark complete
          </SubmitButton>
        </form>
      ) : null}

      {done ? (
        <form action={setProjectStatusAction}>
          <input type="hidden" name="id" value={projectId} />
          <input type="hidden" name="status" value="ARCHIVED" />
          <SubmitButton pendingLabel="Archiving…" className="btn-secondary">
            Archive
          </SubmitButton>
        </form>
      ) : null}

      {done || archived ? (
        <form action={setProjectStatusAction}>
          <input type="hidden" name="id" value={projectId} />
          <input type="hidden" name="status" value="ACTIVE" />
          <SubmitButton pendingLabel="Reopening…" className="btn-secondary">
            Reopen
          </SubmitButton>
        </form>
      ) : null}
    </>
  );
}
