import { test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { addTaskOnce } from "@/lib/commitments/accept";

/**
 * Two "Add it" requests for the same item at the same moment create one
 * task, not two.
 *
 * Needs a real Postgres, because the guarantee comes from the database. Runs
 * only when ONESPACE_TEST_DATABASE_URL points at a throwaway database with
 * the OneSpace schema - never against the live one by accident.
 */
const URL = process.env.ONESPACE_TEST_DATABASE_URL;

test("simultaneous Add it on one item creates exactly one task", { skip: !URL }, async () => {
  const a = new PrismaClient({ datasources: { db: { url: URL } } });
  const b = new PrismaClient({ datasources: { db: { url: URL } } });
  const tag = `race-${Date.now()}`;
  try {
    const user = await a.user.create({
      data: { email: `${tag}@example.com`, name: "Race Test", passwordHash: "x" },
    });
    const project = await a.project.create({ data: { name: tag } });
    const meeting = await a.meeting.create({
      data: {
        userId: user.id,
        title: tag,
        startsAt: new Date(),
        endsAt: new Date(),
        minutes: 30,
        attendees: [],
        externalDomains: [],
      },
    });
    const item = await a.commitment.create({
      data: { meetingId: meeting.id, text: "I'll send it", suggestedTask: tag, ownerId: user.id },
    });

    const task = { projectId: project.id, name: tag, assigneeId: user.id, dueDate: null, description: "" };
    // Two separate connections, both at once - as two browser tabs would.
    const results = await Promise.all([
      addTaskOnce(a, item.id, [], task),
      addTaskOnce(b, item.id, [], task),
    ]);

    assert.equal(results.filter(Boolean).length, 1, "one request wins, the other gets nothing");
    assert.equal(await a.task.count({ where: { projectId: project.id } }), 1);
    const after = await a.commitment.findUniqueOrThrow({ where: { id: item.id } });
    assert.equal(after.status, "ACCEPTED");
    assert.equal(after.taskId, results.find(Boolean));
  } finally {
    await a.user.deleteMany({ where: { email: `${tag}@example.com` } });
    await a.task.deleteMany({ where: { name: tag } });
    await a.project.deleteMany({ where: { name: tag } });
    await a.$disconnect();
    await b.$disconnect();
  }
});
