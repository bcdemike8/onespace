-- Why a call has no write-up.
--
-- "This call wasn't recorded to the cloud" and "Zoom refused the download,
-- the app is missing a scope" are the same blank space on the meetings
-- page, and only one of them is worth doing anything about. The sync now
-- records which it was, on the call itself.

ALTER TABLE "onespace"."Meeting"
  ADD COLUMN IF NOT EXISTS "transcriptNote" TEXT;
