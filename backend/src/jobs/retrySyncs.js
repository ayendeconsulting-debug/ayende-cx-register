/**
 * Retry Failed Syncs Job
 * Manually retry all failed sync items
 * 
 * Run with: npm run job:retry-syncs
 * or: node src/jobs/retrySyncs.js
 */

import syncQueueService from '../services/syncQueueService.js';
import { syncTransactionToCRM, syncCustomerToCRM } from '../services/crmSyncService.js';

/**
 * Process a failed item
 * @param {Object} queueItem - Queue item from database
 * @returns {Promise<boolean>} Success status
 */
const processFailedItem = async (queueItem) => {
  console.log(`[RETRY] Processing ${queueItem.entityType} ${queueItem.entityId}`);
  console.log(`  - Failed ${queueItem.retryCount} times`);
  console.log(`  - Last error: ${queueItem.error}`);

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
        console.warn(`[RETRY] Unknown entity type: ${queueItem.entityType}`);
        return false;
    }

    if (success) {
      // Mark as success
      await syncQueueService.markAsSuccess(queueItem.id);
      console.log(`[RETRY] ✓ Successfully synced ${queueItem.entityType} ${queueItem.entityId}`);
      return true;
    } else {
      throw new Error('Sync function returned false');
    }
  } catch (error) {
    console.error(
      `[RETRY] ✗ Failed to sync ${queueItem.entityType} ${queueItem.entityId}:`,
      error.message
    );

    // Mark as failed again
    await syncQueueService.markAsFailed(queueItem.id, error.message);
    return false;
  }
};

/**
 * Main retry logic
 */
const retryFailedSyncs = async () => {
  console.log('='.repeat(60));
  console.log('RETRY FAILED SYNCS JOB');
  console.log('='.repeat(60));

  try {
    // Get queue statistics
    const stats = await syncQueueService.getQueueStats();
    console.log('\nQueue Statistics:');
    console.log(`  Pending: ${stats.pending}`);
    console.log(`  Processing: ${stats.processing}`);
    console.log(`  Retry: ${stats.retry}`);
    console.log(`  Failed: ${stats.failed}`);
    console.log(`  Total: ${stats.total}`);

    if (stats.failed === 0) {
      console.log('\n✓ No failed items to retry');
      process.exit(0);
    }

    console.log(`\n→ Found ${stats.failed} failed items`);
    console.log('Starting retry process...\n');

    // Get all failed items (no limit)
    const failedItems = await syncQueueService.getPendingItems(1000);
    const actualFailed = failedItems.filter(item => item.status === 'FAILED');

    if (actualFailed.length === 0) {
      console.log('✓ No failed items found in pending queue');
      process.exit(0);
    }

    let successCount = 0;
    let failCount = 0;

    // Process each failed item
    for (let i = 0; i < actualFailed.length; i++) {
      const item = actualFailed[i];
      console.log(`\n[${i + 1}/${actualFailed.length}] Processing...`);

      const success = await processFailedItem(item);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Delay between items
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('RETRY JOB COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total Processed: ${actualFailed.length}`);
    console.log(`✓ Succeeded: ${successCount}`);
    console.log(`✗ Failed: ${failCount}`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error during retry job:', error);
    process.exit(1);
  }
};

// Run the job
retryFailedSyncs();
