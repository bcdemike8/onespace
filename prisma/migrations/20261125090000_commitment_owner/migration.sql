-- Who undertook each action item, and the fuller instruction behind its title.
--
-- My work now shows each consultant the things *they* agreed to do, whoever
-- hosted the call, and accepting one assigns the task to them. Nothing here
-- is removed: existing items have no owner and keep falling back to the host.

-- AlterTable
ALTER TABLE "Commitment" ADD COLUMN     "detail" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "ownerUnrecognised" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Commitment_ownerId_status_idx" ON "Commitment"("ownerId", "status");

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Read the calls since 16 November again, under the new rules.
--
-- Everything still waiting on a decision from those calls came from the old
-- rules - pattern-matched sentences, Zoom's unfiltered next steps, items with
-- no named owner. Those suggestions are cleared and the calls are marked
-- unread, so the next Zoom sync reads them with the stricter instructions and
-- offers each consultant only what they undertook.
--
-- Left alone: anything already accepted as a task or dismissed (somebody
-- decided those), recap-email items (the email rules haven't changed), and
-- everything before 16 November, which My work no longer shows.
--
-- 16 November is taken as midnight US Central, 06:00 UTC, the same instant
-- My work's cut-off uses.
DELETE FROM "Commitment" c
USING "Meeting" m
WHERE c."meetingId" = m."id"
  AND c."status" = 'PENDING'
  AND c."source" IN ('TRANSCRIPT', 'ZOOM_SUMMARY', 'AI_SUMMARY')
  AND m."startsAt" >= TIMESTAMP '2026-11-16 06:00:00'
  AND m."zoomUuid" IS NOT NULL;

UPDATE "Meeting"
SET "transcriptReadAt" = NULL, "transcriptNote" = NULL
WHERE "startsAt" >= TIMESTAMP '2026-11-16 06:00:00'
  AND "zoomUuid" IS NOT NULL
  AND "transcriptReadAt" IS NOT NULL;
