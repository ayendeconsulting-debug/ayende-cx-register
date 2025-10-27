-- Insert Anonymous Walk-In Customer (Corrected)
-- This script creates one anonymous customer per business

INSERT INTO "Customer" (
    "id",
    "firstName",
    "lastName",
    "email",
    "phone",
    "dateOfBirth",
    "loyaltyPoints",
    "totalSpent",
    "visitCount",
    "lastVisit",
    "memberSince",
    "loyaltyTier",
    "address",
    "city",
    "state",
    "zipCode",
    "marketingOptIn",
    "isActive",
    "notes",
    "createdAt",
    "updatedAt",
    "businessId",
    "externalId",
    "lastSyncedAt",
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
    "loyaltyLastSyncedAt"
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
    NULL,
    NULL,
    NULL,
    NULL,
    false,
    true,
    'Anonymous walk-in customer for tracking non-registered purchases',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    "id",
    NULL,
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
    NULL
FROM "Business"
WHERE NOT EXISTS (
    SELECT 1 FROM "Customer" 
    WHERE "businessId" = "Business"."id" 
    AND "isAnonymous" = true
);

-- Verification: Show created anonymous customers
SELECT 
    'Anonymous customers created:' as status;

SELECT 
    id, 
    "firstName", 
    "lastName", 
    "isAnonymous", 
    "customerSource",
    "businessId" 
FROM "Customer" 
WHERE "isAnonymous" = true;

-- Show count
SELECT 
    COUNT(*) as anonymous_customer_count,
    "businessId"
FROM "Customer" 
WHERE "isAnonymous" = true
GROUP BY "businessId";
