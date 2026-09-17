-- What the calendar sync passed over, and why.
--
-- A meeting is only stored when somebody in the invite is on a domain mapped
-- to a client. That is right, and it was silent: the domains it didn't
-- recognise were reported once, in a sentence after pressing Sync, and then
-- lost. Now they are written down and shown.

CREATE TABLE "UnmappedDomain" (
  "id" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "meetings" INTEGER NOT NULL DEFAULT 0,
  "example" TEXT,
  "people" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UnmappedDomain_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UnmappedDomain_domain_key" ON "UnmappedDomain"("domain");
CREATE INDEX "UnmappedDomain_meetings_idx" ON "UnmappedDomain"("meetings");
