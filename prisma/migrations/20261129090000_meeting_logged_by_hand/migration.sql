-- "Already logged": a meeting whose time was put on the timesheet by hand.
-- It is accepted with no time entry of its own, so it reads as logged rather
-- than not billable and the hour isn't booked twice. Adds a column; changes
-- no data.
-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "loggedByHand" BOOLEAN NOT NULL DEFAULT false;
