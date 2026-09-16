-- The Opportunity Product page: list price against the price actually
-- charged, the product code, the service date, the line's own description,
-- and who made the record.

ALTER TABLE "Product" ADD COLUMN "code" TEXT;

ALTER TABLE "DealProduct"
  ADD COLUMN "productCode" TEXT,
  ADD COLUMN "listPrice" DECIMAL(14,2),
  ADD COLUMN "serviceDate" TIMESTAMP(3),
  ADD COLUMN "description" TEXT,
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "lastModifiedById" TEXT,
  ADD COLUMN "lastModifiedAt" TIMESTAMP(3),
  ADD COLUMN "firstSeenAt" TIMESTAMP(3);

ALTER TABLE "DealProduct"
  ADD CONSTRAINT "DealProduct_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DealProduct"
  ADD CONSTRAINT "DealProduct_lastModifiedById_fkey"
  FOREIGN KEY ("lastModifiedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
