// Seed Script - Create Initial Admin User
// Save this as: backend/scripts/createAdmin.cjs

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Username: admin');
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@ayende.com',
        username: 'admin',
        passwordHash: passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('===========================================');
    console.log('  📧 Email:    ', admin.email);
    console.log('  👤 Username: ', admin.username);
    console.log('  🔑 Password: ', 'admin123');
    console.log('  👑 Role:     ', admin.role);
    console.log('===========================================\n');
    console.log('Login credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123\n');

    // Create cashier user
    const cashierPasswordHash = await bcrypt.hash('cashier123', 10);
    
    const cashier = await prisma.user.create({
      data: {
        email: 'cashier@ayende.com',
        username: 'cashier',
        passwordHash: cashierPasswordHash,
        firstName: 'Cashier',
        lastName: 'User',
        role: 'CASHIER',
        isActive: true,
      },
    });

    console.log('✅ Cashier user created successfully!\n');
    console.log('===========================================');
    console.log('  📧 Email:    ', cashier.email);
    console.log('  👤 Username: ', cashier.username);
    console.log('  🔑 Password: ', 'cashier123');
    console.log('  👤 Role:     ', cashier.role);
    console.log('===========================================\n');

  } catch (error) {
    console.error('\n❌ Error creating users:', error.message);
    
    if (error.code === 'P2002') {
      console.log('\n⚠️  User already exists. Try logging in with existing credentials.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin()
  .then(() => {
    console.log('✅ Database seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to seed database:', error);
    process.exit(1);
  });
