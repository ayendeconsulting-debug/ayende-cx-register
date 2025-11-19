/**
 * CRM to POS Scheduled Sync Service
 * Runs periodically to ensure data consistency
 * Acts as backup to real-time webhooks
 * 
 * FIXED: Removed syncLog dependency (model doesn't exist in schema)
 * Uses console logging instead
 * 
 * FIXED: Use generateIntegrationToken for proper JWT authentication
 * 
 * Location: src/jobs/crmSyncScheduler.js
 */

import cron from 'node-cron';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

// Configuration
const CRM_API_URL = process.env.CRM_API_URL || 'https://ayendecx.com';
const INTEGRATION_SECRET = process.env.INTEGRATION_SECRET;

/**
 * Generate JWT token for system-to-system authentication
 * Must match the format expected by CRM's verify_jwt_token()
 */
function generateIntegrationToken(tenantId) {
  if (!INTEGRATION_SECRET) {
    throw new Error('INTEGRATION_SECRET not configured');
  }

  return jwt.sign(
    {
      iss: 'ayende-pos',
      sub: 'system-to-system',
      tenantId,
      scope: 'integration',
    },
    INTEGRATION_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Fetch customers from CRM that were updated since last sync
 */
async function syncCustomersFromCRM(businessId) {
  try {
    console.log(`[CRM SYNC] Starting customer sync for business ${businessId}`);
    
    // Get business info
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        externalTenantId: true,
        businessName: true,
      }
    });

    if (!business || !business.externalTenantId) {
      console.log(`[CRM SYNC] Business ${businessId} not linked to CRM tenant`);
      return { synced: 0, errors: 0 };
    }

    // REMOVED: syncLog query - using simple timestamp tracking instead
    // For now, sync all customers (can optimize later with lastSyncedAt tracking)
    console.log(`[CRM SYNC] Syncing all customers (full sync)`);

    // Generate JWT token for CRM API - FIXED: Use integration token format
    const token = generateIntegrationToken(business.externalTenantId);

    // Fetch customers from CRM
    const url = `${CRM_API_URL}/api/sync/customers`;

    console.log(`[CRM SYNC] Fetching from: ${url}`);
    console.log(`[CRM SYNC] Using tenant ID: ${business.externalTenantId}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': business.externalTenantId
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CRM API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const customers = data.customers || [];

    console.log(`[CRM SYNC] Found ${customers.length} customers to sync`);

    let synced = 0;
    let errors = 0;

    for (const crmCustomer of customers) {
      try {
        // Handle both snake_case and camelCase field names from CRM
        const firstName = crmCustomer.first_name || crmCustomer.firstName || 'Customer';
        const lastName = crmCustomer.last_name || crmCustomer.lastName || '';
        const loyaltyPoints = crmCustomer.loyalty_points ?? crmCustomer.loyaltyPoints ?? 0;
        const loyaltyTier = crmCustomer.loyalty_tier || crmCustomer.loyaltyTier || 'BRONZE';
        const totalSpent = crmCustomer.total_spent ?? crmCustomer.totalSpent ?? 0;
        const visitCount = crmCustomer.visit_count ?? crmCustomer.visitCount ?? 0;

        // Check if customer exists in POS by externalId (CRM customer ID)
          let existingCustomer = await prisma.customer.findFirst({
            where: {
              businessId,
              externalId: crmCustomer.id
            }
          });

          // Fallback: find by email or phone if not found by externalId
          if (!existingCustomer && (crmCustomer.email || crmCustomer.phone)) {
            existingCustomer = await prisma.customer.findFirst({
              where: {
                businessId,
                OR: [
                  ...(crmCustomer.email ? [{ email: crmCustomer.email }] : []),
                  ...(crmCustomer.phone ? [{ phone: crmCustomer.phone }] : [])
                ]
              }
            });
          }

        if (existingCustomer) {
          // Update existing customer
          await prisma.customer.update({
            where: { id: existingCustomer.id },
            data: {
              externalId: crmCustomer.id,  // Set externalId if it was missing
              firstName: firstName || existingCustomer.firstName,
              lastName: lastName || existingCustomer.lastName,
              email: crmCustomer.email || existingCustomer.email,
              phone: crmCustomer.phone || existingCustomer.phone,
              loyaltyPoints: loyaltyPoints,
              loyaltyTier: loyaltyTier,
              totalSpent: totalSpent,
              syncState: 'SYNCED',
              lastSyncedAt: new Date()
            }
          });
          console.log(`[CRM SYNC] Updated customer: ${firstName} ${lastName} (${existingCustomer.id})`);
        } else {
          // Create new customer from CRM (shouldn't happen often - POS creates first)
          const newCustomer = await prisma.customer.create({
            data: {
              businessId,
              externalId: crmCustomer.id,
              firstName: firstName,
              lastName: lastName,
              email: crmCustomer.email || null,
              phone: crmCustomer.phone || null,
              loyaltyPoints: loyaltyPoints,
              loyaltyTier: loyaltyTier,
              totalSpent: totalSpent,
              visitCount: visitCount,
              customerSource: 'CRM',
              syncState: 'SYNCED',
              lastSyncedAt: new Date(),
              isActive: true,
              isAnonymous: false
            }
          });
          console.log(`[CRM SYNC] Created customer from CRM: ${firstName} ${lastName} (${newCustomer.id})`);
        }

        synced++;
      } catch (error) {
        console.error(`[CRM SYNC] Error syncing customer ${crmCustomer.id}:`, error.message);
        errors++;
      }
    }

    // REMOVED: syncLog.create() - just log to console
    console.log(`[CRM SYNC] Completed: ${synced} synced, ${errors} errors`);

    return { synced, errors };

  } catch (error) {
    console.error(`[CRM SYNC] Failed for business ${businessId}:`, error);
    
    // REMOVED: syncLog.create() for failed sync - just log to console
    console.error(`[CRM SYNC] Error details:`, error.message);

    return { synced: 0, errors: 1 };
  }
}

/**
 * Run sync for all active businesses
 */
async function runScheduledSync() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  CRM → POS SCHEDULED SYNC - STARTING      ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`[CRM SYNC] Started at ${new Date().toISOString()}`);

  try {
    // Get all active businesses with CRM linkage
    const businesses = await prisma.business.findMany({
      where: {
        isActive: true,
        externalTenantId: {
          not: null
        }
      },
      select: {
        id: true,
        businessName: true,
        externalTenantId: true
      }
    });

    console.log(`[CRM SYNC] Found ${businesses.length} businesses to sync`);

    let totalSynced = 0;
    let totalErrors = 0;

    for (const business of businesses) {
      console.log(`\n[CRM SYNC] Processing: ${business.businessName}`);
      const result = await syncCustomersFromCRM(business.id);
      totalSynced += result.synced;
      totalErrors += result.errors;
    }

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  CRM → POS SCHEDULED SYNC - COMPLETED     ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log(`[CRM SYNC] Total synced: ${totalSynced}`);
    console.log(`[CRM SYNC] Total errors: ${totalErrors}`);
    console.log(`[CRM SYNC] Completed at ${new Date().toISOString()}\n`);

  } catch (error) {
    console.error('[CRM SYNC] Scheduled sync failed:', error);
  }
}

/**
 * Initialize CRM sync scheduler
 * Runs every 30 minutes
 */
export function initCrmSyncScheduler() {
  console.log('[CRM SYNC] Initializing CRM → POS sync scheduler');

  // Run every 30 minutes
  const schedule = '*/30 * * * *';

  cron.schedule(schedule, runScheduledSync);

  console.log(`[CRM SYNC] Scheduler initialized: ${schedule} (every 30 minutes)`);
  console.log('[CRM SYNC] Next run:', new Date(Date.now() + 30 * 60 * 1000).toISOString());

  // Run once immediately on startup (optional)
  if (process.env.RUN_SYNC_ON_STARTUP === 'true') {
    console.log('[CRM SYNC] Running initial sync on startup...');
    setTimeout(runScheduledSync, 5000); // Wait 5 seconds after startup
  }
}

export default {
  initCrmSyncScheduler,
  runScheduledSync,
  syncCustomersFromCRM
};