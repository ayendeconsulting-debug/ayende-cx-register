// test-webhook-sync.js
/**
 * Phase 2C: Webhook Sync Tests
 * Tests CRM -> POS real-time customer synchronization via webhooks
 */

import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const POS_URL = process.env.POS_API_URL || 'http://localhost:5000';
const BUSINESS_ID = 'e6fa01f0-857a-4e23-bc86-346a816cd4f4';
const TENANT_ID = 'a-cx-d8bf4';
const SECRET = process.env.INTEGRATION_SECRET || '31YMBwf4R4OetvSJ/nIf+5D1ndnMxruRL1QcJsCM9jM=';

console.log(`\nTesting POS at: ${POS_URL}`);
console.log(`Using secret: ${SECRET.substring(0, 10)}...`);

/**
 * Generate webhook signature
 */
function generateSignature(payload) {
  return crypto
    .createHmac('sha256', SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
}

/**
 * Send webhook request
 */
async function sendWebhook(endpoint, payload) {
  const signature = generateSignature(payload);
  
  try {
    const response = await axios.post(
      `${POS_URL}${endpoint}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Tenant-ID': TENANT_ID
        },
        timeout: 5000
      }
    );
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: `Connection refused to ${POS_URL}. Is the POS server running?`,
        status: 'ECONNREFUSED'
      };
    }
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
}

/**
 * Test: Health Check First
 */
async function testHealthCheck() {
  console.log('\nTest 0: POS Server Health Check');
  console.log('------------------------------------------------------------');
  
  try {
    const response = await axios.get(`${POS_URL}/health`, { timeout: 3000 });
    console.log('✓ PASSED: POS server is running');
    console.log(`  Status: ${response.status}`);
    return { passed: true };
  } catch (error) {
    console.log('✗ FAILED: Cannot reach POS server');
    console.log(`  Error: ${error.message}`);
    console.log(`  URL: ${POS_URL}/health`);
    return { passed: false };
  }
}

/**
 * Test: Customer Created Webhook
 */
async function testCustomerCreated() {
  console.log('\nTest 1: Customer Created Webhook');
  console.log('------------------------------------------------------------');
  
  const payload = {
    operation: 'created',
    customer: {
      id: 'crm-test-customer-001',
      first_name: 'John',
      last_name: 'Webhook',
      email: 'john.webhook@test.com',
      phone: '+1555123456',
      loyalty_points: 100,
      loyalty_tier: 'SILVER',
      total_spent: 250.00,
      visit_count: 5,
      marketing_opt_in: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    tenant_id: TENANT_ID,
    pos_business_id: BUSINESS_ID,
    timestamp: Math.floor(Date.now() / 1000)
  };
  
  const result = await sendWebhook('/api/integration/webhook/customer-created', payload);
  
  if (result.success && result.status === 201) {
    console.log('✓ PASSED: Customer created webhook accepted');
    console.log(`  Customer ID: ${result.data.customerId}`);
    return { passed: true, customerId: result.data.customerId };
  } else {
    console.log('✗ FAILED: Customer created webhook failed');
    console.log(`  Status: ${result.status}`);
    console.log(`  Error: ${JSON.stringify(result.error)}`);
    return { passed: false };
  }
}

/**
 * Test: Customer Updated Webhook
 */
async function testCustomerUpdated() {
  console.log('\nTest 2: Customer Updated Webhook');
  console.log('------------------------------------------------------------');
  
  const payload = {
    operation: 'updated',
    customer: {
      id: 'crm-test-customer-001',
      first_name: 'John',
      last_name: 'Webhook-Updated',
      email: 'john.webhook@test.com',
      phone: '+1555123456',
      loyalty_points: 150,
      loyalty_tier: 'GOLD',
      total_spent: 500.00,
      visit_count: 10,
      marketing_opt_in: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    tenant_id: TENANT_ID,
    pos_business_id: BUSINESS_ID,
    timestamp: Math.floor(Date.now() / 1000)
  };
  
  const result = await sendWebhook('/api/integration/webhook/customer-updated', payload);
  
  if (result.success && result.status === 200) {
    console.log('✓ PASSED: Customer updated webhook accepted');
    console.log(`  Customer ID: ${result.data.customerId}`);
    return { passed: true };
  } else {
    console.log('✗ FAILED: Customer updated webhook failed');
    console.log(`  Status: ${result.status}`);
    console.log(`  Error: ${JSON.stringify(result.error)}`);
    return { passed: false };
  }
}

/**
 * Test: Invalid Signature
 */
async function testInvalidSignature() {
  console.log('\nTest 3: Invalid Signature Rejection');
  console.log('------------------------------------------------------------');
  
  const payload = {
    operation: 'created',
    customer: {
      id: 'crm-test-customer-002',
      first_name: 'Invalid',
      last_name: 'Signature'
    },
    tenant_id: TENANT_ID,
    pos_business_id: BUSINESS_ID,
    timestamp: Math.floor(Date.now() / 1000)
  };
  
  try {
    const response = await axios.post(
      `${POS_URL}/api/integration/webhook/customer-created`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': 'invalid-signature-12345',
          'X-Tenant-ID': TENANT_ID
        },
        timeout: 5000
      }
    );
    console.log('✗ FAILED: Invalid signature was accepted');
    return { passed: false };
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✓ PASSED: Invalid signature rejected');
      return { passed: true };
    } else {
      console.log('✗ FAILED: Unexpected error');
      console.log(`  Status: ${error.response?.status}`);
      console.log(`  Error: ${error.message}`);
      return { passed: false };
    }
  }
}

/**
 * Test: Missing Signature
 */
async function testMissingSignature() {
  console.log('\nTest 4: Missing Signature Rejection');
  console.log('------------------------------------------------------------');
  
  const payload = {
    operation: 'created',
    customer: {
      id: 'crm-test-customer-003',
      first_name: 'Missing',
      last_name: 'Signature'
    },
    tenant_id: TENANT_ID,
    pos_business_id: BUSINESS_ID,
    timestamp: Math.floor(Date.now() / 1000)
  };
  
  try {
    const response = await axios.post(
      `${POS_URL}/api/integration/webhook/customer-created`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': TENANT_ID
        },
        timeout: 5000
      }
    );
    console.log('✗ FAILED: Missing signature was accepted');
    return { passed: false };
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✓ PASSED: Missing signature rejected');
      return { passed: true };
    } else {
      console.log('✗ FAILED: Unexpected error');
      console.log(`  Status: ${error.response?.status}`);
      console.log(`  Error: ${error.message}`);
      return { passed: false };
    }
  }
}

/**
 * Test: Customer Deleted Webhook
 */
async function testCustomerDeleted() {
  console.log('\nTest 5: Customer Deleted Webhook');
  console.log('------------------------------------------------------------');
  
  const payload = {
    operation: 'deleted',
    customer_id: 'crm-test-customer-001',
    tenant_id: TENANT_ID,
    pos_business_id: BUSINESS_ID,
    timestamp: Math.floor(Date.now() / 1000)
  };
  
  const result = await sendWebhook('/api/integration/webhook/customer-deleted', payload);
  
  if (result.success && result.status === 200) {
    console.log('✓ PASSED: Customer deleted webhook accepted');
    return { passed: true };
  } else {
    console.log('✗ FAILED: Customer deleted webhook failed');
    console.log(`  Status: ${result.status}`);
    console.log(`  Error: ${JSON.stringify(result.error)}`);
    return { passed: false };
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('============================================================');
  console.log('PHASE 2C: Webhook Sync Tests');
  console.log('============================================================');
  
  const results = [];
  
  // Run health check first
  const healthCheck = await testHealthCheck();
  if (!healthCheck.passed) {
    console.log('\n✗ Cannot proceed - POS server is not reachable');
    console.log(`\nPlease ensure:`);
    console.log(`1. POS server is running`);
    console.log(`2. Server is listening on ${POS_URL}`);
    console.log(`3. No firewall blocking the connection`);
    process.exit(1);
  }
  
  // Run tests
  results.push(await testCustomerCreated());
  results.push(await testCustomerUpdated());
  results.push(await testInvalidSignature());
  results.push(await testMissingSignature());
  results.push(await testCustomerDeleted());
  
  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  
  console.log('\n============================================================');
  console.log('TEST SUMMARY');
  console.log('============================================================');
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n✓ ALL TESTS PASSED\n');
    console.log('Phase 2C webhook sync is working correctly!');
    console.log('CRM can now send real-time customer updates to POS.');
  } else {
    console.log('\n✗ SOME TESTS FAILED\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
