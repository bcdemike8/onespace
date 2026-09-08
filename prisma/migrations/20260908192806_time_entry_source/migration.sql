-- CreateEnum
CREATE TYPE "TimeEntrySource" AS ENUM ('TIMESHEET', 'MANUAL', 'TIMER', 'IMPORT');

-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN     "source" "TimeEntrySource" NOT NULL DEFAULT 'MANUAL';

-- CreateIndex
CREATE INDEX "TimeEntry_userId_taskId_date_idx" ON "TimeEntry"("userId", "taskId", "date");

-- Existing rows: anything with a stopwatch window came from the timer.
-- Everything else stays MANUAL, which is the safe reading — it means the
-- timesheet treats already-recorded time as read-only rather than assuming
-- it may rewrite it.
UPDATE "TimeEntry" SET "source" = 'TIMER' WHERE "startedAt" IS NOT NULL;
