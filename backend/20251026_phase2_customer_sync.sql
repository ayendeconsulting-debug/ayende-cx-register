-- Phase 2: Customer Profile Sync - Database Migration
-- Date: October 26, 2025
-- Purpose: Add sync infrastructure for POS-CRM integration

-- ============================================
-- STEP 1: Create new enums
-- ============================================

CREATE TYPE "CustomerSource" AS ENUM ('CRM', 'POS', 'ANONYMOUS');
CREATE TYPE "CustomerSyncState" AS ENUM ('SYNCED', 'PENDING', 'CONFLICT', 'FAILED');
CREATE TYPE "SyncPriority" AS ENUM ('HIGH', 'NORMAL', 'LOW');
CREATE TYPE "QueueStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'RETRY');

-- ============================================
-- STEP 2: Update Customer table
-- ============================================

-- Add integration and sync fields
ALTER TABLE "Customer" 
ADD COLUMN IF NOT EXISTS "customerSource" "CustomerSource" DEFAULT 'POS',
ADD COLUMN IF NOT EXISTS "syncState" "CustomerSyncState" DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "lastRefreshedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "syncRetryCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "syncError" TEXT,
ADD COLUMN IF NOT EXISTS "needsEnrichment" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN DEFAULT false;

-- Add dual loyalty calculation fields
ALTER TABLE "Customer"
ADD COLUMN IF NOT EXISTS "loyaltyPointsLocal" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "loyaltyPointsCRM" INTEGER,
ADD COLUMN IF NOT EXISTS "loyaltyLastSyncedAt" TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "Customer_isAnonymous_idx" ON "Customer"("isAnonymous");
CREATE INDEX IF NOT EXISTS "Customer_syncState_idx" ON "Customer"("syncState");
CREATE INDEX IF NOT EXISTS "Customer_customerSource_idx" ON "Customer"("customerSource");
CREATE INDEX IF NOT EXISTS "Customer_phone_idx" ON "Customer"("phone");

-- ============================================
-- STEP 3: Create SyncQueue table
-- ============================================

CREATE TABLE IF NOT EXISTS "SyncQueue" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" "SyncOperation" NOT NULL,
    "priority" "SyncPriority" DEFAULT 'NORMAL',
    "payload" JSONB NOT NULL,
    "status" "QueueStatus" DEFAULT 'PENDING',
    "retryCount" INTEGER DEFAULT 0,
    "maxRetries" INTEGER DEFAULT 3,
    "lastError" TEXT,
    "scheduledFor" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "SyncQueue_businessId_fkey" 
        FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

-- Create indexes for queue processing
CREATE INDEX IF NOT EXISTS "SyncQueue_status_priority_scheduledFor_idx" 
    ON "SyncQueue"("status", "priority", "scheduledFor");
CREATE INDEX IF NOT EXISTS "SyncQueue_entityType_entityId_idx" 
    ON "SyncQueue"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "SyncQueue_businessId_idx" 
    ON "SyncQueue"("businessId");

-- ============================================
-- STEP 4: Create LoyaltyReconciliation table
-- ============================================

CREATE TABLE IF NOT EXISTS "LoyaltyReconciliation" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "customerId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "posPoints" INTEGER NOT NULL,
    "crmPoints" INTEGER NOT NULL,
    "difference" INTEGER NOT NULL,
    "status" TEXT DEFAULT 'PENDING',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP,
    "resolution" TEXT,
    "notes" TEXT,
    "detectedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "LoyaltyReconciliation_customerId_fkey" 
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE,
    CONSTRAINT "LoyaltyReconciliation_businessId_fkey" 
        FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "LoyaltyReconciliation_status_idx" 
    ON "LoyaltyReconciliation"("status");
CREATE INDEX IF NOT EXISTS "LoyaltyReconciliation_customerId_idx" 
    ON "LoyaltyReconciliation"("customerId");
CREATE INDEX IF NOT EXISTS "LoyaltyReconciliation_detectedAt_idx" 
    ON "LoyaltyReconciliation"("detectedAt");

-- ============================================
-- STEP 5: Create anonymous walk-in customers
-- ============================================

-- Create one anonymous customer per business
INSERT INTO "Customer" (
    "id",
    "firstName",
    "lastName",
    "email",
    "phone",
    "businessId",
    "customerSource",
    "syncState",
    "isAnonymous",
    "isActive",
    "loyaltyPointsLocal"
)
SELECT 
    gen_random_uuid()::text,
    'Walk-In',
    'Customer',
    NULL,
    NULL,
    "id",
    'ANONYMOUS',
    'SYNCED',
    true,
    true,
    0
FROM "Business"
WHERE NOT EXISTS (
    SELECT 1 FROM "Customer" 
    WHERE "Customer"."businessId" = "Business"."id" 
    AND "Customer"."isAnonymous" = true
)
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 6: Data migration for existing customers
-- ============================================

-- Set existing customers as CRM source if they have externalId
UPDATE "Customer"
SET "customerSource" = 'CRM',
    "syncState" = 'SYNCED'
WHERE "externalId" IS NOT NULL
AND "customerSource" = 'POS';

-- Set local loyalty points from existing loyaltyPoints
UPDATE "Customer"
SET "loyaltyPointsLocal" = "loyaltyPoints"
WHERE "loyaltyPointsLocal" = 0
AND "loyaltyPoints" > 0;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify anonymous customers created
-- SELECT b."businessName", c."firstName", c."isAnonymous"
-- FROM "Business" b
-- LEFT JOIN "Customer" c ON c."businessId" = b."id" AND c."isAnonymous" = true;

-- Verify new columns exist
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'Customer' 
-- AND column_name IN ('customerSource', 'syncState', 'isAnonymous', 'loyaltyPointsLocal');

-- Check queue table structure
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'SyncQueue';

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

/*
-- Drop tables
DROP TABLE IF EXISTS "LoyaltyReconciliation" CASCADE;
DROP TABLE IF EXISTS "SyncQueue" CASCADE;

-- Remove columns from Customer
ALTER TABLE "Customer" 
DROP COLUMN IF EXISTS "customerSource",
DROP COLUMN IF EXISTS "syncState",
DROP COLUMN IF EXISTS "lastRefreshedAt",
DROP COLUMN IF EXISTS "syncRetryCount",
DROP COLUMN IF EXISTS "syncError",
DROP COLUMN IF EXISTS "needsEnrichment",
DROP COLUMN IF EXISTS "isAnonymous",
DROP COLUMN IF EXISTS "loyaltyPointsLocal",
DROP COLUMN IF EXISTS "loyaltyPointsCRM",
DROP COLUMN IF EXISTS "loyaltyLastSyncedAt";

-- Drop indexes
DROP INDEX IF EXISTS "Customer_isAnonymous_idx";
DROP INDEX IF EXISTS "Customer_syncState_idx";
DROP INDEX IF EXISTS "Customer_customerSource_idx";
DROP INDEX IF EXISTS "Customer_phone_idx";

-- Drop enums
DROP TYPE IF EXISTS "QueueStatus";
DROP TYPE IF EXISTS "SyncPriority";
DROP TYPE IF EXISTS "CustomerSyncState";
DROP TYPE IF EXISTS "CustomerSource";
*/

-- ============================================
-- Migration complete
-- ============================================
