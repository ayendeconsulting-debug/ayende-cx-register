/**
 * JWT Test Script for Ayende-CX POS-CRM Integration (ES Module Version)
 * Purpose: Verify JWT generation matches CRM authentication requirements
 * 
 * This script tests:
 * 1. JWT generation with required fields (iss, scope)
 * 2. Token decoding to inspect payload
 * 3. Token verification with INTEGRATION_SECRET
 * 4. Comparison with CRM expectations
 */

import jwt from 'jsonwebtoken';

// CRITICAL: This must match exactly across POS Backend, Worker, and CRM
const INTEGRATION_SECRET = 'CEMIQ6NfAMlh5pxB32Pma7jMt7a/OExkhJAyOCyaRAA=';

// Test tenant ID (from handover doc)
const TEST_TENANT_ID = 'a-cx-iioj7';

console.log('='.repeat(70));
console.log('JWT GENERATION TEST FOR AYENDE-CX POS-CRM INTEGRATION');
console.log('='.repeat(70));
console.log();

// Step 1: Display the secret being used
console.log('Step 1: Secret Verification');
console.log('-'.repeat(70));
console.log('INTEGRATION_SECRET:', INTEGRATION_SECRET);
console.log('Secret Length:', INTEGRATION_SECRET.length);
console.log('First 10 chars (ASCII codes):', 
  INTEGRATION_SECRET.split('').slice(0, 10).map(c => c.charCodeAt(0)).join(', ')
);
console.log();

// Step 2: Create JWT payload matching CRM requirements
console.log('Step 2: Creating JWT Payload');
console.log('-'.repeat(70));

const payload = {
  iss: 'ayende-pos',           // REQUIRED by CRM - must be exactly 'ayende-pos'
  scope: 'integration',        // REQUIRED by CRM - must be exactly 'integration'
  sub: 'system-to-system',     // Optional - identifies the subject
  tenantId: TEST_TENANT_ID,    // For routing to correct tenant
  source: 'pos',               // For logging/tracking
  timestamp: Date.now(),       // For debugging
};

console.log('Payload:', JSON.stringify(payload, null, 2));
console.log();

// Step 3: Generate JWT token
console.log('Step 3: Generating JWT Token');
console.log('-'.repeat(70));

let token;
try {
  token = jwt.sign(payload, INTEGRATION_SECRET, {
    expiresIn: '1h',
    algorithm: 'HS256'  // Must match CRM expectation
  });
  
  console.log('✅ Token generated successfully');
  console.log('Token length:', token.length);
  console.log();
  console.log('Full Token:');
  console.log(token);
  console.log();
  console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
  console.log('Token (last 50 chars):', '...' + token.substring(token.length - 50));
  console.log();
} catch (error) {
  console.error('❌ Token generation failed:', error.message);
  process.exit(1);
}

// Step 4: Decode token (without verification)
console.log('Step 4: Decoding Token (without verification)');
console.log('-'.repeat(70));

try {
  const decoded = jwt.decode(token, { complete: true });
  
  console.log('Header:', JSON.stringify(decoded.header, null, 2));
  console.log();
  console.log('Payload:', JSON.stringify(decoded.payload, null, 2));
  console.log();
  
  // Verify required fields
  console.log('Field Verification:');
  console.log(`  iss: ${decoded.payload.iss} ${decoded.payload.iss === 'ayende-pos' ? '✅' : '❌ WRONG'}`);
  console.log(`  scope: ${decoded.payload.scope} ${decoded.payload.scope === 'integration' ? '✅' : '❌ WRONG'}`);
  console.log(`  algorithm: ${decoded.header.alg} ${decoded.header.alg === 'HS256' ? '✅' : '❌ WRONG'}`);
  console.log();
} catch (error) {
  console.error('❌ Token decoding failed:', error.message);
  process.exit(1);
}

// Step 5: Verify token with same secret
console.log('Step 5: Verifying Token with INTEGRATION_SECRET');
console.log('-'.repeat(70));

try {
  const verified = jwt.verify(token, INTEGRATION_SECRET, {
    algorithms: ['HS256']
  });
  
  console.log('✅ Token verification SUCCESSFUL');
  console.log('Verified payload:', JSON.stringify(verified, null, 2));
  console.log();
} catch (error) {
  console.error('❌ Token verification FAILED:', error.message);
  console.error('Error details:', error);
  process.exit(1);
}

// Step 6: Test with wrong secret (to verify detection)
console.log('Step 6: Testing with Wrong Secret (should fail)');
console.log('-'.repeat(70));

const WRONG_SECRET = 'wrong-secret-for-testing';
try {
  jwt.verify(token, WRONG_SECRET, {
    algorithms: ['HS256']
  });
  console.error('❌ UNEXPECTED: Token verified with wrong secret!');
} catch (error) {
  console.log('✅ Correctly rejected token with wrong secret');
  console.log('Error:', error.message);
  console.log();
}

// Step 7: Create Authorization header format
console.log('Step 7: Authorization Header Format');
console.log('-'.repeat(70));

const authHeader = `Bearer ${token}`;
console.log('Authorization Header:');
console.log(authHeader);
console.log();

// Step 8: Summary and recommendations
console.log('='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));
console.log();
console.log('✅ JWT Generation: Success');
console.log('✅ Required Fields: Present (iss, scope)');
console.log('✅ Token Verification: Success');
console.log('✅ Algorithm: HS256');
console.log();
console.log('NEXT STEPS:');
console.log('1. Compare this token format with what crmSyncService.js generates');
console.log('2. Verify INTEGRATION_SECRET matches on Railway services');
console.log('3. Add debug logging to crmSyncService.js to log actual token');
console.log('4. Add debug logging to CRM authentication.py to see received token');
console.log('5. Test this exact token against CRM endpoint manually with PowerShell');
console.log();
console.log('MANUAL POWERSHELL TEST COMMAND:');
console.log('-'.repeat(70));
console.log('Copy the token above and run:');
console.log('.\\test-crm-endpoint.ps1');
console.log();
console.log('OR use curl:');
console.log(`curl -X POST https://staging.ayendecx.com/api/v1/sync/transaction `);
console.log(`  -H "Authorization: Bearer ${token}" `);
console.log(`  -H "Content-Type: application/json" `);
console.log(`  -d "{\\"test\\": \\"data\\", \\"tenantId\\": \\"${TEST_TENANT_ID}\\"}" `);
console.log();
console.log('='.repeat(70));
