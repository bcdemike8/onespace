-- Files on a deal: the signed SOW, the order form, the quote.
--
-- The bytes live in their own table so that listing a deal's files never
-- reads them. Profile photos taught that lesson the expensive way.

CREATE TABLE "DealFile" (
  "id" TEXT NOT NULL,
  "dealId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "uploadedById" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DealFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DealFile_dealId_uploadedAt_idx" ON "DealFile"("dealId", "uploadedAt");

CREATE TABLE "DealFileBody" (
  "fileId" TEXT NOT NULL,
  "data" BYTEA NOT NULL,

  CONSTRAINT "DealFileBody_pkey" PRIMARY KEY ("fileId")
);

ALTER TABLE "DealFile"
  ADD CONSTRAINT "DealFile_dealId_fkey"
  FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DealFile"
  ADD CONSTRAINT "DealFile_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DealFileBody"
  ADD CONSTRAINT "DealFileBody_fileId_fkey"
  FOREIGN KEY ("fileId") REFERENCES "DealFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
