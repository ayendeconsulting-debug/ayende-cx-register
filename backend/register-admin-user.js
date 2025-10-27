// register-admin-user.js
/**
 * Register an admin user for testing
 * Note: Role assignment might need to be done in database
 */

const POS_URL = 'http://localhost:5000';
const BUSINESS_ID = 'e6fa01f0-857a-4e23-bc86-346a816cd4f4';

const adminUser = {
  email: 'admin@ayendecx.com',
  username: 'testadmin',
  password: 'Admin123456',
  firstName: 'Test',
  lastName: 'Admin',
  businessId: BUSINESS_ID,
};

async function registerAdmin() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  REGISTER ADMIN USER                                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('Step 1: Register new user...');
  console.log(`  Username: ${adminUser.username}`);
  console.log(`  Email: ${adminUser.email}`);
  console.log(`  Password: ${adminUser.password}\n`);

  try {
    const response = await fetch(`${POS_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminUser),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Registration failed:');
      console.error(JSON.stringify(data, null, 2));
      
      if (data.message && data.message.includes('already exists')) {
        console.log('\n✓ User already exists!');
        console.log('\nProceed to Step 2 to upgrade to admin...');
      } else {
        return;
      }
    } else {
      console.log('✓ User registered successfully!');
      console.log(`  ID: ${data.data.user.id}`);
      console.log(`  Current Role: ${data.data.user.role}\n`);
    }

    console.log('Step 2: Update user role to ADMIN');
    console.log('\nRun this SQL command in PostgreSQL:\n');
    console.log('psql -U postgres -d ayende_cx_db -c "UPDATE \\"User\\" SET role = \'ADMIN\' WHERE username = \'testadmin\';"');
    console.log('\nOr connect to psql and run:');
    console.log(`UPDATE "User" SET role = 'ADMIN' WHERE username = 'testadmin';`);
    console.log('\nAfter updating the role, your credentials will be:');
    console.log(`  Username: ${adminUser.username}`);
    console.log(`  Password: ${adminUser.password}`);
    console.log(`  Role: ADMIN`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

registerAdmin();
