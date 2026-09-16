-- The rest of the account record.
--
-- Billing kept apart from shipping rather than merged - Salesforce holds
-- both and they are not always the same place. Plus the fields the account
-- page asks for by name: the escalation flag, the Apollo stage and its
-- owner, funders, the primary contact, a parent company, and who created
-- the record in Salesforce.

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "apolloStage" TEXT,
ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingCountry" TEXT,
ADD COLUMN     "billingPostalCode" TEXT,
ADD COLUMN     "billingState" TEXT,
ADD COLUMN     "billingStreet" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "escalation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "funders" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "implementationOwner" TEXT,
ADD COLUMN     "lastModifiedAt" TIMESTAMP(3),
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "primaryContactId" TEXT,
ADD COLUMN     "stageLastUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Client_primaryContactId_key" ON "Client"("primaryContactId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

