-- The CRM: Salesforce, rebuilt as tables rather than replaced by them.
--
-- Client becomes the Account. One company, one row - a second table would
-- mean the same customer existing twice and the copies disagreeing within a
-- month. Contact, Deal, Product and DealProduct are new.
--
-- Every one of these tables carries sfdcId so a re-import updates rather
-- than duplicates, and so the relationships in the export resolve.

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('PROSPECT', 'CURRENT_CUSTOMER', 'PREVIOUS_CUSTOMER', 'PARTNER', 'COMPETITOR');

-- CreateEnum
CREATE TYPE "DealRecordType" AS ENUM ('DIRECT', 'PARTNER');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('QUALIFICATION', 'DISCOVERY', 'ASSIGNED', 'INTRODUCTION', 'PROPOSAL', 'CONTRACT', 'CLOSED_WON', 'CLOSED_LOST');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'CURRENT_CUSTOMER',
ADD COLUMN     "annualRevenue" DECIMAL(14,2),
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "employees" INTEGER,
ADD COLUMN     "firstSeenAt" TIMESTAMP(3),
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "partnerId" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "salesRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sfdcId" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "teamSize" INTEGER,
ADD COLUMN     "technologyUsed" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "website" TEXT,
ADD COLUMN     "xdrSize" INTEGER;

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "sfdcId" TEXT,
    "clientId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "title" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "linkedinUrl" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "noLongerHere" BOOLEAN NOT NULL DEFAULT false,
    "optedOutOfEmail" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "leadSource" TEXT,
    "ownerId" TEXT,
    "firstSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "sfdcId" TEXT,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" "DealStage" NOT NULL DEFAULT 'QUALIFICATION',
    "type" "DealRecordType" NOT NULL DEFAULT 'DIRECT',
    "amount" DECIMAL(14,2),
    "closeDate" TIMESTAMP(3),
    "isWon" BOOLEAN NOT NULL DEFAULT false,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "partnerId" TEXT,
    "businessType" TEXT,
    "leadSource" TEXT,
    "paymentTerms" TEXT,
    "nextStep" TEXT,
    "description" TEXT,
    "lostReason" TEXT,
    "lostReasonDetail" TEXT,
    "customScopeDetail" TEXT,
    "futurePhaseNotes" TEXT,
    "billingNotes" TEXT,
    "projectStartDate" TIMESTAMP(3),
    "projectCompletionDate" TIMESTAMP(3),
    "subcontract" BOOLEAN NOT NULL DEFAULT false,
    "partnerHold" BOOLEAN NOT NULL DEFAULT false,
    "performancePulse" BOOLEAN NOT NULL DEFAULT false,
    "invoiceSentAt" TIMESTAMP(3),
    "invoicePaidAt" TIMESTAMP(3),
    "csatScore" INTEGER,
    "ownerId" TEXT,
    "leadConsultantId" TEXT,
    "secondaryConsultantId" TEXT,
    "primaryContactId" TEXT,
    "billingContactId" TEXT,
    "projectId" TEXT,
    "firstSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sfdcId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "family" TEXT,
    "delivery" TEXT,
    "sowUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealProduct" (
    "id" TEXT NOT NULL,
    "sfdcId" TEXT,
    "dealId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT,
    "quantity" DECIMAL(12,2),
    "unitPrice" DECIMAL(14,2),
    "totalPrice" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contact_sfdcId_key" ON "Contact"("sfdcId");

-- CreateIndex
CREATE INDEX "Contact_clientId_lastName_idx" ON "Contact"("clientId", "lastName");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_sfdcId_key" ON "Deal"("sfdcId");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_projectId_key" ON "Deal"("projectId");

-- CreateIndex
CREATE INDEX "Deal_clientId_closeDate_idx" ON "Deal"("clientId", "closeDate");

-- CreateIndex
CREATE INDEX "Deal_stage_closeDate_idx" ON "Deal"("stage", "closeDate");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sfdcId_key" ON "Product"("sfdcId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DealProduct_sfdcId_key" ON "DealProduct"("sfdcId");

-- CreateIndex
CREATE INDEX "DealProduct_dealId_idx" ON "DealProduct"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_sfdcId_key" ON "Client"("sfdcId");

-- CreateIndex
CREATE INDEX "Client_accountType_name_idx" ON "Client"("accountType", "name");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_leadConsultantId_fkey" FOREIGN KEY ("leadConsultantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_secondaryConsultantId_fkey" FOREIGN KEY ("secondaryConsultantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_billingContactId_fkey" FOREIGN KEY ("billingContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealProduct" ADD CONSTRAINT "DealProduct_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealProduct" ADD CONSTRAINT "DealProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

