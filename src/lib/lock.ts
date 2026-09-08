import "server-only";
import { db } from "@/lib/db";
import { dayStart, today } from "@/lib/dates";
import { isLocked, lockedError, lockedThrough, type LockState } from "@/lib/periods";

/**
 * Admin override. Holds a `YYYY-MM-DD`; everything on or after that day stays
 * editable even once its month has closed. Deleting the row puts the normal
 * rule back.
 */
const REOPENED_FROM = "timesheet.reopenedFrom";

export async function getLockState(): Promise<LockState> {
  const row = await db.appSetting.findUnique({ where: { key: REOPENED_FROM } });
  return {
    lockedThrough: lockedThrough(today()),
    reopenedFrom: row?.value ? dayStart(row.value) : null,
  };
}

export async function setReopenedFrom(date: Date | null): Promise<void> {
  if (!date) {
    await db.appSetting.deleteMany({ where: { key: REOPENED_FROM } });
    return;
  }
  const value = dayStart(date).toISOString().slice(0, 10);
  await db.appSetting.upsert({
    where: { key: REOPENED_FROM },
    create: { key: REOPENED_FROM, value },
    update: { value },
  });
}

/**
 * Throws if the date sits in a closed period. Every write that touches a time
 * entry goes through this — the UI greys locked days, but the UI is not the
 * thing standing between an invoiced month and someone's keyboard.
 */
export async function assertUnlocked(...dates: (Date | null | undefined)[]) {
  const real = dates.filter((d): d is Date => d instanceof Date);
  if (real.length === 0) return;
  const state = await getLockState();
  for (const d of real) {
    if (isLocked(d, state)) throw new Error(lockedError(d));
  }
}
