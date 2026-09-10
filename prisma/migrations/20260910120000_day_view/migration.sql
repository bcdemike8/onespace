-- The consultant's day: commitments that know when they are due, and
-- commitments that come out of a recap email as well as out of a call.
--
-- Written by hand. `migrate diff --from-migrations` replays into a shadow
-- database in the wrong schema and produces a drop-and-recreate of the whole
-- database; this delta is small enough to state plainly and safe to re-run.

-- Where a commitment was found.
DO $$ BEGIN
  CREATE TYPE "onespace"."CommitmentSource" AS ENUM ('TRANSCRIPT', 'ZOOM_SUMMARY', 'RECAP_EMAIL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- A recap email can raise action items too, so a commitment no longer has to
-- belong to a meeting.
ALTER TABLE "onespace"."Commitment" ALTER COLUMN "meetingId" DROP NOT NULL;

ALTER TABLE "onespace"."Commitment"
  ADD COLUMN IF NOT EXISTS "mailMessageId" TEXT,
  ADD COLUMN IF NOT EXISTS "source" "onespace"."CommitmentSource" NOT NULL DEFAULT 'TRANSCRIPT',
  ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "dueStated" BOOLEAN NOT NULL DEFAULT false;

-- Existing rows: fromSummary already recorded which of the two call sources
-- it was, so carry that across rather than calling them all transcripts.
UPDATE "onespace"."Commitment"
   SET "source" = 'ZOOM_SUMMARY'
 WHERE "fromSummary" = true AND "source" = 'TRANSCRIPT';

ALTER TABLE "onespace"."MailMessage"
  ADD COLUMN IF NOT EXISTS "recapReadAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Commitment_mailMessageId_idx"
  ON "onespace"."Commitment"("mailMessageId");

CREATE INDEX IF NOT EXISTS "Commitment_status_dueDate_idx"
  ON "onespace"."Commitment"("status", "dueDate");

DO $$ BEGIN
  ALTER TABLE "onespace"."Commitment"
    ADD CONSTRAINT "Commitment_mailMessageId_fkey"
    FOREIGN KEY ("mailMessageId") REFERENCES "onespace"."MailMessage"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
