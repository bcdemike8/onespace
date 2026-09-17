-- Every calendar entry the sync passed over, by name.
--
-- The domain-level record could not describe a meeting with nobody external
-- in the invite: there was no domain to file it under, so it disappeared
-- without trace. This records the meeting itself.

CREATE TABLE "SkippedMeeting" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "googleId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "code" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "guests" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "externalDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SkippedMeeting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SkippedMeeting_userId_googleId_key" ON "SkippedMeeting"("userId", "googleId");
CREATE INDEX "SkippedMeeting_userId_startsAt_idx" ON "SkippedMeeting"("userId", "startsAt");

ALTER TABLE "SkippedMeeting"
  ADD CONSTRAINT "SkippedMeeting_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
