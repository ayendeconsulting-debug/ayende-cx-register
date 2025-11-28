/**
 * Sync Queue Processor
 * Processes items in the sync queue and sends them to CRM
 * 
 * Phase 2D: Batch processor for scheduled sync
 * UPDATED: Added rental entity type support
 */

import prisma from '../config/database.js';
import * as syncQueueService from './syncQueueService.js';
import * as crmIntegrationService from './crmIntegrationService.js';

console.log('[SYNC PROCESSOR] syncQueueProcessor.js module loaded at:', new Date().toISOString());

// Configuration
const BATCH_SIZE = parseInt(process.env.SYNC_BATCH_SIZE || '100');
const MAX_RETRY_ATTEMPTS = parseInt(process.env.SYNC_RETRY_ATTEMPTS || '3');

console.log('[SYNC PROCESSOR] Configuration loaded:', { BATCH_SIZE, MAX_RETRY_ATTEMPTS });

/**
 * Process a single queue item
 * @param {Object} queueItem - Queue item from database
 * @returns {Object} Processing result
 */
const processQueueItem = async (queueItem) => {
  const { id, entityType, entityId, operation, businessId } = queueItem;

  console.log(`[QUEUE PROCESSOR] Processing ${entityType} ${entityId} (${operation})`);

  try {
    // Mark as processing
    await syncQueueService.markAsProcessing(id);

    // Fetch entity data based on type
    let entity = null;
    let syncResult = null;

    switch (entityType) {
      case 'transaction':
        entity = await prisma.transaction.findUnique({
          where: { id: entityId },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            customer: true,
            business: true,
          },
        });

        if (!entity) {
          throw new Error(`Transaction not found: ${entityId}`);
        }

        // Skip anonymous customers
        if (entity.customer?.isAnonymous) {
          console.log(`[QUEUE PROCESSOR] Skipping anonymous transaction: ${entityId}`);
          await syncQueueService.markAsSuccess(id);
          return { success: true, skipped: true };
        }

        // Sync to CRM
        syncResult = await crmIntegrationService.syncTransactionToCRM(entity);
        break;

      case 'customer':
        entity = await prisma.customer.findUnique({
          where: { id: entityId },
          include: {
            business: true,
          },
        });

        if (!entity) {
          throw new Error(`Customer not found: ${entityId}`);
        }

        // Skip anonymous customers
        if (entity.isAnonymous) {
          console.log(`[QUEUE PROCESSOR] Skipping anonymous customer: ${entityId}`);
          await syncQueueService.markAsSuccess(id);
          return { success: true, skipped: true };
        }

        // Sync to CRM
        syncResult = await crmIntegrationService.syncCustomerToCRM(entity, operation.toLowerCase());
        break;

      case 'rental':
        // NEW: Handle rental contract sync
        entity = await prisma.rentalContract.findUnique({
          where: { id: entityId },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            customer: true,
            business: true,
            transaction: true,
          },
        });

        if (!entity) {
          throw new Error(`Rental contract not found: ${entityId}`);
        }

        // Sync to CRM
        syncResult = await crmIntegrationService.syncRentalToCRM(entity, operation.toLowerCase());
        break;

      case 'product':
        // Future: Product sync to CRM
        console.log(`[QUEUE PROCESSOR] Product sync not yet implemented: ${entityId}`);
        await syncQueueService.markAsSuccess(id);
        return { success: true, skipped: true };

      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    // Mark as success
    await syncQueueService.markAsSuccess(id);
    
    console.log(`[QUEUE PROCESSOR] Successfully processed ${entityType} ${entityId}`);
    return { success: true, entityType, entityId };

  } catch (error) {
    console.error(`[QUEUE PROCESSOR ERROR] Failed to process ${entityType} ${entityId}:`, error);

    // Determine if we should retry based on error type
    const shouldRetry = !isNonRetryableError(error);

    // Mark as failed
    await syncQueueService.markAsFailed(id, error.message, shouldRetry);

    return {
      success: false,
      entityType,
      entityId,
      error: error.message,
      willRetry: shouldRetry,
    };
  }
};

/**
 * Check if error is non-retryable (entity deleted, invalid data, etc.)
 * @param {Error} error - Error object
 * @returns {boolean} True if error should not be retried
 */
const isNonRetryableError = (error) => {
  const nonRetryableMessages = [
    'not found',
    'does not exist',
    'invalid data',
    'validation failed',
    'duplicate',
  ];

  const errorMessage = error.message.toLowerCase();
  return nonRetryableMessages.some(msg => errorMessage.includes(msg));
};

/**
 * Process pending items in the queue
 * Called by cron job every 5 minutes
 */
export const processPendingQueue = async () => {
  const startTime = Date.now();
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  SYNC QUEUE PROCESSOR - STARTING          ║');
  console.log('╚═══════════════════════════════════════════╝');

  try {
    // Reset any stuck items first
    await syncQueueService.resetStuckItems(30);

    // Get queue stats before processing
    const statsBefore = await syncQueueService.getQueueStats();
    console.log('\n[QUEUE STATS - BEFORE]');
    console.log(`  Pending: ${statsBefore.pending}`);
    console.log(`  Processing: ${statsBefore.processing}`);
    console.log(`  Retry: ${statsBefore.retry}`);
    console.log(`  Failed: ${statsBefore.failed}`);
    console.log(`  Total: ${statsBefore.total}`);

    // Process HIGH priority first
    console.log('\n[PROCESSING HIGH PRIORITY ITEMS]');
    const highPriorityItems = await syncQueueService.getPendingItems(BATCH_SIZE, 'HIGH');
    console.log(`  Fetched ${highPriorityItems.length} HIGH priority items`);
    const highResults = await processItems(highPriorityItems);

    // Process NORMAL priority
    console.log('\n[PROCESSING NORMAL PRIORITY ITEMS]');
    const normalPriorityItems = await syncQueueService.getPendingItems(BATCH_SIZE, 'NORMAL');
    console.log(`  Fetched ${normalPriorityItems.length} NORMAL priority items`);
    const normalResults = await processItems(normalPriorityItems);

    // Process LOW priority (if time permits)
    console.log('\n[PROCESSING LOW PRIORITY ITEMS]');
    const lowPriorityItems = await syncQueueService.getPendingItems(BATCH_SIZE / 2, 'LOW');
    console.log(`  Fetched ${lowPriorityItems.length} LOW priority items`);
    const lowResults = await processItems(lowPriorityItems);

    // Process RETRY items
    console.log('\n[PROCESSING RETRY ITEMS]');
    const retryItems = await syncQueueService.getRetryItems(50);
    console.log(`  Fetched ${retryItems.length} RETRY items`);
    const retryResults = await processItems(retryItems);

    // Combine results
    const allResults = [
      ...highResults,
      ...normalResults,
      ...lowResults,
      ...retryResults,
    ];

    const successCount = allResults.filter(r => r.success).length;
    const failureCount = allResults.filter(r => !r.success).length;
    const skippedCount = allResults.filter(r => r.skipped).length;

    // Get queue stats after processing
    const statsAfter = await syncQueueService.getQueueStats();
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // Log summary
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  SYNC QUEUE PROCESSOR - COMPLETED         ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log('\n[PROCESSING SUMMARY]');
    console.log(`  Total Processed: ${allResults.length}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${failureCount}`);
    console.log(`  Skipped: ${skippedCount}`);
    console.log(`  Processing Time: ${processingTime}s`);

    console.log('\n[QUEUE STATS - AFTER]');
    console.log(`  Pending: ${statsAfter.pending}`);
    console.log(`  Processing: ${statsAfter.processing}`);
    console.log(`  Retry: ${statsAfter.retry}`);
    console.log(`  Failed: ${statsAfter.failed}`);
    console.log(`  Total: ${statsAfter.total}`);

    console.log('\n═════════════════════════════════════════\n');

    // Cleanup old SUCCESS items (keep last 7 days)
    if (Math.random() < 0.1) { // 10% chance to run cleanup
      console.log('[CLEANUP] Running periodic cleanup...');
      await syncQueueService.cleanupOldItems(7);
    }

    return {
      success: true,
      processed: allResults.length,
      successful: successCount,
      failed: failureCount,
      skipped: skippedCount,
      processingTime: parseFloat(processingTime),
      queueStats: statsAfter,
    };

  } catch (error) {
    console.error('[QUEUE PROCESSOR ERROR] Fatal error during processing:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Sort queue items to ensure proper dependency order:
 * 1. Customers first (required for transactions and rentals)
 * 2. Transactions second
 * 3. Rentals third (may reference transactions)
 * 4. Others last
 * 
 * @param {Array} items - Queue items to sort
 * @returns {Array} Sorted items
 */
const sortItemsByDependency = (items) => {
  // Separate by entity type
  const customers = items.filter(item => item.entityType === 'customer');
  const transactions = items.filter(item => item.entityType === 'transaction');
  const rentals = items.filter(item => item.entityType === 'rental');
  const others = items.filter(item => 
    !['customer', 'transaction', 'rental'].includes(item.entityType)
  );
  
  console.log(`  Sort breakdown: ${customers.length} customers, ${transactions.length} transactions, ${rentals.length} rentals, ${others.length} others`);
  
  // Return in dependency order
  return [...customers, ...transactions, ...rentals, ...others];
};

/**
 * Process array of queue items
 * @param {Array} items - Queue items to process
 * @returns {Array} Processing results
 */
const processItems = async (items) => {
  if (items.length === 0) {
    console.log('  No items to process');
    return [];
  }

  // Sort items to ensure customers are processed before transactions/rentals
  const sortedItems = sortItemsByDependency(items);
  
  console.log(`  Processing ${sortedItems.length} items...`);
  
  // Log breakdown by entity type
  const customerCount = sortedItems.filter(i => i.entityType === 'customer').length;
  const transactionCount = sortedItems.filter(i => i.entityType === 'transaction').length;
  const rentalCount = sortedItems.filter(i => i.entityType === 'rental').length;
  
  if (customerCount > 0) {
    console.log(`    - ${customerCount} customers (processed first)`);
  }
  if (transactionCount > 0) {
    console.log(`    - ${transactionCount} transactions`);
  }
  if (rentalCount > 0) {
    console.log(`    - ${rentalCount} rentals`);
  }

  const results = [];

  // Process items sequentially to avoid overwhelming CRM
  for (const item of sortedItems) {
    try {
      const result = await processQueueItem(item);
      results.push(result);

      // Small delay between items to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  Error processing item ${item.id}:`, error);
      results.push({
        success: false,
        entityType: item.entityType,
        entityId: item.entityId,
        error: error.message,
      });
    }
  }

  const successful = results.filter(r => r.success).length;
  console.log(`  Completed: ${successful}/${items.length} successful`);

  return results;
};

/**
 * Process specific entity immediately (bypass queue)
 * Used for urgent syncs
 */
export const processEntityImmediately = async (entityType, entityId, businessId) => {
  console.log(`[QUEUE PROCESSOR] Immediate processing: ${entityType} ${entityId}`);

  try {
    let entity = null;

    switch (entityType) {
      case 'transaction':
        entity = await prisma.transaction.findUnique({
          where: { id: entityId },
          include: {
            items: { include: { product: true } },
            customer: true,
            business: true,
          },
        });

        if (entity && !entity.customer?.isAnonymous) {
          await crmIntegrationService.syncTransactionToCRM(entity);
        }
        break;

      case 'customer':
        entity = await prisma.customer.findUnique({
          where: { id: entityId },
          include: {
            business: true,
          },
        });

        if (entity && !entity.isAnonymous) {
          await crmIntegrationService.syncCustomerToCRM(entity);
        }
        break;

      case 'rental':
        // NEW: Handle immediate rental sync
        entity = await prisma.rentalContract.findUnique({
          where: { id: entityId },
          include: {
            items: { include: { product: true } },
            customer: true,
            business: true,
            transaction: true,
          },
        });

        if (entity) {
          await crmIntegrationService.syncRentalToCRM(entity);
        }
        break;

      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    return { success: true };
  } catch (error) {
    console.error(`[QUEUE PROCESSOR] Immediate processing failed:`, error);
    throw error;
  }
};

/**
 * Get processor status and statistics
 */
export const getProcessorStatus = async () => {
  try {
    const stats = await syncQueueService.getQueueStats();
    const crmHealth = await crmIntegrationService.checkCRMHealth(
      process.env.BUSINESS_ID || 'default'
    );

    return {
      queue: stats,
      crm: crmHealth,
      config: {
        batchSize: BATCH_SIZE,
        maxRetries: MAX_RETRY_ATTEMPTS,
        syncInterval: process.env.SYNC_INTERVAL_MINUTES || '5',
      },
    };
  } catch (error) {
    console.error('[QUEUE PROCESSOR] Failed to get status:', error);
    throw error;
  }
};

console.log('[SYNC PROCESSOR] All functions defined, exports ready');

export default {
  processPendingQueue,
  processEntityImmediately,
  getProcessorStatus,
};