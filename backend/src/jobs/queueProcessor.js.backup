/**
 * Queue Processor with Customer-First Logic
 * 
 * FIXES:
 * - Ensures customers are synced to CRM before their transactions
 * - Automatically adds missing customers to queue when processing transactions
 * - Processes in correct order: CUSTOMER → TRANSACTION
 * 
 * This prevents "Customer not found" errors in CRM
 */

import prisma from '../config/database.js';
import { syncTransactionToCRM, syncCustomerToCRM } from '../services/crmSyncService.js';

/**
 * Get customer for a transaction
 */
async function getTransactionCustomer(transactionId) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      customer: {
        select: {
          id: true,
          isAnonymous: true,
          externalId: true,
          syncState: true,
        }
      }
    }
  });
  
  return transaction?.customer;
}

/**
 * Check if customer is synced to CRM
 */
function isCustomerSynced(customer) {
  // Customer is synced if:
  // 1. Has externalId (CRM customer ID)
  // 2. syncState is 'SYNCED'
  return customer?.externalId && customer?.syncState === 'SYNCED';
}

/**
 * Add customer to sync queue with high priority
 */
async function addCustomerToQueue(customerId, businessId) {
  try {
    // Check if customer already in queue
    const existing = await prisma.syncQueue.findFirst({
      where: {
        entityType: 'customer',
        entityId: customerId,
        status: { in: ['PENDING', 'PROCESSING', 'RETRY'] }
      }
    });

    if (existing) {
      console.log(`[QUEUE] Customer ${customerId} already in queue`);
      return existing;
    }

    // Add customer to queue with HIGH priority
    const queueItem = await prisma.syncQueue.create({
      data: {
        businessId,
        entityType: 'customer',
        entityId: customerId,
        operation: 'CREATE',
        priority: 'HIGH',
        status: 'PENDING',
        retryCount: 0,
      }
    });

    console.log(`[QUEUE] Added customer ${customerId} to sync queue (HIGH priority)`);
    return queueItem;
    
  } catch (error) {
    console.error(`[QUEUE] Error adding customer to queue:`, error);
    throw error;
  }
}

/**
 * Process a single queue item
 */
async function processQueueItem(item) {
  console.log(`[QUEUE] Processing ${item.entityType}: ${item.entityId}`);

  try {
    // Update status to PROCESSING
    await prisma.syncQueue.update({
      where: { id: item.id },
      data: { status: 'PROCESSING' }
    });

    let success = false;

    // Handle TRANSACTION sync
    if (item.entityType === 'transaction') {
      // Check if customer is synced first
      const customer = await getTransactionCustomer(item.entityId);
      
      if (!customer) {
        throw new Error('Transaction customer not found');
      }

      // Skip anonymous customers
      if (customer.isAnonymous) {
        console.log(`[QUEUE] Skipping anonymous customer transaction`);
        await prisma.syncQueue.update({
          where: { id: item.id },
          data: { 
            status: 'SUCCESS',
            processedAt: new Date(),
            error: 'Anonymous customer - skipped'
          }
        });
        return true;
      }

      // Check if customer is synced to CRM
      if (!isCustomerSynced(customer)) {
        console.log(`[QUEUE] Customer ${customer.id} not synced yet - adding to queue`);
        
        // Add customer to queue with HIGH priority
        await addCustomerToQueue(customer.id, item.businessId);
        
        // Reschedule this transaction for later (after customer syncs)
        await prisma.syncQueue.update({
          where: { id: item.id },
          data: {
            status: 'RETRY',
            scheduledFor: new Date(Date.now() + 30000), // Retry in 30 seconds
            error: 'Customer not synced yet - will retry after customer sync'
          }
        });
        
        console.log(`[QUEUE] Transaction ${item.entityId} rescheduled - waiting for customer sync`);
        return false; // Will retry later
      }

      // Customer is synced, proceed with transaction sync
      success = await syncTransactionToCRM(item.entityId);
    }
    
    // Handle CUSTOMER sync
    else if (item.entityType === 'customer') {
      success = await syncCustomerToCRM(item.entityId);
    }
    
    else {
      throw new Error(`Unknown entity type: ${item.entityType}`);
    }

    // Update queue item based on result
    if (success) {
      await prisma.syncQueue.update({
        where: { id: item.id },
        data: {
          status: 'SUCCESS',
          processedAt: new Date(),
          error: null
        }
      });
      console.log(`[QUEUE] ✅ ${item.entityType} ${item.entityId} synced successfully`);
      return true;
    } else {
      throw new Error('Sync returned false');
    }

  } catch (error) {
    console.error(`[QUEUE] ❌ Error processing ${item.entityType} ${item.entityId}:`, error.message);

    // Increment retry count
    const newRetryCount = item.retryCount + 1;
    const maxRetries = 3;

    if (newRetryCount >= maxRetries) {
      // Max retries reached - mark as FAILED
      await prisma.syncQueue.update({
        where: { id: item.id },
        data: {
          status: 'FAILED',
          retryCount: newRetryCount,
          error: error.message
        }
      });
      console.error(`[QUEUE] Max retries reached for ${item.entityType} ${item.entityId}`);
    } else {
      // Schedule for retry with exponential backoff
      const retryDelay = Math.pow(2, newRetryCount) * 60000; // 2min, 4min, 8min
      const scheduledFor = new Date(Date.now() + retryDelay);
      
      await prisma.syncQueue.update({
        where: { id: item.id },
        data: {
          status: 'RETRY',
          retryCount: newRetryCount,
          scheduledFor,
          error: error.message
        }
      });
      console.log(`[QUEUE] Scheduled retry ${newRetryCount}/${maxRetries} for ${item.entityType} ${item.entityId}`);
    }

    return false;
  }
}

/**
 * Process all pending items in priority order
 */
export async function processQueue() {
  try {
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  SYNC QUEUE PROCESSOR - STARTING (V2)    ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    // Reset stuck items (items in PROCESSING for more than 5 minutes)
    const stuckThreshold = new Date(Date.now() - 5 * 60 * 1000);
    const resetResult = await prisma.syncQueue.updateMany({
      where: {
        status: 'PROCESSING',
        updatedAt: { lt: stuckThreshold }
      },
      data: {
        status: 'RETRY',
        scheduledFor: new Date()
      }
    });
    
    if (resetResult.count > 0) {
      console.log(`[QUEUE] Reset ${resetResult.count} stuck items`);
    }

    // Get queue statistics
    const stats = await prisma.syncQueue.groupBy({
      by: ['status'],
      _count: true
    });

    const statsSummary = {
      pending: 0,
      processing: 0,
      retry: 0,
      failed: 0,
      success: 0,
      total: 0
    };

    stats.forEach(stat => {
      statsSummary[stat.status.toLowerCase()] = stat._count;
      statsSummary.total += stat._count;
    });

    console.log('[QUEUE STATS]');
    console.log(`  Pending: ${statsSummary.pending}`);
    console.log(`  Processing: ${statsSummary.processing}`);
    console.log(`  Retry: ${statsSummary.retry}`);
    console.log(`  Failed: ${statsSummary.failed}`);
    console.log(`  Total: ${statsSummary.total}\n`);

    // Process items in priority order:
    // 1. HIGH priority CUSTOMERS (must sync before transactions)
    // 2. HIGH priority items (other)
    // 3. NORMAL priority items
    // 4. RETRY items that are scheduled
    // 5. LOW priority items

    const itemsToProcess = await prisma.syncQueue.findMany({
      where: {
        status: { in: ['PENDING', 'RETRY'] },
        scheduledFor: { lte: new Date() }
      },
      orderBy: [
        { priority: 'desc' },
        { entityType: 'asc' }, // CUSTOMER before TRANSACTION
        { createdAt: 'asc' }
      ],
      take: 50 // Process in batches
    });

    console.log(`[QUEUE] Processing ${itemsToProcess.length} items\n`);

    let processed = 0;
    let successful = 0;
    let failed = 0;

    for (const item of itemsToProcess) {
      const result = await processQueueItem(item);
      processed++;
      if (result) successful++;
      else failed++;
    }

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  SYNC QUEUE PROCESSOR - COMPLETED        ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    console.log('[PROCESSING SUMMARY]');
    console.log(`  Total Processed: ${processed}`);
    console.log(`  Successful: ${successful}`);
    console.log(`  Failed/Retry: ${failed}\n`);

    return { processed, successful, failed };

  } catch (error) {
    console.error('[QUEUE] Fatal error in queue processor:', error);
    throw error;
  }
}

/**
 * Initialize queue processor (called from worker.js)
 */
export function initializeQueueProcessor() {
  console.log('[QUEUE] Queue processor initialized with customer-first logic');
  
  // Run immediately
  processQueue().catch(err => {
    console.error('[QUEUE] Error in initial queue processing:', err);
  });

  // Schedule to run every 60 seconds
  setInterval(() => {
    processQueue().catch(err => {
      console.error('[QUEUE] Error in queue processing:', err);
    });
  }, 60000);

  console.log('[QUEUE] Queue processor running every 60 seconds');
}

export default {
  processQueue,
  initializeQueueProcessor
};
// Redeployed: 2025-11-04 22:38:25

// Initialize and start the queue processor
initializeQueueProcessor();
