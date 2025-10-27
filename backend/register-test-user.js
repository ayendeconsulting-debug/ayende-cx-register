// register-test-user.js
/**
 * Register a new test user for integration testing
 */

const POS_URL = 'http://localhost:5000';

const newUser = {
  email: 'testuser@ayendecx.com',
  username: 'testuser',
  password: 'Test123456',
  firstName: 'Test',
  lastName: 'User',
  businessId: 'e6fa01f0-857a-4e23-bc86-346a816cd4f4',
};

async function registerUser() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  REGISTER TEST USER                                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('Creating user:');
  console.log(`  Username: ${newUser.username}`);
  console.log(`  Email: ${newUser.email}`);
  console.log(`  Password: ${newUser.password}`);
  console.log(`  Name: ${newUser.firstName} ${newUser.lastName}`);

  try {
    const response = await fetch(`${POS_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('\n❌ Registration failed:');
      console.error(JSON.stringify(data, null, 2));
      
      if (data.message && data.message.includes('already exists')) {
        console.log('\n✓ User already exists! You can use these credentials:');
        console.log(`  Username: ${newUser.username}`);
        console.log(`  Password: ${newUser.password}`);
      }
      return;
    }

    console.log('\n✓ User registered successfully!');
    console.log('\nUser details:');
    console.log(`  ID: ${data.data.user.id}`);
    console.log(`  Username: ${data.data.user.username}`);
    console.log(`  Email: ${data.data.user.email}`);
    console.log(`  Role: ${data.data.user.role}`);
    console.log(`  Business ID: ${data.data.user.businessId}`);

    console.log('\n✓ You can now use these credentials in your tests:');
    console.log(`  Username: ${newUser.username}`);
    console.log(`  Password: ${newUser.password}`);

    console.log('\n📝 Update test-authenticated-integration.js with:');
    console.log(`const TEST_USER = {`);
    console.log(`  username: '${newUser.username}',`);
    console.log(`  password: '${newUser.password}',`);
    console.log(`};`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

registerUser();
