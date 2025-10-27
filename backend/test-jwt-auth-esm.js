import jwt from 'jsonwebtoken';
import axios from 'axios';

const secret = '31YMBwf4R4OetvSJ/nIf+5D1ndnMxruRL1QcJsCM9jM=';
const tenantId = 'e6fa01f0-857a-4e23-bc86-346a816cd4f4';

const token = jwt.sign(
  { 
    iss: 'ayende-pos', 
    sub: 'system-to-system', 
    tenantId, 
    scope: 'integration' 
  },
  secret,
  { expiresIn: '1h' }
);

console.log('Generated Token:', token.substring(0, 50) + '...');
console.log('');
console.log('Testing CRM authentication...');
console.log('');

// Test customer endpoint
try {
  const response = await axios.post('http://localhost:8000/api/v1/sync/customer', 
    { 
      customerId: 'test-123',
      tenantId: tenantId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    },
    { 
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId
      }
    }
  );
  
  console.log('✓ SUCCESS! CRM accepted the request');
  console.log('Status:', response.status);
  console.log('Response:', response.data);
} catch (error) {
  console.log('✗ FAILED! CRM rejected the request');
  console.log('Status:', error.response?.status);
  console.log('Error:', error.response?.data);
  console.log('');
  if (error.response?.status === 401) {
    console.log('This means the Authorization header is missing or invalid!');
  }
  if (error.response?.status === 404) {
    console.log('Tenant not found in CRM!');
  }
}
