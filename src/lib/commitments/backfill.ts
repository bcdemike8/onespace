import "server-only";
import { db } from "@/lib/db";
import { dueFor } from "@/lib/when";

/**
 * Put dates on the commitments that were found before dates existed.
 *
 * Cheap and idempotent: only rows still waiting for an answer and still
 * without a date, and the rules are pure text over a sentence we already
 * have. Run at the top of a sync rather than as a migration, because a
 * migration can't call TypeScript and re-reading the transcripts to get
 * these back would raise every dismissed promise a second time.
 *
 * Anchored to when it was said - the call, or the day the recap went out -
 * so "by Friday" in a fortnight-old commitment still means that Friday.
 */
export async function backfillDueDates(): Promise<number> {
  const rows = await db.commitment.findMany({
    where: { status: "PENDING", dueDate: null },
    select: {
      id: true,
      text: true,
      meeting: { select: { startsAt: true } },
      mailMessage: { select: { sentAt: true } },
      createdAt: true,
    },
    take: 500,
  });

  let filled = 0;
  for (const row of rows) {
    const said = row.meeting?.startsAt ?? row.mailMessage?.sentAt ?? row.createdAt;
    const due = dueFor(row.text, said);
    await db.commitment.update({
      where: { id: row.id },
      data: { dueDate: due.date, dueStated: due.stated },
    });
    filled += 1;
  }

  return filled;
}
