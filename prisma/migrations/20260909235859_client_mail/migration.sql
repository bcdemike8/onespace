-- CreateEnum
CREATE TYPE "MailStatus" AS ENUM ('OPEN', 'DONE');

-- CreateTable
CREATE TABLE "MailThread" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gmailThreadId" TEXT NOT NULL,
    "clientId" TEXT,
    "projectId" TEXT,
    "taskId" TEXT,
    "subject" TEXT NOT NULL,
    "lastFrom" TEXT NOT NULL,
    "lastFromName" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "snippet" TEXT NOT NULL,
    "awaitingUs" BOOLEAN NOT NULL DEFAULT true,
    "status" "MailStatus" NOT NULL DEFAULT 'OPEN',
    "matchReason" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "gmailMessageId" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "toEmails" TEXT[],
    "ccEmails" TEXT[],
    "sentAt" TIMESTAMP(3) NOT NULL,
    "body" TEXT NOT NULL,
    "messageIdHeader" TEXT,
    "referencesHeader" TEXT,
    "fromUs" BOOLEAN NOT NULL DEFAULT false,
    "sentFromOneSpace" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MailThread_userId_status_lastMessageAt_idx" ON "MailThread"("userId", "status", "lastMessageAt");

-- CreateIndex
CREATE INDEX "MailThread_projectId_idx" ON "MailThread"("projectId");

-- CreateIndex
CREATE INDEX "MailThread_clientId_idx" ON "MailThread"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "MailThread_userId_gmailThreadId_key" ON "MailThread"("userId", "gmailThreadId");

-- CreateIndex
CREATE INDEX "MailMessage_threadId_sentAt_idx" ON "MailMessage"("threadId", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "MailMessage_threadId_gmailMessageId_key" ON "MailMessage"("threadId", "gmailMessageId");

-- AddForeignKey
ALTER TABLE "MailThread" ADD CONSTRAINT "MailThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailThread" ADD CONSTRAINT "MailThread_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailThread" ADD CONSTRAINT "MailThread_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailThread" ADD CONSTRAINT "MailThread_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailMessage" ADD CONSTRAINT "MailMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
