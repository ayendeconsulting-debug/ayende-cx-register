/**
 * Retry Failed Sync Items
 * This script retries all failed items in the sync queue now that JWT auth is fixed
 * 
 * Usage: node retry-failed-items.js
 */

import prisma from './src/config/database.js';

async function retryFailedItems() {
  console.log('='.repeat(70));
  console.log('RETRYING FAILED SYNC QUEUE ITEMS');
  console.log('='.repeat(70));
  console.log();

  try {
    // Get all failed items
    const failedItems = await prisma.syncQueue.findMany({
      where: {
        status: 'FAILED'
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`Found ${failedItems.length} failed items to retry`);
    console.log();

    if (failedItems.length === 0) {
      console.log('✅ No failed items to retry!');
      return;
    }

    // Display failed items
    console.log('Failed Items:');
    console.log('-'.repeat(70));
    for (const item of failedItems) {
      console.log(`ID: ${item.id}`);
      console.log(`Type: ${item.entityType}`);
      console.log(`Entity ID: ${item.entityId}`);
      console.log(`Failed At: ${item.updatedAt}`);
      console.log(`Error: ${item.error || 'Unknown error'}`);
      console.log(`Retry Count: ${item.retryCount}`);
      console.log('-'.repeat(70));
    }
    console.log();

    // Ask for confirmation
    console.log('These items will be reset to PENDING status for retry.');
    console.log('The worker will pick them up in the next cycle (within 60 seconds).');
    console.log();

    // Reset failed items to PENDING
    const result = await prisma.syncQueue.updateMany({
      where: {
        status: 'FAILED'
      },
      data: {
        status: 'PENDING',
        error: null,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Successfully reset ${result.count} items to PENDING status`);
    console.log();
    console.log('Next Steps:');
    console.log('1. The worker will pick up these items in the next cycle');
    console.log('2. Watch worker logs: railway logs --service ayende-cx-worker --follow');
    console.log('3. Check if sync succeeds with new JWT authentication');
    console.log();

  } catch (error) {
    console.error('❌ Error retrying failed items:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
retryFailedItems();
