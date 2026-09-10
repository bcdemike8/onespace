-- CreateTable
CREATE TABLE "PartnerDomain" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerDomain_domain_key" ON "PartnerDomain"("domain");

-- CreateIndex
CREATE INDEX "PartnerDomain_partnerId_idx" ON "PartnerDomain"("partnerId");

-- AddForeignKey
ALTER TABLE "PartnerDomain" ADD CONSTRAINT "PartnerDomain_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
