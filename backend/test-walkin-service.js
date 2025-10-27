/**
 * Test Walk-in Service
 * Comprehensive tests for Phase 2B walk-in functionality
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test configuration
const TEST_BUSINESS_ID = 'e6fa01f0-857a-4e23-bc86-346a816cd4f4';
const TEST_PHONES = {
  new: '+1234567890',
  existing: null, // Will be set to first test customer created
};

async function testWalkInService() {
  console.log('='.repeat(60));
  console.log('PHASE 2B: Walk-in Service Tests');
  console.log('='.repeat(60));
  console.log();

  try {
    // Import services
    const walkInService = await import('./src/services/walkInService.js');
    const {
      getAnonymousCustomer,
      handleWalkInCustomer,
      checkCustomerExists,
    } = walkInService;

    let testsPassed = 0;
    let testsFailed = 0;

    // ============================================
    // Test 1: Get Anonymous Customer
    // ============================================
    console.log('Test 1: Get Anonymous Customer');
    console.log('-'.repeat(60));
    try {
      const anonymous = await getAnonymousCustomer(TEST_BUSINESS_ID);
      
      if (!anonymous) {
        throw new Error('Anonymous customer not found');
      }
      
      if (anonymous.isAnonymous !== true) {
        throw new Error('Customer isAnonymous flag is false');
      }
      
      if (anonymous.firstName !== 'Walk-In' || anonymous.lastName !== 'Customer') {
        throw new Error('Anonymous customer name incorrect');
      }
      
      console.log(`✓ PASSED: Anonymous customer found: ${anonymous.id}`);
      console.log(`  Name: ${anonymous.firstName} ${anonymous.lastName}`);
      console.log(`  Is Anonymous: ${anonymous.isAnonymous}`);
      console.log(`  Customer Source: ${anonymous.customerSource}`);
      testsPassed++;
    } catch (error) {
      console.log(`✗ FAILED: ${error.message}`);
      testsFailed++;
    }
    console.log();

    // ============================================
    // Test 2: Anonymous Transaction (No Phone)
    // ============================================
    console.log('Test 2: Anonymous Transaction (No Customer Info)');
    console.log('-'.repeat(60));
    try {
      const result = await handleWalkInCustomer(TEST_BUSINESS_ID, {});
      
      if (!result.isAnonymous) {
        throw new Error('Expected anonymous customer');
      }
      
      if (result.isNew) {
        throw new Error('Anonymous customer should not be new');
      }
      
      console.log(`✓ PASSED: Anonymous transaction handled correctly`);
      console.log(`  Customer ID: ${result.customerId}`);
      console.log(`  Is Anonymous: ${result.isAnonymous}`);
      console.log(`  Is New: ${result.isNew}`);
      testsPassed++;
    } catch (error) {
      console.log(`✗ FAILED: ${error.message}`);
      testsFailed++;
    }
    console.log();

    // ============================================
    // Test 3: New Walk-in with Phone
    // ============================================
    console.log('Test 3: New Walk-in with Phone Number');
    console.log('-'.repeat(60));
    try {
      const result = await handleWalkInCustomer(TEST_BUSINESS_ID, {
        phone: TEST_PHONES.new,
        firstName: 'Test',
        lastName: 'Customer',
        email: 'test@example.com',
      });
      
      if (result.isAnonymous) {
        throw new Error('Customer should not be anonymous');
      }
      
      if (!result.isNew) {
        throw new Error('Customer should be new');
      }
      
      if (result.source !== 'new' && result.source !== 'crm') {
        throw new Error(`Unexpected source: ${result.source}`);
      }
      
      // Save for next test
      TEST_PHONES.existing = TEST_PHONES.new;
      
      console.log(`✓ PASSED: New customer created`);
      console.log(`  Customer ID: ${result.customerId}`);
      console.log(`  Is Anonymous: ${result.isAnonymous}`);
      console.log(`  Is New: ${result.isNew}`);
      console.log(`  Source: ${result.source}`);
      testsPassed++;
    } catch (error) {
      console.log(`✗ FAILED: ${error.message}`);
      testsFailed++;
    }
    console.log();

    // ============================================
    // Test 4: Existing Walk-in (Same Phone)
    // ============================================
    console.log('Test 4: Existing Walk-in (Same Phone Number)');
    console.log('-'.repeat(60));
    try {
      const result = await handleWalkInCustomer(TEST_BUSINESS_ID, {
        phone: TEST_PHONES.existing,
      });
      
      if (result.isAnonymous) {
        throw new Error('Customer should not be anonymous');
      }
      
      if (result.isNew) {
        throw new Error('Customer should not be new (already exists)');
      }
      
      if (result.source !== 'pos') {
        throw new Error(`Expected source 'pos', got '${result.source}'`);
      }
      
      console.log(`✓ PASSED: Existing customer found and reused`);
      console.log(`  Customer ID: ${result.customerId}`);
      console.log(`  Is Anonymous: ${result.isAnonymous}`);
      console.log(`  Is New: ${result.isNew}`);
      console.log(`  Source: ${result.source}`);
      testsPassed++;
    } catch (error) {
      console.log(`✗ FAILED: ${error.message}`);
      testsFailed++;
    }
    console.log();

    // ============================================
    // Test 5: Check Customer Exists (POS)
    // ============================================
    console.log('Test 5: Check Customer Exists in POS');
    console.log('-'.repeat(60));
    try {
      const result = await checkCustomerExists(TEST_BUSINESS_ID, TEST_PHONES.existing);
      
      if (!result.exists) {
        throw new Error('Customer should exist');
      }
      
      if (result.source !== 'pos') {
        throw new Error(`Expected source 'pos', got '${result.source}'`);
      }
      
      if (!result.customer) {
        throw new Error('Customer object should be returned');
      }
      
      console.log(`✓ PASSED: Customer existence check works`);
      console.log(`  Exists: ${result.exists}`);
      console.log(`  Source: ${result.source}`);
      console.log(`  Customer ID: ${result.customer.id}`);
      testsPassed++;
    } catch (error) {
      console.log(`✗ FAILED: ${error.message}`);
      testsFailed++;
    }
    console.log();

    // ============================================
    // Test 6: Check Non-existent Customer
    // ============================================
    console.log('Test 6: Check Non-existent Customer');
    console.log('-'.repeat(60));
    try {
      const result = await checkCustomerExists(TEST_BUSINESS_ID, '+9999999999');
      
      if (result.exists) {
        throw new Error('Customer should not exist');
      }
      
      if (result.source !== null) {
        throw new Error('Source should be null for non-existent customer');
      }
      
      console.log(`✓ PASSED: Non-existent customer check works`);
      console.log(`  Exists: ${result.exists}`);
      console.log(`  Source: ${result.source}`);
      testsPassed++;
    } catch (error) {
      console.log(`✗ FAILED: ${error.message}`);
      testsFailed++;
    }
    console.log();

    // ============================================
    // Test 7: Verify Sync Queue Entry
    // ============================================
    console.log('Test 7: Verify Sync Queue Entry for New Customer');
    console.log('-'.repeat(60));
    try {
      const queueEntry = await prisma.syncQueue.findFirst({
        where: {
          businessId: TEST_BUSINESS_ID,
          entityType: 'customer',
          operation: 'CREATE',
          status: 'PENDING',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      if (!queueEntry) {
        throw new Error('No sync queue entry found for new customer');
      }
      
      console.log(`✓ PASSED: Sync queue entry created`);
      console.log(`  Queue ID: ${queueEntry.id}`);
      console.log(`  Entity Type: ${queueEntry.entityType}`);
      console.log(`  Operation: ${queueEntry.operation}`);
      console.log(`  Priority: ${queueEntry.priority}`);
      console.log(`  Status: ${queueEntry.status}`);
      testsPassed++;
    } catch (error) {
      console.log(`✗ FAILED: ${error.message}`);
      testsFailed++;
    }
    console.log();

    // ============================================
    // Test 8: Verify Customer Properties
    // ============================================
    console.log('Test 8: Verify Customer Properties');
    console.log('-'.repeat(60));
    try {
      const customer = await prisma.customer.findFirst({
        where: {
          businessId: TEST_BUSINESS_ID,
          phone: TEST_PHONES.existing,
        },
      });
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      const checks = [
        { name: 'Has phone', pass: !!customer.phone },
        { name: 'Not anonymous', pass: customer.isAnonymous === false },
        { name: 'Customer source set', pass: !!customer.customerSource },
        { name: 'Sync state set', pass: !!customer.syncState },
        { name: 'Is active', pass: customer.isActive === true },
        { name: 'Has loyalty tier', pass: !!customer.loyaltyTier },
        { name: 'Initial loyalty points', pass: customer.loyaltyPoints === 0 },
        { name: 'Initial total spent', pass: parseFloat(customer.totalSpent) === 0 },
        { name: 'Initial visit count', pass: customer.visitCount === 0 },
      ];
      
      const allPassed = checks.every(check => check.pass);
      
      if (!allPassed) {
        const failed = checks.filter(c => !c.pass).map(c => c.name);
        throw new Error(`Property checks failed: ${failed.join(', ')}`);
      }
      
      console.log(`✓ PASSED: All customer properties correct`);
      checks.forEach(check => {
        console.log(`  ✓ ${check.name}`);
      });
      testsPassed++;
    } catch (error) {
      console.log(`✗ FAILED: ${error.message}`);
      testsFailed++;
    }
    console.log();

    // ============================================
    // Test Summary
    // ============================================
    console.log('='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testsPassed + testsFailed}`);
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${testsFailed}`);
    console.log();

    if (testsFailed === 0) {
      console.log('✓ ALL TESTS PASSED');
      console.log();
      console.log('Walk-in service is working correctly!');
      console.log('You can now:');
      console.log('  1. Create transactions without customer info (anonymous)');
      console.log('  2. Create transactions with phone (converts to registered)');
      console.log('  3. Reuse existing customers automatically');
      console.log('  4. Queue new customers for CRM sync');
    } else {
      console.log('✗ SOME TESTS FAILED');
      console.log('Please review the errors above and fix the issues.');
    }
    console.log();

    return testsFailed === 0;

  } catch (error) {
    console.error('✗ TEST SUITE ERROR:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testWalkInService()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
