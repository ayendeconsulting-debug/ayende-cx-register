/**
 * Integration Test Script
 * Tests the complete POS → CRM sync flow
 * 
 * Run with: node src/tests/testIntegration.js
 */

import { testCRMConnection, syncTransactionToCRM, syncCustomerToCRM } from '../services/crmSyncService.js';
import syncQueueService from '../services/syncQueueService.js';
import prisma from '../config/database.js';

console.log('='.repeat(70));
console.log('POS-CRM INTEGRATION TEST');
console.log('='.repeat(70));

/**
 * Test 1: CRM Connection
 */
const testConnection = async () => {
  console.log('\n[TEST 1] Testing CRM Connection...');
  console.log('-'.repeat(70));

  const result = await testCRMConnection();

  if (result.success) {
    console.log('✓ CRM connection successful');
    console.log(`  URL: ${result.url}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Response:`, result.data);
    return true;
  } else {
    console.log('✗ CRM connection failed');
    console.log(`  Error: ${result.error}`);
    return false;
  }
};

/**
 * Test 2: Business Configuration
 */
const testBusinessConfig = async () => {
  console.log('\n[TEST 2] Checking Business Configuration...');
  console.log('-'.repeat(70));

  const businessId = '84b4e567-f249-402e-b5df-d9008862e59c';

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      externalTenantId: true,
    },
  });

  if (!business) {
    console.log('✗ Business not found');
    return false;
  }

  console.log('✓ Business found:');
  console.log(`  ID: ${business.id}`);
  console.log(`  Name: ${business.name}`);
  console.log(`  CRM Tenant ID: ${business.externalTenantId || 'NOT SET'}`);

  if (!business.externalTenantId) {
    console.log('\n⚠ WARNING: externalTenantId not set!');
    console.log('  This is required for CRM sync.');
    console.log('  Expected: a-cx-iioj7');
    return false;
  }

  return true;
};

/**
 * Test 3: Queue Statistics
 */
const testQueueStats = async () => {
  console.log('\n[TEST 3] Queue Statistics...');
  console.log('-'.repeat(70));

  const stats = await syncQueueService.getQueueStats();

  console.log('Queue Status:');
  console.log(`  Pending: ${stats.pending}`);
  console.log(`  Processing: ${stats.processing}`);
  console.log(`  Retry: ${stats.retry}`);
  console.log(`  Failed: ${stats.failed}`);
  console.log(`  Success: ${stats.success}`);
  console.log(`  Total: ${stats.total}`);

  return true;
};

/**
 * Test 4: Find Recent Transaction
 */
const testFindTransaction = async () => {
  console.log('\n[TEST 4] Finding Recent Transaction...');
  console.log('-'.repeat(70));

  const businessId = '84b4e567-f249-402e-b5df-d9008862e59c';

  // Find most recent non-anonymous transaction
  const transaction = await prisma.transaction.findFirst({
    where: {
      businessId,
      customer: {
        isAnonymous: false,
      },
    },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isAnonymous: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!transaction) {
    console.log('✗ No non-anonymous transactions found');
    console.log('  Create a test transaction in POS first');
    return { found: false, transactionId: null };
  }

  console.log('✓ Transaction found:');
  console.log(`  ID: ${transaction.id}`);
  console.log(`  Number: ${transaction.transactionNumber}`);
  console.log(`  Total: $${transaction.total}`);
  console.log(`  Customer: ${transaction.customer?.firstName} ${transaction.customer?.lastName}`);
  console.log(`  Email: ${transaction.customer?.email}`);
  console.log(`  Created: ${transaction.createdAt}`);

  return { found: true, transactionId: transaction.id };
};

/**
 * Test 5: Sync Transaction to CRM
 */
const testSyncTransaction = async (transactionId) => {
  console.log('\n[TEST 5] Syncing Transaction to CRM...');
  console.log('-'.repeat(70));

  if (!transactionId) {
    console.log('⊘ Skipping - No transaction ID provided');
    return false;
  }

  try {
    const success = await syncTransactionToCRM(transactionId);

    if (success) {
      console.log('✓ Transaction synced successfully');
      console.log('  Check CRM at: https://consulting.ayendecx.com/reports/');
      return true;
    } else {
      console.log('✗ Transaction sync failed');
      return false;
    }
  } catch (error) {
    console.log('✗ Transaction sync error:', error.message);
    return false;
  }
};

/**
 * Test 6: Find Recent Customer
 */
const testFindCustomer = async () => {
  console.log('\n[TEST 6] Finding Recent Customer...');
  console.log('-'.repeat(70));

  const businessId = '84b4e567-f249-402e-b5df-d9008862e59c';

  const customer = await prisma.customer.findFirst({
    where: {
      businessId,
      isAnonymous: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!customer) {
    console.log('✗ No customers found');
    return { found: false, customerId: null };
  }

  console.log('✓ Customer found:');
  console.log(`  ID: ${customer.id}`);
  console.log(`  Name: ${customer.firstName} ${customer.lastName}`);
  console.log(`  Email: ${customer.email}`);
  console.log(`  Phone: ${customer.phone}`);
  console.log(`  Loyalty Points: ${customer.loyaltyPoints}`);
  console.log(`  Sync State: ${customer.syncState}`);

  return { found: true, customerId: customer.id };
};

/**
 * Test 7: Sync Customer to CRM
 */
const testSyncCustomer = async (customerId) => {
  console.log('\n[TEST 7] Syncing Customer to CRM...');
  console.log('-'.repeat(70));

  if (!customerId) {
    console.log('⊘ Skipping - No customer ID provided');
    return false;
  }

  try {
    const success = await syncCustomerToCRM(customerId);

    if (success) {
      console.log('✓ Customer synced successfully');
      return true;
    } else {
      console.log('✗ Customer sync failed');
      return false;
    }
  } catch (error) {
    console.log('✗ Customer sync error:', error.message);
    return false;
  }
};

/**
 * Run all tests
 */
const runTests = async () => {
  try {
    // Test 1: Connection
    const connectionOk = await testConnection();
    if (!connectionOk) {
      console.log('\n⚠ Cannot proceed - CRM connection failed');
      process.exit(1);
    }

    // Test 2: Business Config
    const configOk = await testBusinessConfig();
    if (!configOk) {
      console.log('\n⚠ Cannot proceed - Business configuration invalid');
      process.exit(1);
    }

    // Test 3: Queue Stats
    await testQueueStats();

    // Test 4: Find Transaction
    const { found: txFound, transactionId } = await testFindTransaction();

    // Test 5: Sync Transaction
    if (txFound) {
      await testSyncTransaction(transactionId);
    }

    // Test 6: Find Customer
    const { found: custFound, customerId } = await testFindCustomer();

    // Test 7: Sync Customer
    if (custFound) {
      await testSyncCustomer(customerId);
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    console.log('✓ CRM Connection: OK');
    console.log('✓ Business Config: OK');
    console.log('✓ Queue System: OK');
    
    if (txFound) {
      console.log('✓ Transaction Sync: TESTED');
    } else {
      console.log('⊘ Transaction Sync: NO DATA');
    }
    
    if (custFound) {
      console.log('✓ Customer Sync: TESTED');
    } else {
      console.log('⊘ Customer Sync: NO DATA');
    }

    console.log('\n✓ All tests completed!');
    console.log('\nNext Steps:');
    console.log('1. Check CRM dashboard: https://consulting.ayendecx.com/reports/');
    console.log('2. Verify transaction and customer appear in CRM');
    console.log('3. Start queue processor: npm run worker');
    console.log('4. Create new transaction in POS and watch it sync automatically');
    console.log('='.repeat(70));

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Test error:', error);
    process.exit(1);
  }
};

// Run tests
runTests();
