-- CreateEnum
CREATE TYPE "MeetingSource" AS ENUM ('CALENDAR', 'ZOOM');

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "actualMinutes" INTEGER,
ADD COLUMN     "recordingUrl" TEXT,
ADD COLUMN     "source" "MeetingSource" NOT NULL DEFAULT 'CALENDAR',
ADD COLUMN     "transcriptReadAt" TIMESTAMP(3),
ADD COLUMN     "zoomMeetingId" TEXT,
ADD COLUMN     "zoomUuid" TEXT,
ALTER COLUMN "googleId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Commitment" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "speaker" TEXT,
    "atSeconds" INTEGER,
    "suggestedTask" TEXT NOT NULL,
    "fromSummary" BOOLEAN NOT NULL DEFAULT false,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commitment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Commitment_taskId_key" ON "Commitment"("taskId");

-- CreateIndex
CREATE INDEX "Commitment_meetingId_status_idx" ON "Commitment"("meetingId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_userId_zoomUuid_key" ON "Meeting"("userId", "zoomUuid");

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

