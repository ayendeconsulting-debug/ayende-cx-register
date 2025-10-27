// Test SyncQueue Infrastructure
// This script verifies that the SyncQueue table is working correctly

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testSyncQueue() {
  console.log('='.repeat(60));
  console.log('Testing SyncQueue Infrastructure');
  console.log('='.repeat(60));
  console.log();

  try {
    // Test 1: Verify SyncQueue table exists and is accessible
    console.log('Test 1: Checking SyncQueue table accessibility...');
    const queueCount = await prisma.syncQueue.count();
    console.log(`✓ PASSED: SyncQueue table accessible (${queueCount} records)`);
    console.log();

    // Test 2: Get a business for testing
    console.log('Test 2: Getting test business...');
    const business = await prisma.business.findFirst();
    
    if (!business) {
      console.log('❌ FAILED: No business found in database');
      return false;
    }
    
    console.log(`✓ PASSED: Found business "${business.businessName}" (${business.id})`);
    console.log();

    // Test 3: Create a test sync queue item
    console.log('Test 3: Creating test sync queue item...');
    const testQueueItem = await prisma.syncQueue.create({
      data: {
        businessId: business.id,
        entityType: 'customer',
        entityId: 'test-customer-id',
        operation: 'CREATE',
        priority: 'NORMAL',
        status: 'PENDING',
        payload: {
          test: true,
          message: 'This is a test queue item'
        }
      }
    });

    console.log(`✓ PASSED: Created sync queue item ${testQueueItem.id}`);
    console.log();

    // Test 4: Verify queue item properties
    console.log('Test 4: Verifying queue item properties...');
    const checks = [
      { name: 'Has ID', value: !!testQueueItem.id },
      { name: 'businessId matches', value: testQueueItem.businessId === business.id },
      { name: 'entityType is customer', value: testQueueItem.entityType === 'customer' },
      { name: 'entityId is set', value: testQueueItem.entityId === 'test-customer-id' },
      { name: 'operation is CREATE', value: testQueueItem.operation === 'CREATE' },
      { name: 'priority is NORMAL', value: testQueueItem.priority === 'NORMAL' },
      { name: 'status is PENDING', value: testQueueItem.status === 'PENDING' },
      { name: 'retryCount is 0', value: testQueueItem.retryCount === 0 },
      { name: 'Has scheduledFor', value: !!testQueueItem.scheduledFor },
      { name: 'Has createdAt', value: !!testQueueItem.createdAt },
      { name: 'Has updatedAt', value: !!testQueueItem.updatedAt },
      { name: 'processedAt is null', value: testQueueItem.processedAt === null },
      { name: 'Payload stored correctly', value: testQueueItem.payload.test === true }
    ];

    let allPassed = true;
    checks.forEach(check => {
      if (check.value) {
        console.log(`  ✓ ${check.name}`);
      } else {
        console.log(`  ❌ ${check.name}`);
        allPassed = false;
      }
    });

    console.log();

    if (!allPassed) {
      console.log('❌ FAILED: Some property checks failed');
      return false;
    }

    console.log('✓ PASSED: All property checks passed');
    console.log();

    // Test 5: Update queue item (simulate processing)
    console.log('Test 5: Updating queue item status...');
    const updatedItem = await prisma.syncQueue.update({
      where: { id: testQueueItem.id },
      data: {
        status: 'PROCESSING',
        retryCount: 1
      }
    });

    if (updatedItem.status === 'PROCESSING' && updatedItem.retryCount === 1) {
      console.log('✓ PASSED: Queue item updated successfully');
    } else {
      console.log('❌ FAILED: Queue item update failed');
      return false;
    }
    console.log();

    // Test 6: Query with filters
    console.log('Test 6: Testing queue queries with filters...');
    
    const pendingItems = await prisma.syncQueue.findMany({
      where: { status: 'PENDING' }
    });
    console.log(`  ✓ Found ${pendingItems.length} PENDING items`);

    const processingItems = await prisma.syncQueue.findMany({
      where: { status: 'PROCESSING' }
    });
    console.log(`  ✓ Found ${processingItems.length} PROCESSING items`);

    const highPriorityItems = await prisma.syncQueue.findMany({
      where: { 
        status: 'PENDING',
        priority: 'HIGH' 
      },
      orderBy: { scheduledFor: 'asc' }
    });
    console.log(`  ✓ Found ${highPriorityItems.length} HIGH priority PENDING items`);

    console.log();
    console.log('✓ PASSED: All query filters working correctly');
    console.log();

    // Test 7: Test different entity types
    console.log('Test 7: Creating items with different entity types...');
    const entityTypes = ['customer', 'transaction', 'product', 'business'];
    
    for (const entityType of entityTypes) {
      const item = await prisma.syncQueue.create({
        data: {
          businessId: business.id,
          entityType: entityType,
          entityId: `test-${entityType}-id`,
          operation: 'TEST',
          priority: 'LOW',
          status: 'PENDING'
        }
      });
      console.log(`  ✓ Created ${entityType} queue item: ${item.id}`);
    }

    console.log();
    console.log('✓ PASSED: All entity types supported');
    console.log();

    // Test 8: Test priority levels
    console.log('Test 8: Creating items with different priorities...');
    const priorities = ['HIGH', 'NORMAL', 'LOW'];
    
    for (const priority of priorities) {
      const item = await prisma.syncQueue.create({
        data: {
          businessId: business.id,
          entityType: 'customer',
          entityId: `test-priority-${priority}`,
          operation: 'TEST',
          priority: priority,
          status: 'PENDING'
        }
      });
      console.log(`  ✓ Created ${priority} priority item: ${item.id}`);
    }

    console.log();
    console.log('✓ PASSED: All priority levels supported');
    console.log();

    // Test 9: Clean up test data
    console.log('Test 9: Cleaning up test data...');
    const deleted = await prisma.syncQueue.deleteMany({
      where: {
        entityId: {
          startsWith: 'test-'
        }
      }
    });

    console.log(`✓ PASSED: Cleaned up ${deleted.count} test records`);
    console.log();

    // All tests passed
    console.log('='.repeat(60));
    console.log('✓ ALL SYNC QUEUE TESTS PASSED');
    console.log('='.repeat(60));
    console.log();
    console.log('Summary:');
    console.log('  - SyncQueue table: Accessible');
    console.log('  - CRUD operations: Working');
    console.log('  - All entity types: Supported');
    console.log('  - All priorities: Supported');
    console.log('  - Query filters: Working');
    console.log('  - Payload storage: Working');
    console.log();

    return true;

  } catch (error) {
    console.error('❌ TEST ERROR:', error.message);
    console.error(error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSyncQueue()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
