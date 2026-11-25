/**
 * Turning a waiting action item into a project task - exactly once.
 *
 * Two "Add it" clicks arriving together (a double-click, two open tabs)
 * used to both see the item waiting and both create a task. Now the item is
 * claimed first, by moving it from waiting to added only if it is still
 * waiting, in the same transaction as the task. The database lets one
 * request through; the other waits, finds the item already added, and
 * creates nothing.
 *
 * Takes the Prisma client as an argument so the concurrency test can run it
 * against a test database.
 */
import type { PrismaClient } from "@prisma/client";

export interface NewTask {
  projectId: string;
  name: string;
  assigneeId: string;
  dueDate: Date | null;
  description: string;
}

/**
 * Create the task and mark the item (and any copies of it) as added.
 * Returns the new task's id, or null when another request got there first.
 */
export async function addTaskOnce(
  db: PrismaClient,
  primaryId: string,
  copyIds: string[],
  task: NewTask,
): Promise<string | null> {
  return db.$transaction(async (tx) => {
    const claim = await tx.commitment.updateMany({
      where: { id: primaryId, status: "PENDING" },
      data: { status: "ACCEPTED" },
    });
    if (claim.count === 0) return null;

    const created = await tx.task.create({ data: task });
    await tx.commitment.update({
      where: { id: primaryId },
      data: { taskId: created.id },
    });
    // The same undertaking said on another call is the same task.
    if (copyIds.length > 0) {
      await tx.commitment.updateMany({
        where: { id: { in: copyIds }, status: "PENDING" },
        data: { status: "ACCEPTED" },
      });
    }
    return created.id;
  });
}
