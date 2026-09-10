-- CreateTable
CREATE TABLE "IgnoredDomain" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IgnoredDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IgnoredDomain_domain_key" ON "IgnoredDomain"("domain");
