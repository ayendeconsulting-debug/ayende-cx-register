/**
 * Loyalty Reconciliation Cron Job
 * PHASE 2E: Daily reconciliation scheduler
 * 
 * Location: src/cron/reconciliationJob.js
 */

import cron from 'node-cron';
import { reconcileAllCustomers, getReconciliationSummary } from '../services/loyaltyReconciliationService.js';
import prisma from '../config/database.js';

/**
 * Initialize reconciliation cron job
 * Runs daily at 2:00 AM
 */
export const initializeReconciliationJob = () => {
  console.log('[RECONCILIATION CRON] Initializing loyalty reconciliation job');

  // Run daily at 2:00 AM (when system load is typically low)
  // Cron format: '0 2 * * *' = At 02:00 every day
  const schedule = process.env.RECONCILIATION_SCHEDULE || '0 2 * * *';
  
  cron.schedule(schedule, async () => {
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  LOYALTY RECONCILIATION - SCHEDULED RUN   ║');
    console.log('╚═══════════════════════════════════════════╝\n');
    console.log(`[RECONCILIATION CRON] Starting at ${new Date().toISOString()}`);

    try {
      // Get all active businesses
      const businesses = await prisma.business.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          businessName: true,
          externalTenantId: true,
        },
      });

      console.log(`[RECONCILIATION CRON] Found ${businesses.length} active businesses\n`);

      const allResults = {
        totalBusinesses: businesses.length,
        successfulBusinesses: 0,
        failedBusinesses: 0,
        totalCustomers: 0,
        totalMatched: 0,
        totalAutoSynced: 0,
        totalManualReview: 0,
        totalFailed: 0,
        errors: [],
      };

      // Process each business
      for (const business of businesses) {
        console.log(`\n[RECONCILIATION CRON] Processing: ${business.businessName}`);
        console.log('─'.repeat(50));

        try {
          // Run reconciliation for this business
          const results = await reconcileAllCustomers(business.id);

          // Aggregate results
          allResults.successfulBusinesses++;
          allResults.totalCustomers += results.totalCustomers;
          allResults.totalMatched += results.matched;
          allResults.totalAutoSynced += results.autoSynced;
          allResults.totalManualReview += results.manualReview;
          allResults.totalFailed += results.failed;

          if (results.errors.length > 0) {
            allResults.errors.push({
              business: business.businessName,
              errors: results.errors,
            });
          }

          // Log business summary
          console.log(`[RECONCILIATION CRON] ${business.businessName} Summary:`);
          console.log(`  ✓ Processed: ${results.processed}/${results.totalCustomers}`);
          console.log(`  ✓ Matched: ${results.matched}`);
          console.log(`  ✓ Auto-Synced: ${results.autoSynced}`);
          if (results.manualReview > 0) {
            console.log(`  ⚠ Manual Review: ${results.manualReview}`);
          }
          if (results.failed > 0) {
            console.log(`  ✗ Failed: ${results.failed}`);
          }

        } catch (error) {
          allResults.failedBusinesses++;
          allResults.errors.push({
            business: business.businessName,
            error: error.message,
          });
          console.error(`[RECONCILIATION CRON] Error processing ${business.businessName}:`, error.message);
        }
      }

      // Final summary
      console.log('\n╔═══════════════════════════════════════════╗');
      console.log('║  RECONCILIATION SUMMARY - ALL BUSINESSES   ║');
      console.log('╚═══════════════════════════════════════════╝\n');
      console.log(`Total Businesses: ${allResults.totalBusinesses}`);
      console.log(`  ✓ Successful: ${allResults.successfulBusinesses}`);
      if (allResults.failedBusinesses > 0) {
        console.log(`  ✗ Failed: ${allResults.failedBusinesses}`);
      }
      console.log(`\nTotal Customers: ${allResults.totalCustomers}`);
      console.log(`  ✓ Matched: ${allResults.totalMatched}`);
      console.log(`  ✓ Auto-Synced: ${allResults.totalAutoSynced}`);
      if (allResults.totalManualReview > 0) {
        console.log(`  ⚠ Manual Review Needed: ${allResults.totalManualReview}`);
      }
      if (allResults.totalFailed > 0) {
        console.log(`  ✗ Failed: ${allResults.totalFailed}`);
      }

      if (allResults.errors.length > 0) {
        console.log('\n[RECONCILIATION CRON] Errors encountered:');
        allResults.errors.forEach((err, idx) => {
          console.log(`  ${idx + 1}. ${err.business}: ${err.error || 'Multiple errors'}`);
        });
      }

      console.log(`\n[RECONCILIATION CRON] Completed at ${new Date().toISOString()}`);
      console.log('═'.repeat(50) + '\n');

    } catch (error) {
      console.error('[RECONCILIATION CRON] Fatal error in reconciliation job:', error);
    }
  });

  // Log next run time
  const nextRun = getNextRunTime(schedule);
  console.log(`[RECONCILIATION CRON] Loyalty reconciliation job initialized successfully`);
  console.log(`[RECONCILIATION CRON] Schedule: ${schedule} (Daily at 2:00 AM)`);
  console.log(`[RECONCILIATION CRON] Next run: ${nextRun}\n`);
};

/**
 * Manual trigger for reconciliation (useful for testing)
 * @param {string} businessId - Optional specific business ID
 */
export const triggerReconciliation = async (businessId = null) => {
  console.log('[RECONCILIATION] Manual trigger initiated');

  try {
    if (businessId) {
      // Reconcile specific business
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { businessName: true },
      });

      if (!business) {
        throw new Error(`Business not found: ${businessId}`);
      }

      console.log(`[RECONCILIATION] Processing business: ${business.businessName}`);
      const results = await reconcileAllCustomers(businessId);
      
      console.log('[RECONCILIATION] Manual reconciliation complete');
      return results;
    } else {
      // Reconcile all businesses
      const businesses = await prisma.business.findMany({
        where: { isActive: true },
        select: { id: true, businessName: true },
      });

      console.log(`[RECONCILIATION] Processing ${businesses.length} businesses`);
      
      const allResults = [];
      for (const business of businesses) {
        const results = await reconcileAllCustomers(business.id);
        allResults.push({
          businessId: business.id,
          businessName: business.businessName,
          results,
        });
      }

      console.log('[RECONCILIATION] Manual reconciliation complete for all businesses');
      return allResults;
    }
  } catch (error) {
    console.error('[RECONCILIATION] Error in manual trigger:', error);
    throw error;
  }
};

/**
 * Calculate next run time for cron schedule
 * @param {string} schedule - Cron schedule string
 * @returns {string} Next run time
 */
const getNextRunTime = (schedule) => {
  try {
    // For daily at 2 AM schedule
    if (schedule === '0 2 * * *') {
      const now = new Date();
      const next = new Date();
      next.setHours(2, 0, 0, 0);
      
      // If 2 AM today has passed, set to tomorrow
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      
      return next.toLocaleString();
    }
    
    return 'See cron schedule: ' + schedule;
  } catch (error) {
    return 'Unable to calculate';
  }
};

export default {
  initializeReconciliationJob,
  triggerReconciliation,
};
