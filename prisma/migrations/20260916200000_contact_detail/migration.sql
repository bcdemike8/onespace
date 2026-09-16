-- The rest of the Salesforce Contact page: fax and department, the reports-to
-- link, the two halves of a mailing address that were missing, Description
-- alongside Person Notes, the referral source, and who made the record.

ALTER TABLE "Contact"
  ADD COLUMN "fax" TEXT,
  ADD COLUMN "department" TEXT,
  ADD COLUMN "reportsToId" TEXT,
  ADD COLUMN "street" TEXT,
  ADD COLUMN "postalCode" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "referralLeadSource" TEXT,
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "lastModifiedById" TEXT,
  ADD COLUMN "lastModifiedAt" TIMESTAMP(3);

ALTER TABLE "Contact"
  ADD CONSTRAINT "Contact_reportsToId_fkey"
  FOREIGN KEY ("reportsToId") REFERENCES "Contact"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Contact"
  ADD CONSTRAINT "Contact_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Contact"
  ADD CONSTRAINT "Contact_lastModifiedById_fkey"
  FOREIGN KEY ("lastModifiedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
