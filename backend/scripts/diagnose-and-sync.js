// Diagnose Queue Issues and Bulk Sync Customers
// This script will:
// 1. Show failed queue items
// 2. Show customer sync state
// 3. Add all unsynced customers to queue
// 
// Deploy this file to backend/scripts/ and run via Railway

import prisma from '../src/config/database.js';

async function main() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  DIAGNOSE QUEUE & BULK SYNC CUSTOMERS                ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    
    // STEP 1: Show Failed Items
    console.log('STEP 1: Checking Failed Queue Items...\n');
    const failedItems = await prisma.syncQueue.findMany({
      where: { status: 'FAILED' },
      select: {
        id: true,
        entityType: true,
        entityId: true,
        error: true,
        retryCount: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (failedItems.length === 0) {
      console.log('  ✅ No failed items\n');
    } else {
      console.log(`  ❌ Found ${failedItems.length} failed items:\n`);
      failedItems.forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.entityType}: ${item.entityId}`);
        console.log(`     Error: ${item.error}`);
        console.log(`     Retries: ${item.retryCount}`);
        console.log(`     Created: ${item.createdAt}\n`);
      });
    }
    
    // STEP 2: Show Customer Sync State
    console.log('STEP 2: Checking Customer Sync State...\n');
    const customers = await prisma.customer.findMany({
      where: { isAnonymous: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        externalId: true,
        syncState: true,
        loyaltyPoints: true,
        totalSpent: true
      },
      orderBy: { totalSpent: 'desc' }
    });
    
    const unsyncedCustomers = customers.filter(c => !c.externalId);
    const syncedCustomers = customers.filter(c => c.externalId);
    
    console.log(`  Total Customers: ${customers.length}`);
    console.log(`  ✅ Synced: ${syncedCustomers.length}`);
    console.log(`  ❌ Not Synced: ${unsyncedCustomers.length}\n`);
    
    if (unsyncedCustomers.length > 0) {
      console.log('  Unsynced Customers:');
      unsyncedCustomers.slice(0, 5).forEach((c, i) => {
        console.log(`    ${i + 1}. ${c.firstName} ${c.lastName} - $${c.totalSpent} spent, ${c.loyaltyPoints} pts`);
      });
      if (unsyncedCustomers.length > 5) {
        console.log(`    ... and ${unsyncedCustomers.length - 5} more`);
      }
      console.log('');
    }
    
    // STEP 3: Get Business ID
    console.log('STEP 3: Getting Business ID...\n');
    const business = await prisma.business.findFirst({
      select: { id: true, businessName: true }
    });
    
    if (!business) {
      console.log('  ❌ No business found!\n');
      return;
    }
    
    console.log(`  Business: ${business.businessName} (${business.id})\n`);
    
    // STEP 4: Bulk Add Unsynced Customers to Queue
    if (unsyncedCustomers.length > 0) {
      console.log('STEP 4: Adding Unsynced Customers to Queue...\n');
      
      let added = 0;
      let skipped = 0;
      
      for (const customer of unsyncedCustomers) {
        // Check if already in queue
        const existing = await prisma.syncQueue.findFirst({
          where: {
            entityType: 'CUSTOMER',
            entityId: customer.id,
            status: { in: ['PENDING', 'PROCESSING', 'RETRY'] }
          }
        });
        
        if (existing) {
          skipped++;
          continue;
        }
        
        // Add to queue
        await prisma.syncQueue.create({
          data: {
            businessId: business.id,
            entityType: 'CUSTOMER',
            entityId: customer.id,
            operation: 'CREATE',
            priority: 'HIGH',
            status: 'PENDING',
            retryCount: 0
          }
        });
        
        added++;
        console.log(`  ✅ Added: ${customer.firstName} ${customer.lastName}`);
      }
      
      console.log(`\n  Summary:`);
      console.log(`    Added to queue: ${added}`);
      console.log(`    Skipped (already queued): ${skipped}`);
      console.log(`    Total processed: ${unsyncedCustomers.length}\n`);
    } else {
      console.log('STEP 4: All customers already synced! ✅\n');
    }
    
    // STEP 5: Show Updated Queue Stats
    console.log('STEP 5: Updated Queue Statistics...\n');
    const stats = await prisma.syncQueue.groupBy({
      by: ['status'],
      _count: { _all: true }
    });
    
    stats.forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count._all}`);
    });
    
    const total = stats.reduce((sum, stat) => sum + stat._count._all, 0);
    console.log(`  TOTAL: ${total}\n`);
    
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║  DIAGNOSIS COMPLETE                                  ║');
    console.log('║  Worker will process new items within 60 seconds     ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
