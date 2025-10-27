-- ============================================
-- Ayende-CX POS Integration - Manual Migration
-- Description: Add only integration fields without dropping existing columns
-- ============================================

-- Create EntityMappingType enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EntityMappingType') THEN
        CREATE TYPE "EntityMappingType" AS ENUM ('CUSTOMER', 'BUSINESS', 'TRANSACTION');
    END IF;
END $$;

-- Create or update SyncStatus enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SyncStatus') THEN
        CREATE TYPE "SyncStatus" AS ENUM ('ACTIVE', 'PENDING', 'FAILED', 'ARCHIVED');
    ELSE
        -- Add new values if they don't exist
        ALTER TYPE "SyncStatus" ADD VALUE IF NOT EXISTS 'ACTIVE';
        ALTER TYPE "SyncStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';
    END IF;
END $$;

-- ============================================
-- Add integration fields to Business table
-- ============================================
ALTER TABLE "Business" 
  ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "syncStatus" "SyncStatus" DEFAULT 'ACTIVE';

-- ============================================
-- Add integration fields to Customer table  
-- ============================================
ALTER TABLE "Customer"
  ADD COLUMN IF NOT EXISTS "externalId" TEXT,
  ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "syncStatus" "SyncStatus" DEFAULT 'ACTIVE';

-- Add unique constraint on Customer.externalId (only for non-null values)
DROP INDEX IF EXISTS "Customer_externalId_key";
CREATE UNIQUE INDEX "Customer_externalId_key" ON "Customer"("externalId") WHERE "externalId" IS NOT NULL;

-- Add index on Customer.externalId
CREATE INDEX IF NOT EXISTS "Customer_externalId_idx" ON "Customer"("externalId");

-- ============================================
-- Add integration fields to Transaction table
-- ============================================
ALTER TABLE "Transaction"
  ADD COLUMN IF NOT EXISTS "externalId" TEXT,
  ADD COLUMN IF NOT EXISTS "syncedToCrm" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "syncedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "syncStatus" "SyncStatus" DEFAULT 'PENDING';

-- Add unique constraint on Transaction.externalId (only for non-null values)
DROP INDEX IF EXISTS "Transaction_externalId_key";
CREATE UNIQUE INDEX "Transaction_externalId_key" ON "Transaction"("externalId") WHERE "externalId" IS NOT NULL;

-- Add indexes on Transaction
CREATE INDEX IF NOT EXISTS "Transaction_externalId_idx" ON "Transaction"("externalId");
CREATE INDEX IF NOT EXISTS "Transaction_syncedToCrm_idx" ON "Transaction"("syncedToCrm");

-- ============================================
-- Create SystemMapping table
-- ============================================
CREATE TABLE IF NOT EXISTS "SystemMapping" (
    "id" TEXT NOT NULL,
    "entityType" "EntityMappingType" NOT NULL,
    "posId" TEXT NOT NULL,
    "crmId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemMapping_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints for SystemMapping
DROP INDEX IF EXISTS "SystemMapping_entityType_posId_key";
CREATE UNIQUE INDEX "SystemMapping_entityType_posId_key" ON "SystemMapping"("entityType", "posId");

DROP INDEX IF EXISTS "SystemMapping_entityType_crmId_key";
CREATE UNIQUE INDEX "SystemMapping_entityType_crmId_key" ON "SystemMapping"("entityType", "crmId");

-- Create indexes for SystemMapping
CREATE INDEX IF NOT EXISTS "SystemMapping_businessId_idx" ON "SystemMapping"("businessId");
CREATE INDEX IF NOT EXISTS "SystemMapping_entityType_syncStatus_idx" ON "SystemMapping"("entityType", "syncStatus");

-- Add foreign key for SystemMapping
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'SystemMapping_businessId_fkey'
    ) THEN
        ALTER TABLE "SystemMapping" 
          ADD CONSTRAINT "SystemMapping_businessId_fkey" 
          FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================
-- Enhance SyncLog table (if it exists)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'SyncLog') THEN
        ALTER TABLE "SyncLog"
          ADD COLUMN IF NOT EXISTS "payload" TEXT,
          ADD COLUMN IF NOT EXISTS "response" TEXT,
          ADD COLUMN IF NOT EXISTS "error" TEXT,
          ADD COLUMN IF NOT EXISTS "duration" INTEGER;
    END IF;
END $$;

-- ============================================
-- Verification queries
-- ============================================

-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('Business', 'Customer', 'Transaction', 'SystemMapping', 'SyncLog')
ORDER BY table_name;

-- Check if columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Business' 
  AND column_name IN ('externalTenantId', 'lastSyncedAt', 'syncStatus');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Customer' 
  AND column_name IN ('externalId', 'lastSyncedAt', 'syncStatus');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Transaction' 
  AND column_name IN ('externalId', 'syncedToCrm', 'syncedAt', 'syncStatus');

-- Check SystemMapping table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'SystemMapping'
ORDER BY ordinal_position;

-- Done!
SELECT 'Integration fields added successfully!' as message;
