/**
 * CRM to POS Scheduled Sync Service
 * Runs periodically to ensure data consistency
 * Acts as backup to real-time webhooks
 * 
 * Location: src/jobs/crmSyncScheduler.js
 */

import cron from 'node-cron';
import prisma from '../config/database.js';
import { generateAccessToken } from '../utils/auth.js';

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

    // Get last sync timestamp
    const lastSync = await prisma.syncLog.findFirst({
      where: {
        businessId,
        syncType: 'CRM_TO_POS',
        entityType: 'customer',
        status: 'SUCCESS'
      },
      orderBy: { createdAt: 'desc' }
    });

    const lastSyncTime = lastSync ? lastSync.createdAt.toISOString() : null;
    
    console.log(`[CRM SYNC] Last sync: ${lastSyncTime || 'Never'}`);

    // Generate JWT token for CRM API
    const token = generateAccessToken({
      businessId,
      tenantId: business.externalTenantId,
      email: 'sync@ayende-cx.com',
      role: 'SYSTEM'
    });

    // Fetch updated customers from CRM
    const crmUrl = process.env.CRM_API_URL || 'https://staging.ayendecx.com';
    const url = lastSyncTime 
      ? `${crmUrl}/api/sync/customers?updated_since=${lastSyncTime}`
      : `${crmUrl}/api/sync/customers`;

    console.log(`[CRM SYNC] Fetching from: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`CRM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const customers = data.customers || [];

    console.log(`[CRM SYNC] Found ${customers.length} customers to sync`);

    let synced = 0;
    let errors = 0;

    for (const crmCustomer of customers) {
      try {
        // Check if customer exists in POS by externalId
        const existingCustomer = await prisma.customer.findFirst({
          where: {
            businessId,
            externalId: crmCustomer.id
          }
        });

        if (existingCustomer) {
          // Update existing customer
          await prisma.customer.update({
            where: { id: existingCustomer.id },
            data: {
              firstName: crmCustomer.first_name,
              lastName: crmCustomer.last_name,
              email: crmCustomer.email || existingCustomer.email,
              phone: crmCustomer.phone || existingCustomer.phone,
              loyaltyPoints: crmCustomer.loyalty_points || existingCustomer.loyaltyPoints,
              loyaltyTier: crmCustomer.loyalty_tier || existingCustomer.loyaltyTier,
              totalSpent: crmCustomer.total_spent || existingCustomer.totalSpent,
              syncState: 'SYNCED',
              lastSyncedAt: new Date()
            }
          });
          console.log(`[CRM SYNC] Updated customer: ${existingCustomer.id}`);
        } else {
          // Create new customer from CRM
          await prisma.customer.create({
            data: {
              businessId,
              externalId: crmCustomer.id,
              firstName: crmCustomer.first_name,
              lastName: crmCustomer.last_name,
              email: crmCustomer.email || null,
              phone: crmCustomer.phone || null,
              loyaltyPoints: crmCustomer.loyalty_points || 0,
              loyaltyTier: crmCustomer.loyalty_tier || 'BRONZE',
              totalSpent: crmCustomer.total_spent || 0,
              visitCount: crmCustomer.visit_count || 0,
              customerSource: 'CRM',
              syncState: 'SYNCED',
              lastSyncedAt: new Date(),
              isActive: true,
              isAnonymous: false
            }
          });
          console.log(`[CRM SYNC] Created customer from CRM: ${crmCustomer.id}`);
        }

        synced++;
      } catch (error) {
        console.error(`[CRM SYNC] Error syncing customer ${crmCustomer.id}:`, error.message);
        errors++;
      }
    }

    // Log sync result
    await prisma.syncLog.create({
      data: {
        businessId,
        syncType: 'CRM_TO_POS',
        entityType: 'customer',
        status: errors > 0 ? 'PARTIAL' : 'SUCCESS',
        recordsProcessed: customers.length,
        recordsSynced: synced,
        recordsFailed: errors,
        errorMessage: errors > 0 ? `${errors} customers failed to sync` : null
      }
    });

    console.log(`[CRM SYNC] Completed: ${synced} synced, ${errors} errors`);

    return { synced, errors };

  } catch (error) {
    console.error(`[CRM SYNC] Failed for business ${businessId}:`, error);
    
    // Log failed sync
    await prisma.syncLog.create({
      data: {
        businessId,
        syncType: 'CRM_TO_POS',
        entityType: 'customer',
        status: 'FAILED',
        recordsProcessed: 0,
        recordsSynced: 0,
        recordsFailed: 0,
        errorMessage: error.message
      }
    });

    return { synced: 0, errors: 1 };
  }
}

/**
 * Run sync for all active businesses
 */
async function runScheduledSync() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  CRM → POS SCHEDULED SYNC - STARTING      ║');
  console.log('╚═══════════════════════════════════════════╝');
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

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  CRM → POS SCHEDULED SYNC - COMPLETED     ║');
    console.log('╚═══════════════════════════════════════════╝');
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
