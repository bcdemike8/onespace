-- Who put a project on hold, when and why, and when an admin cleared the
-- notice. Adds columns; changes no data. Projects already on hold have no
-- onHoldAt, so they don't appear in the admin's recently-on-hold list.
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "onHoldAt" TIMESTAMP(3),
ADD COLUMN     "onHoldById" TEXT,
ADD COLUMN     "onHoldClearedAt" TIMESTAMP(3),
ADD COLUMN     "onHoldReason" TEXT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_onHoldById_fkey" FOREIGN KEY ("onHoldById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

