-- The rest of what Salesforce held about a deal.
--
-- Ten fields that are populated on the real export and were left out of the
-- first pass - probability, forecast category, expected revenue, the fiscal
-- placement, who created it, when it last moved - plus OpportunityContactRole
-- as its own table, because a person is the billing contact on one deal and
-- the admin on another: the role belongs to the pairing, not the person.

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "expectedRevenue" DECIMAL(14,2),
ADD COLUMN     "fiscalQuarter" INTEGER,
ADD COLUMN     "fiscalYear" INTEGER,
ADD COLUMN     "forecastCategory" TEXT,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "lastModifiedAt" TIMESTAMP(3),
ADD COLUMN     "lastStageChangeAt" TIMESTAMP(3),
ADD COLUMN     "legacyId" TEXT,
ADD COLUMN     "probability" INTEGER,
ADD COLUMN     "quantity" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "DealContactRole" (
    "id" TEXT NOT NULL,
    "sfdcId" TEXT,
    "dealId" TEXT NOT NULL,
    "contactId" TEXT,
    "role" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealContactRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DealContactRole_sfdcId_key" ON "DealContactRole"("sfdcId");

-- CreateIndex
CREATE INDEX "DealContactRole_dealId_idx" ON "DealContactRole"("dealId");

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealContactRole" ADD CONSTRAINT "DealContactRole_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealContactRole" ADD CONSTRAINT "DealContactRole_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

