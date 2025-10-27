// test-real-webhook-flow.js
/**
 * End-to-End Webhook Test with Real Transactions
 * Tests the complete customer lifecycle across CRM and POS
 */



// Configuration
const CRM_URL = 'http://localhost:8000';
const POS_URL = 'http://localhost:5000';
const BUSINESS_ID = 'e6fa01f0-857a-4e23-bc86-346a816cd4f4';
const TENANT_ID = 'a-cx-d8bf4';

// Test data
const testCustomer = {
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: `sarah.johnson.${Date.now()}@test.com`,
  phone: `+1555${Math.floor(Math.random() * 1000000).toString().padStart(7, '0')}`,
};

let crmCustomerId = null;
let posCustomerId = null;

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
 * Test 1: Create customer in CRM
 */
async function test1_CreateCustomerInCRM() {
  console.log('\n=== TEST 1: Create Customer in CRM ===');
  
  try {
    const response = await fetch(`${CRM_URL}/api/v1/customers/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TENANT_ID,
      },
      body: JSON.stringify({
        first_name: testCustomer.firstName,
        last_name: testCustomer.lastName,
        email: testCustomer.email,
        phone: testCustomer.phone,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`CRM API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    crmCustomerId = data.id;

    console.log('Customer created in CRM:');
    console.log(`  ID: ${data.id}`);
    console.log(`  Name: ${data.first_name} ${data.last_name}`);
    console.log(`  Email: ${data.email}`);
    console.log(`  Phone: ${data.phone}`);

    return formatResult(
      'Create customer in CRM',
      !!crmCustomerId,
      `CRM Customer ID: ${crmCustomerId}`
    );

  } catch (error) {
    console.error('Error:', error.message);
    return formatResult('Create customer in CRM', false, error.message);
  }
}

/**
 * Test 2: Wait for webhook and verify customer in POS
 */
async function test2_VerifyCustomerInPOS() {
  console.log('\n=== TEST 2: Verify Customer Synced to POS ===');
  console.log('Waiting 3 seconds for webhook to process...');
  
  await wait(3000);

  try {
    // Search for customer by phone in POS
    const response = await fetch(
      `${POS_URL}/api/customers?businessId=${BUSINESS_ID}&phone=${encodeURIComponent(testCustomer.phone)}`
    );

    if (!response.ok) {
      throw new Error(`POS API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.data || data.data.length === 0) {
      throw new Error('Customer not found in POS');
    }

    const customer = data.data[0];
    posCustomerId = customer.id;

    console.log('Customer found in POS:');
    console.log(`  POS ID: ${customer.id}`);
    console.log(`  External ID: ${customer.externalId}`);
    console.log(`  Name: ${customer.firstName} ${customer.lastName}`);
    console.log(`  Email: ${customer.email}`);
    console.log(`  Phone: ${customer.phone}`);
    console.log(`  Source: ${customer.customerSource}`);
    console.log(`  Sync State: ${customer.syncState}`);

    const passed = 
      customer.externalId === crmCustomerId &&
      customer.firstName === testCustomer.firstName &&
      customer.lastName === testCustomer.lastName &&
      customer.customerSource === 'CRM';

    return formatResult(
      'Customer synced to POS',
      passed,
      `POS ID: ${posCustomerId}, External ID matches: ${customer.externalId === crmCustomerId}`
    );

  } catch (error) {
    console.error('Error:', error.message);
    return formatResult('Customer synced to POS', false, error.message);
  }
}

/**
 * Test 3: Verify system mapping exists
 */
async function test3_VerifySystemMapping() {
  console.log('\n=== TEST 3: Verify System Mapping ===');

  try {
    const response = await fetch(
      `${POS_URL}/api/integration/mappings?businessId=${BUSINESS_ID}&entityType=CUSTOMER&posId=${posCustomerId}`
    );

    if (!response.ok) {
      throw new Error(`Mapping API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error('Mapping not found');
    }

    const mapping = data.data;

    console.log('System mapping found:');
    console.log(`  POS ID: ${mapping.posId}`);
    console.log(`  CRM ID: ${mapping.crmId}`);
    console.log(`  Entity Type: ${mapping.entityType}`);
    console.log(`  Status: ${mapping.syncStatus}`);

    const passed = 
      mapping.posId === posCustomerId &&
      mapping.crmId === crmCustomerId &&
      mapping.entityType === 'CUSTOMER' &&
      mapping.syncStatus === 'SYNCED';

    return formatResult(
      'System mapping created',
      passed,
      `Mapping status: ${mapping.syncStatus}`
    );

  } catch (error) {
    console.error('Error:', error.message);
    return formatResult('System mapping created', false, error.message);
  }
}

/**
 * Test 4: Update customer in CRM
 */
async function test4_UpdateCustomerInCRM() {
  console.log('\n=== TEST 4: Update Customer in CRM ===');

  try {
    const updatedEmail = `sarah.johnson.updated.${Date.now()}@test.com`;

    const response = await fetch(`${CRM_URL}/api/v1/customers/${crmCustomerId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TENANT_ID,
      },
      body: JSON.stringify({
        email: updatedEmail,
        loyalty_points: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`CRM API error: ${response.status}`);
    }

    const data = await response.json();

    console.log('Customer updated in CRM:');
    console.log(`  ID: ${data.id}`);
    console.log(`  Email: ${data.email}`);
    console.log(`  Loyalty Points: ${data.loyalty_points}`);

    testCustomer.email = updatedEmail; // Update for next test

    return formatResult(
      'Update customer in CRM',
      data.email === updatedEmail,
      `New email: ${updatedEmail}`
    );

  } catch (error) {
    console.error('Error:', error.message);
    return formatResult('Update customer in CRM', false, error.message);
  }
}

/**
 * Test 5: Verify update synced to POS
 */
async function test5_VerifyUpdateInPOS() {
  console.log('\n=== TEST 5: Verify Update Synced to POS ===');
  console.log('Waiting 3 seconds for webhook to process...');
  
  await wait(3000);

  try {
    const response = await fetch(`${POS_URL}/api/customers/${posCustomerId}`);

    if (!response.ok) {
      throw new Error(`POS API error: ${response.status}`);
    }

    const data = await response.json();
    const customer = data.data;

    console.log('Updated customer in POS:');
    console.log(`  ID: ${customer.id}`);
    console.log(`  Email: ${customer.email}`);
    console.log(`  Loyalty Points CRM: ${customer.loyaltyPointsCRM}`);
    console.log(`  Last Synced: ${customer.loyaltyLastSyncedAt}`);

    const passed = customer.email === testCustomer.email;

    return formatResult(
      'Update synced to POS',
      passed,
      `Email matches: ${passed}, Loyalty: ${customer.loyaltyPointsCRM}`
    );

  } catch (error) {
    console.error('Error:', error.message);
    return formatResult('Update synced to POS', false, error.message);
  }
}

/**
 * Test 6: Create transaction in POS with synced customer
 */
async function test6_CreateTransaction() {
  console.log('\n=== TEST 6: Create Transaction in POS ===');

  try {
    const transactionData = {
      businessId: BUSINESS_ID,
      customerId: posCustomerId,
      items: [
        {
          name: 'Coffee',
          quantity: 2,
          price: 4.50,
          total: 9.00
        },
        {
          name: 'Muffin',
          quantity: 1,
          price: 3.50,
          total: 3.50
        }
      ],
      subtotal: 12.50,
      taxAmount: 1.25,
      total: 13.75,
      paymentMethod: 'CASH',
      amountPaid: 15.00,
      changeGiven: 1.25,
      transactionNumber: `TXN-TEST-${Date.now()}`,
    };

    const response = await fetch(`${POS_URL}/api/transactions`, {
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

    console.log('Transaction created:');
    console.log(`  Transaction ID: ${data.data.id}`);
    console.log(`  Transaction Number: ${data.data.transactionNumber}`);
    console.log(`  Customer ID: ${data.data.customerId}`);
    console.log(`  Total: $${data.data.total}`);
    console.log(`  Items: ${data.data.items.length}`);
    console.log(`  Loyalty Points Earned: ${data.data.loyaltyPointsEarned || 0}`);

    return formatResult(
      'Create transaction',
      data.data.customerId === posCustomerId,
      `Transaction total: $${data.data.total}`
    );

  } catch (error) {
    console.error('Error:', error.message);
    return formatResult('Create transaction', false, error.message);
  }
}

/**
 * Test 7: Verify loyalty points updated
 */
async function test7_VerifyLoyaltyPoints() {
  console.log('\n=== TEST 7: Verify Loyalty Points Updated ===');

  try {
    const response = await fetch(`${POS_URL}/api/customers/${posCustomerId}`);

    if (!response.ok) {
      throw new Error(`POS API error: ${response.status}`);
    }

    const data = await response.json();
    const customer = data.data;

    console.log('Customer loyalty status:');
    console.log(`  Loyalty Points Local: ${customer.loyaltyPointsLocal}`);
    console.log(`  Loyalty Points CRM: ${customer.loyaltyPointsCRM}`);
    console.log(`  Total Spent: $${customer.totalSpent || 0}`);
    console.log(`  Visit Count: ${customer.visitCount || 0}`);

    // Should have local points from transaction (13.75 * 0.1 = 1.375, rounded to 1)
    const passed = customer.loyaltyPointsLocal > 0;

    return formatResult(
      'Loyalty points updated',
      passed,
      `Local: ${customer.loyaltyPointsLocal}, CRM: ${customer.loyaltyPointsCRM}`
    );

  } catch (error) {
    console.error('Error:', error.message);
    return formatResult('Loyalty points updated', false, error.message);
  }
}

/**
 * Test 8: Verify sync queue has transaction
 */
async function test8_VerifySyncQueue() {
  console.log('\n=== TEST 8: Verify Transaction in Sync Queue ===');

  try {
    // Query sync queue for pending transactions
    const response = await fetch(
      `${POS_URL}/api/integration/sync-queue?businessId=${BUSINESS_ID}&entityType=transaction&status=PENDING&limit=10`
    );

    if (!response.ok) {
      throw new Error(`Sync queue API error: ${response.status}`);
    }

    const data = await response.json();

    console.log('Sync queue status:');
    console.log(`  Total pending items: ${data.data ? data.data.length : 0}`);

    if (data.data && data.data.length > 0) {
      const latestItem = data.data[0];
      console.log(`  Latest item:`);
      console.log(`    Entity Type: ${latestItem.entityType}`);
      console.log(`    Operation: ${latestItem.operation}`);
      console.log(`    Priority: ${latestItem.priority}`);
      console.log(`    Status: ${latestItem.status}`);
      console.log(`    Scheduled For: ${latestItem.scheduledFor}`);
    }

    return formatResult(
      'Transaction queued for sync',
      data.data && data.data.length > 0,
      `Pending items: ${data.data ? data.data.length : 0}`
    );

  } catch (error) {
    console.error('Error:', error.message);
    return formatResult('Transaction queued for sync', false, error.message);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  END-TO-END WEBHOOK & TRANSACTION TEST                    ║');
  console.log('║  Testing complete customer lifecycle across CRM and POS   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const results = [];

  // Run tests sequentially
  results.push(await test1_CreateCustomerInCRM());
  results.push(await test2_VerifyCustomerInPOS());
  results.push(await test3_VerifySystemMapping());
  results.push(await test4_UpdateCustomerInCRM());
  results.push(await test5_VerifyUpdateInPOS());
  results.push(await test6_CreateTransaction());
  results.push(await test7_VerifyLoyaltyPoints());
  results.push(await test8_VerifySyncQueue());

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
    console.log('\n🎉 ALL TESTS PASSED! 🎉');
    console.log('\nThe webhook system is working perfectly:');
    console.log('  ✓ CRM → POS customer sync (real-time)');
    console.log('  ✓ System mapping creation and updates');
    console.log('  ✓ Customer updates propagate correctly');
    console.log('  ✓ Transactions link to synced customers');
    console.log('  ✓ Loyalty points track locally');
    console.log('  ✓ Transactions queue for CRM sync');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Review the output above.`);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // Cleanup info
  console.log('Test Data Created:');
  console.log(`  CRM Customer ID: ${crmCustomerId}`);
  console.log(`  POS Customer ID: ${posCustomerId}`);
  console.log(`  Customer Phone: ${testCustomer.phone}`);
  console.log(`  Customer Email: ${testCustomer.email}`);
  console.log('\nYou can manually verify this data in both systems.');
}

// Run the tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
