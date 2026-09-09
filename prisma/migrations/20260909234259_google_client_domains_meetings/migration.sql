-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DISMISSED');

-- CreateTable
CREATE TABLE "ClientDomain" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "minutes" INTEGER NOT NULL,
    "organizerEmail" TEXT,
    "isOrganizer" BOOLEAN NOT NULL DEFAULT false,
    "attendees" JSONB NOT NULL,
    "externalDomains" TEXT[],
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "suggestedClientId" TEXT,
    "suggestedProjectId" TEXT,
    "projectId" TEXT,
    "taskId" TEXT,
    "matchReason" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "timeEntryId" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientDomain_domain_key" ON "ClientDomain"("domain");

-- CreateIndex
CREATE INDEX "ClientDomain_clientId_idx" ON "ClientDomain"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_timeEntryId_key" ON "Meeting"("timeEntryId");

-- CreateIndex
CREATE INDEX "Meeting_userId_status_startsAt_idx" ON "Meeting"("userId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "Meeting_projectId_idx" ON "Meeting"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_userId_googleId_key" ON "Meeting"("userId", "googleId");

-- AddForeignKey
ALTER TABLE "ClientDomain" ADD CONSTRAINT "ClientDomain_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_timeEntryId_fkey" FOREIGN KEY ("timeEntryId") REFERENCES "TimeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
