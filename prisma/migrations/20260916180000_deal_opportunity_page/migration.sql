-- The rest of the Salesforce Opportunity page: the SQL checkbox and its date,
-- the two audits, the two durations, and the three lookups that have nothing
-- to point at here yet.

ALTER TABLE "Deal"
  ADD COLUMN "isSql" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sqlDate" TIMESTAMP(3),
  ADD COLUMN "dealLength" INTEGER,
  ADD COLUMN "auditCompleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "auditCompletedDate" TIMESTAMP(3),
  ADD COLUMN "threeMonthAuditDate" TIMESTAMP(3),
  ADD COLUMN "projectDuration" INTEGER,
  ADD COLUMN "contractRef" TEXT,
  ADD COLUMN "syncedQuoteRef" TEXT,
  ADD COLUMN "campaignSourceRef" TEXT,
  ADD COLUMN "lastModifiedById" TEXT;

ALTER TABLE "Deal"
  ADD CONSTRAINT "Deal_lastModifiedById_fkey"
  FOREIGN KEY ("lastModifiedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
