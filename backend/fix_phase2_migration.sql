-- Fix Phase 2 Migration Issues
-- This script addresses missing EntityType enum and creates SyncQueue table

-- ============================================================================
-- 1. CREATE MISSING ENTITYTYPE ENUM
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE "EntityType" AS ENUM ('customer', 'transaction', 'product', 'business');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. CREATE SYNCQUEUE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS "SyncQueue" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncQueue_pkey" PRIMARY KEY ("id")
);

-- Create indexes for SyncQueue
CREATE INDEX IF NOT EXISTS "SyncQueue_businessId_idx" ON "SyncQueue"("businessId");
CREATE INDEX IF NOT EXISTS "SyncQueue_status_priority_idx" ON "SyncQueue"("status", "priority");
CREATE INDEX IF NOT EXISTS "SyncQueue_scheduledFor_idx" ON "SyncQueue"("scheduledFor");

-- Add foreign key constraint
DO $$ BEGIN
    ALTER TABLE "SyncQueue" ADD CONSTRAINT "SyncQueue_businessId_fkey" 
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. CREATE ANONYMOUS WALK-IN CUSTOMER
-- ============================================================================

-- Insert anonymous walk-in customer for each business
-- Fix the updatedAt issue by providing a value
INSERT INTO "Customer" (
    "id",
    "firstName",
    "lastName",
    "phone",
    "email",
    "address",
    "loyaltyPoints",
    "totalSpent",
    "visitCount",
    "lastVisitDate",
    "createdAt",
    "loyaltyTier",
    "marketingOptIn",
    "notes",
    "dateOfBirth",
    "tags",
    "businessId",
    "crmCustomerId",
    "syncStatus",
    "customerSource",
    "syncState",
    "lastRefreshedAt",
    "syncRetryCount",
    "syncError",
    "needsEnrichment",
    "isAnonymous",
    "loyaltyPointsLocal",
    "loyaltyPointsCRM",
    "loyaltyLastSyncedAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid(),
    'Walk-In',
    'Customer',
    NULL,
    NULL,
    NULL,
    0,
    0.00,
    0,
    NULL,
    CURRENT_TIMESTAMP,
    'BRONZE',
    false,
    'Anonymous walk-in customer for tracking non-registered purchases',
    NULL,
    NULL,
    "id",
    NULL,
    'ACTIVE',
    'ANONYMOUS',
    'SYNCED',
    NULL,
    0,
    NULL,
    false,
    true,
    0,
    NULL,
    NULL,
    CURRENT_TIMESTAMP
FROM "Business"
WHERE NOT EXISTS (
    SELECT 1 FROM "Customer" 
    WHERE "businessId" = "Business"."id" 
    AND "isAnonymous" = true
);

-- ============================================================================
-- 4. VERIFICATION QUERIES
-- ============================================================================

-- Show created tables
SELECT 'Tables created:' as status;
SELECT tablename FROM pg_tables WHERE tablename IN ('SyncQueue', 'LoyaltyReconciliation') ORDER BY tablename;

-- Show created enums
SELECT 'Enums verified:' as status;
SELECT typname FROM pg_type WHERE typname IN ('EntityType', 'CustomerSource', 'CustomerSyncState', 'SyncPriority', 'QueueStatus') AND typtype = 'e' ORDER BY typname;

-- Show anonymous customers
SELECT 'Anonymous customers created:' as status;
SELECT id, "firstName", "lastName", "isAnonymous", "businessId" FROM "Customer" WHERE "isAnonymous" = true;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✓ Phase 2 migration fix completed successfully!' as status;
