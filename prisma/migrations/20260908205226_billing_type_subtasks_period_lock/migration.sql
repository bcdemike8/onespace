-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('HOURLY', 'FIXED_FEE', 'NON_BILLABLE');

-- AlterTable: Project.billable (boolean) becomes Project.billingType (enum).
-- Carry the old flag across before dropping it, so a project already marked
-- non-billable stays non-billable. Nothing was fixed-fee before this existed.
ALTER TABLE "Project" ADD COLUMN "billingType" "BillingType" NOT NULL DEFAULT 'HOURLY';

UPDATE "Project" SET "billingType" = 'NON_BILLABLE' WHERE "billable" = false;

ALTER TABLE "Project" DROP COLUMN "billable";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "parentId" TEXT;

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Task_parentId_idx" ON "Task"("parentId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
