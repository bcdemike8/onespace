-- Meetings with no client in the room. Previously the sync dropped these
-- entirely; now everyone but an admin keeps them, so they need a flag the
-- review screen can read to start the Billable box unticked.
ALTER TABLE "onespace"."Meeting"
  ADD COLUMN "noClient" BOOLEAN NOT NULL DEFAULT false;
