/**
 * Queue Processor
 * Background worker that processes the sync queue
 * Sends transactions and customers to CRM
 * 
 * Run with: node src/jobs/queueProcessor.js
 * Or in production: PM2 or Railway worker process
 */

import cron from 'node-cron';
import syncQueueService from '../services/syncQueueService.js';
import { syncTransactionToCRM, syncCustomerToCRM } from '../services/crmSyncService.js';

// Configuration from environment
const ENABLE_PROCESSOR = process.env.ENABLE_QUEUE_PROCESSOR !== 'false'; // Enabled by default
const PROCESS_INTERVAL = process.env.QUEUE_PROCESS_INTERVAL || '*/1 * * * *'; // Every minute
const BATCH_SIZE = parseInt(process.env.QUEUE_BATCH_SIZE || '10');
const ENABLE_CLEANUP = process.env.ENABLE_QUEUE_CLEANUP !== 'false'; // Enabled by default
const CLEANUP_INTERVAL = process.env.QUEUE_CLEANUP_INTERVAL || '0 2 * * *'; // 2 AM daily
const CLEANUP_DAYS = parseInt(process.env.QUEUE_CLEANUP_DAYS || '7');

/**
 * Process a single queue item
 * @param {Object} queueItem - Queue item from database
 * @returns {Promise<boolean>} Success status
 */
const processQueueItem = async (queueItem) => {
  console.log(`[QUEUE PROCESSOR] Processing ${queueItem.entityType} ${queueItem.entityId}`);

  try {
    // Mark as processing
    await syncQueueService.markAsProcessing(queueItem.id);

    let success = false;

    // Process based on entity type
    switch (queueItem.entityType.toLowerCase()) {
      case 'transaction':
        success = await syncTransactionToCRM(queueItem.entityId);
        break;

      case 'customer':
        success = await syncCustomerToCRM(queueItem.entityId);
        break;

      default:
        console.warn(`[QUEUE PROCESSOR] Unknown entity type: ${queueItem.entityType}`);
        // Mark as failed for unknown types
        await syncQueueService.markAsFailed(
          queueItem.id,
          `Unknown entity type: ${queueItem.entityType}`,
          false // Don't retry
        );
        return false;
    }

    if (success) {
      // Mark as success
      await syncQueueService.markAsSuccess(queueItem.id);
      console.log(`[QUEUE PROCESSOR] ✓ Successfully processed ${queueItem.entityType} ${queueItem.entityId}`);
      return true;
    } else {
      throw new Error('Sync function returned false');
    }
  } catch (error) {
    console.error(
      `[QUEUE PROCESSOR] ✗ Failed to process ${queueItem.entityType} ${queueItem.entityId}:`,
      error.message
    );

    // Mark as failed (will retry based on retry count)
    await syncQueueService.markAsFailed(queueItem.id, error.message);
    return false;
  }
};

/**
 * Process batch of pending items
 */
const processPendingItems = async () => {
  try {
    console.log('[QUEUE PROCESSOR] Checking for pending items...');

    // Get pending items (prioritize HIGH priority)
    const pendingItems = await syncQueueService.getPendingItems(BATCH_SIZE);

    if (pendingItems.length === 0) {
      console.log('[QUEUE PROCESSOR] No pending items');
      return;
    }

    console.log(`[QUEUE PROCESSOR] Found ${pendingItems.length} pending items`);

    // Process items sequentially (to avoid overwhelming CRM)
    let successCount = 0;
    let failCount = 0;

    for (const item of pendingItems) {
      const success = await processQueueItem(item);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Small delay between items to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(
      `[QUEUE PROCESSOR] Batch complete: ${successCount} succeeded, ${failCount} failed`
    );
  } catch (error) {
    console.error('[QUEUE PROCESSOR] Error processing batch:', error);
  }
};

/**
 * Process retry items
 */
const processRetryItems = async () => {
  try {
    console.log('[QUEUE PROCESSOR] Checking for retry items...');

    const retryItems = await syncQueueService.getRetryItems(BATCH_SIZE);

    if (retryItems.length === 0) {
      return;
    }

    console.log(`[QUEUE PROCESSOR] Found ${retryItems.length} items to retry`);

    // Process retry items
    let successCount = 0;
    let failCount = 0;

    for (const item of retryItems) {
      const success = await processQueueItem(item);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Delay between retries
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(
      `[QUEUE PROCESSOR] Retry batch complete: ${successCount} succeeded, ${failCount} failed`
    );
  } catch (error) {
    console.error('[QUEUE PROCESSOR] Error processing retries:', error);
  }
};

/**
 * Reset stuck items that have been processing too long
 */
const resetStuckItems = async () => {
  try {
    const resetCount = await syncQueueService.resetStuckItems(30); // 30 minutes
    if (resetCount > 0) {
      console.log(`[QUEUE PROCESSOR] Reset ${resetCount} stuck items`);
    }
  } catch (error) {
    console.error('[QUEUE PROCESSOR] Error resetting stuck items:', error);
  }
};

/**
 * Cleanup old completed items
 */
const cleanupOldItems = async () => {
  try {
    console.log('[QUEUE PROCESSOR] Running cleanup...');
    const deletedCount = await syncQueueService.cleanupOldItems(CLEANUP_DAYS);
    console.log(`[QUEUE PROCESSOR] Cleanup complete: ${deletedCount} items deleted`);
  } catch (error) {
    console.error('[QUEUE PROCESSOR] Error during cleanup:', error);
  }
};

/**
 * Print queue statistics
 */
const printStats = async () => {
  try {
    const stats = await syncQueueService.getQueueStats();
    console.log('[QUEUE PROCESSOR] Queue Stats:', {
      pending: stats.pending,
      processing: stats.processing,
      retry: stats.retry,
      failed: stats.failed,
      total: stats.total,
    });
  } catch (error) {
    console.error('[QUEUE PROCESSOR] Error getting stats:', error);
  }
};

/**
 * Main processing loop
 */
const processQueue = async () => {
  console.log('[QUEUE PROCESSOR] Starting processing cycle...');

  // Reset any stuck items first
  await resetStuckItems();

  // Process pending items
  await processPendingItems();

  // Process retry items
  await processRetryItems();

  // Print stats
  await printStats();

  console.log('[QUEUE PROCESSOR] Processing cycle complete\n');
};

/**
 * Start the queue processor
 */
const startProcessor = () => {
  if (!ENABLE_PROCESSOR) {
    console.log('[QUEUE PROCESSOR] Processor is disabled (ENABLE_QUEUE_PROCESSOR=false)');
    return;
  }

  console.log('='.repeat(60));
  console.log('QUEUE PROCESSOR STARTED');
  console.log('='.repeat(60));
  console.log(`Process Interval: ${PROCESS_INTERVAL}`);
  console.log(`Batch Size: ${BATCH_SIZE}`);
  console.log(`Cleanup Enabled: ${ENABLE_CLEANUP}`);
  if (ENABLE_CLEANUP) {
    console.log(`Cleanup Interval: ${CLEANUP_INTERVAL}`);
    console.log(`Cleanup Days: ${CLEANUP_DAYS}`);
  }
  console.log('='.repeat(60));

  // Schedule main processing
  cron.schedule(PROCESS_INTERVAL, async () => {
    await processQueue();
  });

  // Schedule cleanup (if enabled)
  if (ENABLE_CLEANUP) {
    cron.schedule(CLEANUP_INTERVAL, async () => {
      await cleanupOldItems();
    });
  }

  // Run once immediately on startup
  console.log('[QUEUE PROCESSOR] Running initial processing cycle...');
  processQueue();

  console.log('[QUEUE PROCESSOR] Scheduler running. Press Ctrl+C to stop.\n');
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[QUEUE PROCESSOR] Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[QUEUE PROCESSOR] Shutting down gracefully...');
  process.exit(0);
});

// Start the processor
startProcessor();
