-- Read the recaps sent since 16 November again, with Claude.
--
-- Recap emails were read by line-by-line rules that couldn't tell the
-- client's own next steps from RevOptics' and, on hard-wrapped email, cut
-- list items into fragments ("Contact records in Salesforce, so we'll need to
-- confirm whether a"). Claude reads them now and keeps only what a RevOptics
-- person took on.
--
-- Suggestions still waiting from those recaps are cleared and the messages
-- marked unread, so the next mail sync reads them again. Left alone: anything
-- already accepted as a task or dismissed (a re-read won't raise those again),
-- and everything before 16 November, which My work no longer shows.
--
-- 16 November is midnight US Central, 06:00 UTC - the same instant as the
-- previous migration and My work's cut-off.
DELETE FROM "Commitment" c
USING "MailMessage" mm
WHERE c."mailMessageId" = mm."id"
  AND c."status" = 'PENDING'
  AND c."source" = 'RECAP_EMAIL'
  AND mm."sentAt" >= TIMESTAMP '2026-11-16 06:00:00';

UPDATE "MailMessage"
SET "recapReadAt" = NULL
WHERE "fromUs" = true
  AND "sentAt" >= TIMESTAMP '2026-11-16 06:00:00'
  AND "recapReadAt" IS NOT NULL;
