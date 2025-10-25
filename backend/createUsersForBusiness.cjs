const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const BUSINESS_ID = 'e5c8121b-aaf2-48ee-a0cb-50b479e53f23';

async function createUsers() {
  console.log('\n👥 Creating Users for Multi-Tenant Business');
  console.log('==========================================\n');
  console.log(`Business ID: ${BUSINESS_ID}\n`);

  try {
    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: BUSINESS_ID }
    });

    if (!business) {
      console.error('❌ Business not found!');
      return;
    }

    console.log(`✅ Business found: ${business.businessName}`);
    console.log(`   Currency: ${business.currency} ${business.currencyCode}\n`);

    // Check if users already exist
    const existingAdmin = await prisma.user.findFirst({
      where: {
        businessId: BUSINESS_ID,
        username: 'admin'
      }
    });

    const existingCashier = await prisma.user.findFirst({
      where: {
        businessId: BUSINESS_ID,
        username: 'cashier'
      }
    });

    // Create admin user
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists, skipping...');
    } else {
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      
      const admin = await prisma.user.create({
        data: {
          businessId: BUSINESS_ID,
          email: 'admin@business.com',
          username: 'admin',
          passwordHash: adminPasswordHash,
          firstName: 'Admin',
          lastName: 'User',
          role: 'SUPER_ADMIN',
          isActive: true
        }
      });

      console.log('✅ Admin user created successfully!');
      console.log(`   Username: admin`);
      console.log(`   Password: admin123`);
      console.log(`   Role: SUPER_ADMIN`);
      console.log(`   Email: admin@business.com\n`);
    }

    // Create cashier user
    if (existingCashier) {
      console.log('⚠️  Cashier user already exists, skipping...');
    } else {
      const cashierPasswordHash = await bcrypt.hash('cashier123', 10);
      
      const cashier = await prisma.user.create({
        data: {
          businessId: BUSINESS_ID,
          email: 'cashier@business.com',
          username: 'cashier',
          passwordHash: cashierPasswordHash,
          firstName: 'Cashier',
          lastName: 'User',
          role: 'CASHIER',
          isActive: true
        }
      });

      console.log('✅ Cashier user created successfully!');
      console.log(`   Username: cashier`);
      console.log(`   Password: cashier123`);
      console.log(`   Role: CASHIER`);
      console.log(`   Email: cashier@business.com\n`);
    }

    // Create inventory manager user
    const existingInventory = await prisma.user.findFirst({
      where: {
        businessId: BUSINESS_ID,
        username: 'inventory'
      }
    });

    if (existingInventory) {
      console.log('⚠️  Inventory manager user already exists, skipping...');
    } else {
      const inventoryPasswordHash = await bcrypt.hash('inventory123', 10);
      
      const inventory = await prisma.user.create({
        data: {
          businessId: BUSINESS_ID,
          email: 'inventory@business.com',
          username: 'inventory',
          passwordHash: inventoryPasswordHash,
          firstName: 'Inventory',
          lastName: 'Manager',
          role: 'INVENTORY_MANAGER',
          isActive: true
        }
      });

      console.log('✅ Inventory manager user created successfully!');
      console.log(`   Username: inventory`);
      console.log(`   Password: inventory123`);
      console.log(`   Role: INVENTORY_MANAGER`);
      console.log(`   Email: inventory@business.com\n`);
    }

    console.log('🎉 User creation completed!\n');
    console.log('📋 Summary of Users:');
    console.log('═══════════════════════════════════════');
    console.log('Admin (SUPER_ADMIN):');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('');
    console.log('Cashier (CASHIER):');
    console.log('  Username: cashier');
    console.log('  Password: cashier123');
    console.log('');
    console.log('Inventory Manager (INVENTORY_MANAGER):');
    console.log('  Username: inventory');
    console.log('  Password: inventory123');
    console.log('═══════════════════════════════════════\n');

    // Show all users in this business
    const allUsers = await prisma.user.findMany({
      where: { businessId: BUSINESS_ID },
      select: {
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true,
        isActive: true
      }
    });

    console.log(`Total users in business: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.role}) - ${user.firstName} ${user.lastName}`);
    });
    console.log('');

  } catch (error) {
    console.error('\n❌ Error creating users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createUsers()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
