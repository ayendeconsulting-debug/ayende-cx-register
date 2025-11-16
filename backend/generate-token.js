import jwt from 'jsonwebtoken';

const INTEGRATION_SECRET = 'CEMIQ6NfAMlh5pxB32Pma7jMt7a/OExkhJAyOCyaRAA=';

const payload = {
  iss: 'ayende-pos',
  scope: 'integration',
  tenantId: 'a-cx-zcq3y',  // BASH EVENTS tenant UUID from CRM
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)  // 24 hours
};

const token = jwt.sign(payload, INTEGRATION_SECRET);

console.log('\nJWT Token for BASH EVENTS:');
console.log(token);
console.log('\nPayload:', JSON.stringify(payload, null, 2));
