-- When a call's reading last failed in a way worth retrying, so the sync can
-- wait before trying again instead of repeating the failure on every pass.
-- Adds a column; changes no data.
ALTER TABLE "Meeting" ADD COLUMN "transcriptFailedAt" TIMESTAMP(3);
