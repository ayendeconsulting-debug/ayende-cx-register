import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (optional - uncomment if needed)
  // await prisma.auditLog.deleteMany();
  // await prisma.transactionItem.deleteMany();
  // await prisma.transaction.deleteMany();
  // await prisma.customer.deleteMany();
  // await prisma.product.deleteMany();
  // await prisma.category.deleteMany();
  // await prisma.user.deleteMany();

  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ayende-cx.com' },
    update: {},
    create: {
      email: 'admin@ayende-cx.com',
      username: 'admin',
      passwordHash: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.username);

  // 2. Create Cashier User
  const cashierPassword = await bcrypt.hash('cashier123', 10);
  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@ayende-cx.com' },
    update: {},
    create: {
      email: 'cashier@ayende-cx.com',
      username: 'cashier',
      passwordHash: cashierPassword,
      firstName: 'John',
      lastName: 'Cashier',
      role: 'CASHIER',
      isActive: true,
    },
  });
  console.log('✅ Cashier user created:', cashier.username);

  // 3. Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Beverages' },
      update: {},
      create: {
        name: 'Beverages',
        description: 'Drinks and refreshments',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Snacks' },
      update: {},
      create: {
        name: 'Snacks',
        description: 'Chips, crackers, and snacks',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Groceries' },
      update: {},
      create: {
        name: 'Groceries',
        description: 'Daily essentials',
        sortOrder: 3,
      },
    }),
  ]);
  console.log('✅ Categories created:', categories.length);

  // 4. Create Products
  const products = await Promise.all([
    // Beverages
    prisma.product.upsert({
      where: { sku: 'BEV-001' },
      update: {},
      create: {
        sku: 'BEV-001',
        name: 'Coca Cola 500ml',
        description: 'Refreshing cola drink',
        categoryId: categories[0].id,
        price: 2.50,
        costPrice: 1.20,
        stockQuantity: 150,
        lowStockAlert: 20,
        barcode: '12345678901',
        loyaltyPoints: 5,
        isTaxable: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'BEV-002' },
      update: {},
      create: {
        sku: 'BEV-002',
        name: 'Water 1L',
        description: 'Pure drinking water',
        categoryId: categories[0].id,
        price: 1.00,
        costPrice: 0.40,
        stockQuantity: 200,
        lowStockAlert: 30,
        barcode: '12345678902',
        loyaltyPoints: 2,
        isTaxable: false,
      },
    }),
    // Snacks
    prisma.product.upsert({
      where: { sku: 'SNK-001' },
      update: {},
      create: {
        sku: 'SNK-001',
        name: 'Potato Chips',
        description: 'Crispy salted chips',
        categoryId: categories[1].id,
        price: 3.99,
        costPrice: 2.00,
        stockQuantity: 80,
        lowStockAlert: 15,
        barcode: '12345678903',
        loyaltyPoints: 8,
        isTaxable: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'SNK-002' },
      update: {},
      create: {
        sku: 'SNK-002',
        name: 'Chocolate Bar',
        description: 'Milk chocolate',
        categoryId: categories[1].id,
        price: 1.50,
        costPrice: 0.75,
        stockQuantity: 120,
        lowStockAlert: 25,
        barcode: '12345678904',
        loyaltyPoints: 3,
        isTaxable: true,
      },
    }),
    // Groceries
    prisma.product.upsert({
      where: { sku: 'GRC-001' },
      update: {},
      create: {
        sku: 'GRC-001',
        name: 'White Bread',
        description: 'Fresh baked bread',
        categoryId: categories[2].id,
        price: 2.99,
        costPrice: 1.50,
        stockQuantity: 50,
        lowStockAlert: 10,
        barcode: '12345678905',
        loyaltyPoints: 6,
        isTaxable: false,
      },
    }),
  ]);
  console.log('✅ Products created:', products.length);

  // 5. Create Sample Customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: 'john.doe@example.com' },
      update: {},
      create: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        loyaltyPoints: 150,
        totalSpent: 250.00,
        visitCount: 15,
        loyaltyTier: 'SILVER',
        marketingOptIn: true,
      },
    }),
    prisma.customer.upsert({
      where: { email: 'jane.smith@example.com' },
      update: {},
      create: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        loyaltyPoints: 500,
        totalSpent: 1200.00,
        visitCount: 45,
        loyaltyTier: 'GOLD',
        marketingOptIn: true,
      },
    }),
  ]);
  console.log('✅ Customers created:', customers.length);

  // 6. Create System Configuration
  const configs = await Promise.all([
    prisma.systemConfig.upsert({
      where: { key: 'loyalty_points_per_dollar' },
      update: {},
      create: {
        key: 'loyalty_points_per_dollar',
        value: '10',
        description: 'Points earned per dollar spent',
      },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'loyalty_redemption_rate' },
      update: {},
      create: {
        key: 'loyalty_redemption_rate',
        value: '100',
        description: 'Points needed for $1 discount',
      },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'tax_rate' },
      update: {},
      create: {
        key: 'tax_rate',
        value: '0.15',
        description: 'Default tax rate (15%)',
      },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'currency' },
      update: {},
      create: {
        key: 'currency',
        value: 'USD',
        description: 'System currency',
      },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'business_name' },
      update: {},
      create: {
        key: 'business_name',
        value: 'Ayende-CX Store',
        description: 'Business name',
      },
    }),
  ]);
  console.log('✅ System configurations created:', configs.length);

  console.log('🎉 Database seeding completed!');
  console.log('\n📝 Default Login Credentials:');
  console.log('   Admin: username=admin, password=admin123');
  console.log('   Cashier: username=cashier, password=cashier123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
