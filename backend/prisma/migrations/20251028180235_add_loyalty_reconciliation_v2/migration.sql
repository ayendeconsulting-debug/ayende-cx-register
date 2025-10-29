-- CreateEnum
CREATE TYPE "EntityMappingType" AS ENUM ('CUSTOMER', 'BUSINESS', 'TRANSACTION');

-- CreateEnum
CREATE TYPE "CustomerSource" AS ENUM ('CRM', 'POS', 'ANONYMOUS');

-- CreateEnum
CREATE TYPE "CustomerSyncState" AS ENUM ('SYNCED', 'PENDING', 'CONFLICT', 'FAILED');

-- CreateEnum
CREATE TYPE "SyncPriority" AS ENUM ('HIGH', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'RETRY');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('customer', 'transaction', 'product', 'business');

-- DropIndex
DROP INDEX "Customer_externalId_key";

-- DropIndex
DROP INDEX "Transaction_externalId_key";

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "lastSyncedAt" TIMESTAMP(6),
ADD COLUMN     "syncStatus" "SyncStatus" DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "customerSource" "CustomerSource" DEFAULT 'POS',
ADD COLUMN     "isAnonymous" BOOLEAN DEFAULT false,
ADD COLUMN     "lastRefreshedAt" TIMESTAMP(6),
ADD COLUMN     "loyaltyLastSyncedAt" TIMESTAMP(6),
ADD COLUMN     "loyaltyPointsCRM" INTEGER,
ADD COLUMN     "loyaltyPointsLocal" INTEGER DEFAULT 0,
ADD COLUMN     "needsEnrichment" BOOLEAN DEFAULT false,
ADD COLUMN     "syncError" TEXT,
ADD COLUMN     "syncRetryCount" INTEGER DEFAULT 0,
ADD COLUMN     "syncState" "CustomerSyncState" DEFAULT 'PENDING',
ADD COLUMN     "syncStatus" "SyncStatus" DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "syncStatus" "SyncStatus" DEFAULT 'PENDING',
ADD COLUMN     "syncedToCrm" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "LoyaltyReconciliation" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "posPoints" INTEGER NOT NULL,
    "crmPoints" INTEGER NOT NULL,
    "discrepancy" INTEGER NOT NULL,
    "action" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMapping" (
    "id" TEXT NOT NULL,
    "entityType" "EntityMappingType" NOT NULL,
    "posId" TEXT NOT NULL,
    "crmId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncQueue" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "priority" "SyncPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "QueueStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoyaltyReconciliation_businessId_idx" ON "LoyaltyReconciliation"("businessId");

-- CreateIndex
CREATE INDEX "LoyaltyReconciliation_customerId_idx" ON "LoyaltyReconciliation"("customerId");

-- CreateIndex
CREATE INDEX "LoyaltyReconciliation_detectedAt_idx" ON "LoyaltyReconciliation"("detectedAt");

-- CreateIndex
CREATE INDEX "LoyaltyReconciliation_status_idx" ON "LoyaltyReconciliation"("status");

-- CreateIndex
CREATE INDEX "SystemMapping_businessId_idx" ON "SystemMapping"("businessId");

-- CreateIndex
CREATE INDEX "SystemMapping_entityType_syncStatus_idx" ON "SystemMapping"("entityType", "syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "SystemMapping_entityType_crmId_key" ON "SystemMapping"("entityType", "crmId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemMapping_entityType_posId_key" ON "SystemMapping"("entityType", "posId");

-- CreateIndex
CREATE INDEX "SyncQueue_businessId_idx" ON "SyncQueue"("businessId");

-- CreateIndex
CREATE INDEX "SyncQueue_status_priority_idx" ON "SyncQueue"("status", "priority");

-- CreateIndex
CREATE INDEX "SyncQueue_scheduledFor_idx" ON "SyncQueue"("scheduledFor");

-- CreateIndex
CREATE INDEX "Customer_isAnonymous_idx" ON "Customer"("isAnonymous");

-- CreateIndex
CREATE INDEX "Customer_syncState_idx" ON "Customer"("syncState");

-- CreateIndex
CREATE INDEX "Customer_customerSource_idx" ON "Customer"("customerSource");

-- CreateIndex
CREATE INDEX "Transaction_syncedToCrm_idx" ON "Transaction"("syncedToCrm");

-- AddForeignKey
ALTER TABLE "LoyaltyReconciliation" ADD CONSTRAINT "LoyaltyReconciliation_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyReconciliation" ADD CONSTRAINT "LoyaltyReconciliation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemMapping" ADD CONSTRAINT "SystemMapping_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncQueue" ADD CONSTRAINT "SyncQueue_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
