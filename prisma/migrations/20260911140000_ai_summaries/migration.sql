-- Summaries written from the transcript, and commitments read out of them.
--
-- Hand-written for the same reason as the last one: `migrate diff
-- --from-migrations` replays into a shadow database in the wrong schema and
-- emits a drop of every table. This delta is small and safe to re-run.

ALTER TYPE "onespace"."CommitmentSource" ADD VALUE IF NOT EXISTS 'AI_SUMMARY';

ALTER TABLE "onespace"."Meeting"
  ADD COLUMN IF NOT EXISTS "summary" TEXT,
  ADD COLUMN IF NOT EXISTS "summaryModel" TEXT,
  ADD COLUMN IF NOT EXISTS "summarisedAt" TIMESTAMP(3);
