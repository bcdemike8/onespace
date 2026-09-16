-- A profile somebody owns: who they are, when they work, how to reach them,
-- what they want to hear about, and a photo.

ALTER TABLE "User"
  ADD COLUMN "title" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "linkedinUrl" TEXT,
  ADD COLUMN "startDate" TIMESTAMP(3),
  ADD COLUMN "timeZone" TEXT,
  ADD COLUMN "workStartMinute" INTEGER,
  ADD COLUMN "workEndMinute" INTEGER,
  ADD COLUMN "workDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  ADD COLUMN "avatarUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "dailyDigest" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "meetingNudges" BOOLEAN NOT NULL DEFAULT true;

-- The photo's bytes sit in their own table so that the query behind every
-- page in the app never touches them.
CREATE TABLE "UserAvatar" (
  "userId" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "mimeType" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserAvatar_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "UserAvatar"
  ADD CONSTRAINT "UserAvatar_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
