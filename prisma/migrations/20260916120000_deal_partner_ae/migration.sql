-- The partner's account executive on a deal.
--
-- Missed on the first pass: Partner_AE__c is filled on 762 of the 1,269
-- deals, and on partner business it is who the relationship actually runs
-- through. A Contact, like the primary and billing contacts beside it.

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "partnerAeId" TEXT;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_partnerAeId_fkey" FOREIGN KEY ("partnerAeId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

