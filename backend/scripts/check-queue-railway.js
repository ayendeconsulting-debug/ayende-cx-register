// Check Queue State - Run on Railway
// Usage: node scripts/check-queue-railway.js

import prisma from '../src/config/database.js';

async function checkQueue() {
  try {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║  SYNCQUEUE STATE CHECK (RAILWAY)     ║');
    console.log('╚═══════════════════════════════════════╝\n');
    
    // 1. Get stats by status
    console.log('Queue Statistics:');
    const stats = await prisma.syncQueue.groupBy({
      by: ['status'],
      _count: {
        _all: true
      }
    });
    
    let total = 0;
    const statusMap = {};
    stats.forEach(stat => {
      statusMap[stat.status] = stat._count._all;
      total += stat._count._all;
      console.log(`  ${stat.status}: ${stat._count._all}`);
    });
    console.log(`  TOTAL: ${total}`);
    
    // 2. Get failed items
    console.log('\n--- Failed Items ---');
    const failedItems = await prisma.syncQueue.findMany({
      where: {
        status: 'FAILED'
      },
      select: {
        id: true,
        entityType: true,
        entityId: true,
        retryCount: true,
        error: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    if (failedItems.length === 0) {
      console.log('  ✅ No failed items');
    } else {
      console.log(`  Found ${failedItems.length} failed items:\n`);
      failedItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.entityType}: ${item.entityId}`);
        console.log(`     Retries: ${item.retryCount}`);
        console.log(`     Error: ${item.error || 'None'}`);
        console.log(`     Created: ${item.createdAt}`);
        console.log('');
      });
    }
    
    // 3. Get pending/retry items
    console.log('--- Pending/Retry Items ---');
    const pendingStats = await prisma.syncQueue.groupBy({
      by: ['status', 'entityType'],
      _count: {
        _all: true
      },
      where: {
        status: {
          in: ['PENDING', 'PROCESSING', 'RETRY']
        }
      }
    });
    
    if (pendingStats.length === 0) {
      console.log('  ✅ No pending items');
    } else {
      pendingStats.forEach(stat => {
        console.log(`  ${stat.status} ${stat.entityType}: ${stat._count._all}`);
      });
    }
    
    // 4. Get customer sync state
    console.log('\n--- Customer Sync State ---');
    const customers = await prisma.customer.findMany({
      where: {
        isAnonymous: false
      },
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
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    console.log(`Found ${customers.length} recent customers:\n`);
    customers.forEach((customer, index) => {
      const syncStatus = customer.externalId ? '✅ Synced' : '❌ Not Synced';
      console.log(`  ${index + 1}. ${customer.firstName} ${customer.lastName}`);
      console.log(`     Email: ${customer.email || 'None'}`);
      console.log(`     External ID: ${customer.externalId || 'None'}`);
      console.log(`     Sync State: ${customer.syncState || 'Unknown'} ${syncStatus}`);
      console.log(`     Points: ${customer.loyaltyPoints}, Spent: $${customer.totalSpent}`);
      console.log('');
    });
    
    console.log('╔═══════════════════════════════════════╗');
    console.log('║  CHECK COMPLETE                      ║');
    console.log('╚═══════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('\n❌ Error checking queue:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQueue();