// test-real-integration-flow.js
/**
 * Real Integration Test - Works with Actual System Architecture
 * 
 * This test reflects the actual flow:
 * 1. Create customer in POS (walk-in or registered)
 * 2. Customer gets queued for CRM sync
 * 3. Create transaction in POS
 * 4. Transaction gets queued for CRM sync
 * 
 * We can then manually verify in CRM web UI that data appears
 */

// Configuration
const POS_URL = 'http://localhost:5000';
const BUSINESS_ID = 'e6fa01f0-857a-4e23-bc86-346a816cd4f4';

// Test data
const testCustomer = {
  firstName: 'Michael',
  lastName: 'Thompson',
  email: `michael.thompson.${Date.now()}@test.com`,
  phone: `+1555${Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}`,
};

let customerId = null;
let transactionId = null;

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to format results
function formatResult(testName, passed, details = '') {
  const status = passed ? '✓ PASSED' : '✗ FAILED';
  console.log(`\n${testName}: ${status}`);
  if (details) {
    console.log(`  ${details}`);
  }
  return passed;
}

/**
 * Test 1: Create registered customer in POS
 */
async function test1_CreateCustomerInPOS() {
  console.log('\n=== TEST 1: Create Customer in POS ===');
  
  try {
    const response = await fetch(`${POS_URL}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessId: BUSINESS_ID,
        firstName: testCustomer.firstName,
        lastName: testCustomer.lastName,
        email: testCustomer.email,
        phone: testCustomer.phone,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`POS API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    customerId = data.data.id;

    console.log('Customer created in POS:');
    console.log(`  ID: ${data.data.id}`);
    console.log(`  Name: ${data.data.firstName} ${data.data.lastName}`);
    console.log(`  Email: ${data.data.email}`);
    console.log(`  Phone: ${data.data.phone}`);
    console.log(`  Source: ${data.data.customerSource}`);
    console.log(`  Sync State: ${data.data.syncState}`);

    return formatResult(
      'Create customer in POS',
      !!customerId && data.data.customerSource === 'POS',
      `Customer ID: ${customerId}`
    );

  } catch (error) {
    console.error('Error:', error.message);
    return formatResult('Create customer in POS', false, error.message);
  }
}

/**
 * Test 2: Verify customer in sync queue
 */
async function test2_VerifySyncQueue() {
  console.log('\n=== TEST 2: Verify Customer in Sync Queue ===');

  try {
    const response = await fetch(
      `${POS_URL}/api/integration/sync-queue?businessId=${BUSINESS_ID}&entityType=customer&status=PENDING&limit=10`
    );

    if (!response.ok) {
      throw new Error(`Sync queue API error: ${response.status}`);
    }

    const data = await response.json();

    console.log('Sync queue status:');
    console.log(`  Total pending customers: ${data.data ? data.data.length : 0}`);

    if (data.data && data.data.length > 0) {
      // Find our customer in the queue
      const ourCustomer = data.data.find(item => 
        item.payload && item.payload.id === customerId
      );

      if (ourCustomer) {
        console.log(`  Our customer found in queue:`);
        console.log(`    Priority: ${ourCustomer.priority}`);
        console.log(`    Operation: ${ourCustomer.operation}`);
        console.log(`    Status: ${ourCustomer.status}`);
        console.log(`    Scheduled: ${ourCustomer.scheduledFor}`);
      }

      return formatResult(
        'Customer queued for CRM sync',
        !!ourCustomer,
        ourCustomer ? `Priority: ${ourCustomer.priority}` : 'Not found in queue'
      );
    } else {
      return formatResult(
        'Customer queued for CRM sync',
        false,
        'No pending items in queue'
      );
    }

  } catch (error) {
    console.error('Error:', error.message);
    return formatResult('Customer queued for CRM sync', false, error.message);
  }
}

/**
 * Test 3: Create transaction with customer
 */
async function test3_CreateTransaction() {
  console.log('\n=== TEST 3: Create Transaction with Customer ===');

  try {
    const transactionData = {
      businessId: BUSINESS_ID,
      customerId: customerId,
      items: [
        {
          name: 'Premium Coffee',
          quantity: 2,
          price: 5.50,
          total: 11.00
        },
        {
          name: 'Croissant',
          quantity: 1,
          price: 4.00,
          total: 4.00
        }
      ],
      subtotal: 15.00,
      taxAmount: 1.50,
      total: 16.50,
      paymentMethod: 'CREDIT_CARD',
      amountPaid: 16.50,
      changeGiven: 0,
      transactionNumber: `TXN-REAL-${Date.now()}`,
    };

    const response = await fetch(`${POS_URL}/api/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Transaction API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    transactionId = data.data.id;

    console.log('Transaction created:');
    console.log(`  Transaction ID: ${data.data.id}`);
    console.log(`  Transaction Number: ${data.data.transactionNumber}`);
    console.log(`  Customer ID: ${data.data.customerId}`);
    console.log(`  Total: $${data.data.total}`);
    console.log(`  Payment Method: ${data.data.paymentMethod}`);
    console.log(`  Items: ${data.data.items.length}`);

    return formatResult(
      'Create transaction',
      data.data.customerId === customerId,
      `Transaction total: $${data.data.total}, ID: ${transactionId}`
    );

  } catch (error) {
    console.error('Error:', error.message);
    return formatResult('Create transaction', false, error.message);
  }
}

/**
 * Test 4: Verify customer loyalty points updated
 */
async function test4_VerifyLoyaltyPoints() {
  console.log('\n=== TEST 4: Verify Loyalty Points Updated ===');

  try {
    const response = await fetch(`${POS_URL}/api/customers/${customerId}`);

    if (!response.ok) {
      throw new Error(`POS API error: ${response.status}`);
    }

    const data = await response.json();
    const customer = data.data;

    console.log('Customer loyalty status:');
    console.log(`  Loyalty Points Local: ${customer.loyaltyPointsLocal}`);
    console.log(`  Total Spent: $${customer.totalSpent || 0}`);
    console.log(`  Visit Count: ${customer.visitCount || 0}`);
    console.log(`  Last Updated: ${customer.updatedAt}`);

    // Points should be calculated: 16.50 * 0.1 = 1.65, rounded to 2
    const expectedPoints = Math.round(16.50 * 0.1);
    const passed = customer.loyaltyPointsLocal >= expectedPoints;

    return formatResult(
      'Loyalty points updated',
      passed,
      `Expected: ${expectedPoints}, Got: ${customer.loyaltyPointsLocal}`
    );

  } catch (error) {
    console.error('Error:', error.message);
    return formatResult('Loyalty points updated', false, error.message);
  }
}

/**
 * Test 5: Verify transaction in sync queue
 */
async function test5_VerifyTransactionQueue() {
  console.log('\n=== TEST 5: Verify Transaction in Sync Queue ===');

  try {
    const response = await fetch(
      `${POS_URL}/api/integration/sync-queue?businessId=${BUSINESS_ID}&entityType=transaction&status=PENDING&limit=10`
    );

    if (!response.ok) {
      throw new Error(`Sync queue API error: ${response.status}`);
    }

    const data = await response.json();

    console.log('Transaction sync queue:');
    console.log(`  Pending transactions: ${data.data ? data.data.length : 0}`);

    if (data.data && data.data.length > 0) {
      const ourTransaction = data.data.find(item => 
        item.payload && item.payload.id === transactionId
      );

      if (ourTransaction) {
        console.log(`  Our transaction found:`);
        console.log(`    Priority: ${ourTransaction.priority}`);
        console.log(`    Operation: ${ourTransaction.operation}`);
        console.log(`    Status: ${ourTransaction.status}`);
      }

      return formatResult(
        'Transaction queued for sync',
        !!ourTransaction,
        ourTransaction ? 'Transaction ready for CRM sync' : 'Not in queue'
      );
    } else {
      return formatResult(
        'Transaction queued for sync',
        false,
        'No transactions in queue'
      );
    }

  } catch (error) {
    console.error('Error:', error.message);
    return formatResult('Transaction queued for sync', false, error.message);
  }
}

/**
 * Test 6: Test walk-in customer flow
 */
async function test6_WalkInCustomer() {
  console.log('\n=== TEST 6: Walk-in Customer Transaction ===');

  try {
    const walkInPhone = `+1555${Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}`;

    const transactionData = {
      businessId: BUSINESS_ID,
      customerInfo: {
        phone: walkInPhone,
        firstName: 'Jane',
        lastName: 'Walker',
      },
      items: [
        {
          name: 'Espresso',
          quantity: 1,
          price: 3.50,
          total: 3.50
        }
      ],
      subtotal: 3.50,
      taxAmount: 0.35,
      total: 3.85,
      paymentMethod: 'CASH',
      amountPaid: 5.00,
      changeGiven: 1.15,
      transactionNumber: `TXN-WALKIN-${Date.now()}`,
    };

    const response = await fetch(`${POS_URL}/api/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Transaction API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    console.log('Walk-in transaction created:');
    console.log(`  Transaction ID: ${data.data.id}`);
    console.log(`  Customer ID: ${data.data.customerId}`);
    console.log(`  Customer Phone: ${walkInPhone}`);
    console.log(`  Total: $${data.data.total}`);

    // Verify customer was created/found
    const customerResponse = await fetch(`${POS_URL}/api/customers/${data.data.customerId}`);
    const customerData = await customerResponse.json();

    console.log(`  Customer Details:`);
    console.log(`    Name: ${customerData.data.firstName} ${customerData.data.lastName}`);
    console.log(`    Phone: ${customerData.data.phone}`);
    console.log(`    Source: ${customerData.data.customerSource}`);

    return formatResult(
      'Walk-in customer handling',
      !!data.data.customerId && customerData.data.phone === walkInPhone,
      'Walk-in converted to registered customer'
    );

  } catch (error) {
    console.error('Error:', error.message);
    return formatResult('Walk-in customer handling', false, error.message);
  }
}

/**
 * Test 7: Test anonymous transaction
 */
async function test7_AnonymousTransaction() {
  console.log('\n=== TEST 7: Anonymous Walk-in Transaction ===');

  try {
    const transactionData = {
      businessId: BUSINESS_ID,
      // No customerId or customerInfo - should use anonymous
      items: [
        {
          name: 'Water Bottle',
          quantity: 1,
          price: 2.00,
          total: 2.00
        }
      ],
      subtotal: 2.00,
      taxAmount: 0.20,
      total: 2.20,
      paymentMethod: 'CASH',
      amountPaid: 5.00,
      changeGiven: 2.80,
      transactionNumber: `TXN-ANON-${Date.now()}`,
    };

    const response = await fetch(`${POS_URL}/api/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Transaction API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    console.log('Anonymous transaction created:');
    console.log(`  Transaction ID: ${data.data.id}`);
    console.log(`  Customer ID: ${data.data.customerId}`);
    console.log(`  Total: $${data.data.total}`);

    // Verify it used anonymous customer
    const customerResponse = await fetch(`${POS_URL}/api/customers/${data.data.customerId}`);
    const customerData = await customerResponse.json();

    console.log(`  Anonymous Customer:`);
    console.log(`    Name: ${customerData.data.firstName} ${customerData.data.lastName}`);
    console.log(`    Is Anonymous: ${customerData.data.isAnonymous}`);

    return formatResult(
      'Anonymous transaction',
      customerData.data.isAnonymous === true,
      'Used shared anonymous customer'
    );

  } catch (error) {
    console.error('Error:', error.message);
    return formatResult('Anonymous transaction', false, error.message);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  REAL INTEGRATION TEST - POS System                       ║');
  console.log('║  Testing actual workflows with your system                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const results = [];

  // Run tests sequentially
  results.push(await test1_CreateCustomerInPOS());
  results.push(await test2_VerifySyncQueue());
  results.push(await test3_CreateTransaction());
  results.push(await test4_VerifyLoyaltyPoints());
  results.push(await test5_VerifyTransactionQueue());
  results.push(await test6_WalkInCustomer());
  results.push(await test7_AnonymousTransaction());

  // Summary
  const passed = results.filter(r => r).length;
  const failed = results.length - passed;

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n✓ ALL TESTS PASSED!');
    console.log('\nThe POS system is working correctly:');
    console.log('  ✓ Customer creation in POS');
    console.log('  ✓ Customers queued for CRM sync');
    console.log('  ✓ Transaction processing');
    console.log('  ✓ Loyalty points calculation');
    console.log('  ✓ Transactions queued for CRM sync');
    console.log('  ✓ Walk-in customer conversion');
    console.log('  ✓ Anonymous transaction handling');
    console.log('\nNOTE: Phase 2D will implement the processor to actually');
    console.log('      sync this data to CRM every 5 minutes.');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Review the output above.`);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // Test data summary
  console.log('Test Data Created:');
  console.log(`  Primary Customer ID: ${customerId}`);
  console.log(`  Primary Transaction ID: ${transactionId}`);
  console.log(`  Customer Name: ${testCustomer.firstName} ${testCustomer.lastName}`);
  console.log(`  Customer Phone: ${testCustomer.phone}`);
  console.log(`  Customer Email: ${testCustomer.email}`);
  console.log('\nManual Verification:');
  console.log('  1. Check sync queue has pending items');
  console.log('  2. When Phase 2D is complete, run sync processor');
  console.log('  3. Verify data appears in CRM web interface');
  console.log('  4. Log into CRM and navigate to Customers');
  console.log(`  5. Search for: ${testCustomer.phone}`);
}

// Run the tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
