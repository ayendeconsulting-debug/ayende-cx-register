-- CreateEnum
CREATE TYPE "TermsDocumentType" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'DATA_PROCESSING', 'COMBINED');

-- CreateTable
CREATE TABLE "terms_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "documentType" "TermsDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "content" TEXT,
    "contentUrl" TEXT,
    "changelog" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terms_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms_acceptances" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "termsVersionId" TEXT NOT NULL,
    "acceptedBy" TEXT,
    "acceptedByEmail" TEXT NOT NULL,
    "acceptedByName" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "terms_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "terms_versions_version_key" ON "terms_versions"("version");

-- CreateIndex
CREATE INDEX "terms_versions_documentType_isActive_idx" ON "terms_versions"("documentType", "isActive");

-- CreateIndex
CREATE INDEX "terms_versions_effectiveDate_idx" ON "terms_versions"("effectiveDate");

-- CreateIndex
CREATE INDEX "terms_acceptances_businessId_idx" ON "terms_acceptances"("businessId");

-- CreateIndex
CREATE INDEX "terms_acceptances_termsVersionId_idx" ON "terms_acceptances"("termsVersionId");

-- CreateIndex
CREATE INDEX "terms_acceptances_acceptedAt_idx" ON "terms_acceptances"("acceptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "terms_acceptances_businessId_termsVersionId_key" ON "terms_acceptances"("businessId", "termsVersionId");

-- AddForeignKey
ALTER TABLE "terms_acceptances" ADD CONSTRAINT "terms_acceptances_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms_acceptances" ADD CONSTRAINT "terms_acceptances_termsVersionId_fkey" FOREIGN KEY ("termsVersionId") REFERENCES "terms_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
