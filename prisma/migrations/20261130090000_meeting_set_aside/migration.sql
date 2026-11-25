-- Two more ways a meeting leaves the list, labelled apart from "Not
-- billable": Cleared (swept up by "Clear the backlog") and Removed (not work
-- at all - a block, an appointment). Adds a column; changes no data, so
-- every meeting already set aside stays "Not billable".
-- CreateEnum
CREATE TYPE "MeetingSetAside" AS ENUM ('BACKLOG', 'REMOVED');

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "setAside" "MeetingSetAside";
