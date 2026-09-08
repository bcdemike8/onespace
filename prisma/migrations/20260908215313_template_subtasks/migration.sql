-- AlterTable
ALTER TABLE "TemplateTask" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "TemplateTask_parentId_idx" ON "TemplateTask"("parentId");

-- AddForeignKey
ALTER TABLE "TemplateTask" ADD CONSTRAINT "TemplateTask_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TemplateTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
