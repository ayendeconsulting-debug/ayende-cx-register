const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Currency options
const CURRENCIES = {
  '1': { symbol: '$', code: 'CAD', name: 'Canadian Dollar' },
  '2': { symbol: '$', code: 'USD', name: 'US Dollar' },
  '3': { symbol: '₦', code: 'NGN', name: 'Nigerian Naira' },
  '4': { symbol: '₵', code: 'GHS', name: 'Ghanaian Cedi' },
  '5': { symbol: 'KSh', code: 'KES', name: 'Kenyan Shilling' },
  '6': { symbol: 'R', code: 'ZAR', name: 'South African Rand' },
  '7': { symbol: '£', code: 'GBP', name: 'British Pound' },
  '8': { symbol: '€', code: 'EUR', name: 'Euro' },
};

// African/Nigerian names for realistic customer data
const firstNames = [
  'Adebayo', 'Chinwe', 'Emeka', 'Funmilayo', 'Gbenga', 'Halima', 'Ibrahim', 'Jumoke',
  'Kemi', 'Lekan', 'Ngozi', 'Oluwaseun', 'Patience', 'Raheem', 'Sade', 'Tunde',
  'Uchenna', 'Victoria', 'Wasiu', 'Yetunde', 'Zainab', 'Aisha', 'Blessing', 'Chidi',
  'Damilola', 'Ebere', 'Folake', 'Grace', 'Hassan', 'Ife', 'Jide', 'Kehinde',
  'Lawal', 'Musa', 'Nneka', 'Ojo', 'Precious', 'Queen', 'Remi', 'Segun',
  'Taiwo', 'Uche', 'Vincent', 'Wale', 'Xavier', 'Yemi', 'Zara', 'Akin', 'Bola', 'Chinedu'
];

const lastNames = [
  'Okafor', 'Adeleke', 'Mohammed', 'Okonkwo', 'Adeyemi', 'Bello', 'Nwankwo', 'Olayinka',
  'Ibrahim', 'Eze', 'Afolabi', 'Musa', 'Chukwu', 'Hassan', 'Ojo', 'Yusuf',
  'Okoro', 'Adamu', 'Nnadi', 'Sani', 'Obi', 'Usman', 'Okeke', 'Garba',
  'Onyechi', 'Aliyu', 'Nwosu', 'Abubakar', 'Okafor', 'Sadiq', 'Chibueze', 'Lawal',
  'Okoye', 'Bako', 'Emeka', 'Kabir', 'Eze', 'Yaro', 'Chukwuma', 'Isa',
  'Okoli', 'Musa', 'Nneka', 'Danladi', 'Obiora', 'Bashir', 'Chioma', 'Suleiman', 'Obinna', 'Tijani'
];

const phonePrefix = ['0803', '0806', '0810', '0813', '0816', '0903', '0906', '0908'];

// Product categories
const productCategories = [
  { name: 'Main Dishes', description: 'Traditional African main course dishes' },
  { name: 'Rice Dishes', description: 'Jollof, fried rice, and other rice varieties' },
  { name: 'Soups & Stews', description: 'Nigerian soups and stews' },
  { name: 'Grilled & BBQ', description: 'Suya, grilled chicken, fish' },
  { name: 'Appetizers & Snacks', description: 'Small chops, samosas, spring rolls' },
  { name: 'Pastries & Bakes', description: 'Meat pies, sausage rolls, chin chin' },
  { name: 'Drinks & Beverages', description: 'Zobo, Chapman, smoothies' },
  { name: 'Desserts', description: 'Cakes, puff-puff, buns' },
  { name: 'Party Accessories - Hire', description: 'Chairs, tables, canopies for rent' },
  { name: 'Decor - Hire', description: 'Decorative items for events' }
];

// Products (prices will be adjusted based on currency)
const getProducts = (currencyCode) => {
  // Adjust prices based on currency
  const priceMultiplier = {
    'CAD': 1.0,
    'USD': 0.85,
    'NGN': 850,
    'GHS': 12,
    'KES': 120,
    'ZAR': 15,
    'GBP': 0.65,
    'EUR': 0.75
  }[currencyCode] || 1.0;

  const adjustPrice = (basePrice) => Math.round(basePrice * priceMultiplier);

  return [
    // Rice Dishes (base prices in CAD)
    { name: 'Jollof Rice (Per Pack)', sku: 'JR-001', category: 'Rice Dishes', basePrice: 15, stock: 150, lowStockAlert: 20, barcode: '2000000001' },
    { name: 'Fried Rice (Per Pack)', sku: 'FR-001', category: 'Rice Dishes', basePrice: 15, stock: 120, lowStockAlert: 20, barcode: '2000000002' },
    { name: 'Coconut Rice (Per Pack)', sku: 'CR-001', category: 'Rice Dishes', basePrice: 17, stock: 80, lowStockAlert: 15, barcode: '2000000003' },
    { name: 'Native Jollof Rice', sku: 'NJR-001', category: 'Rice Dishes', basePrice: 18, stock: 60, lowStockAlert: 15, barcode: '2000000004' },
    
    // Soups & Stews
    { name: 'Egusi Soup (Per Litre)', sku: 'ES-001', category: 'Soups & Stews', basePrice: 27, stock: 45, lowStockAlert: 10, barcode: '2000000005' },
    { name: 'Banga Soup (Per Litre)', sku: 'BS-001', category: 'Soups & Stews', basePrice: 25, stock: 35, lowStockAlert: 10, barcode: '2000000006' },
    { name: 'Vegetable Soup (Per Litre)', sku: 'VS-001', category: 'Soups & Stews', basePrice: 23, stock: 50, lowStockAlert: 10, barcode: '2000000007' },
    { name: 'Pepper Soup (Per Litre)', sku: 'PS-001', category: 'Soups & Stews', basePrice: 24, stock: 40, lowStockAlert: 10, barcode: '2000000008' },
    { name: 'Ogbono Soup (Per Litre)', sku: 'OS-001', category: 'Soups & Stews', basePrice: 26, stock: 38, lowStockAlert: 10, barcode: '2000000009' },
    
    // Grilled & BBQ
    { name: 'Suya Beef (Per Kg)', sku: 'SB-001', category: 'Grilled & BBQ', basePrice: 39, stock: 25, lowStockAlert: 8, barcode: '2000000010' },
    { name: 'Grilled Chicken (Whole)', sku: 'GC-001', category: 'Grilled & BBQ', basePrice: 33, stock: 40, lowStockAlert: 10, barcode: '2000000011' },
    { name: 'Grilled Fish (Tilapia)', sku: 'GF-001', category: 'Grilled & BBQ', basePrice: 27, stock: 30, lowStockAlert: 8, barcode: '2000000012' },
    { name: 'Asun (Spicy Goat Meat)', sku: 'AS-001', category: 'Grilled & BBQ', basePrice: 42, stock: 20, lowStockAlert: 5, barcode: '2000000013' },
    { name: 'BBQ Chicken Wings (Per Dozen)', sku: 'CW-001', category: 'Grilled & BBQ', basePrice: 29, stock: 35, lowStockAlert: 10, barcode: '2000000014' },
    
    // Appetizers & Snacks
    { name: 'Small Chops Combo (50 Pcs)', sku: 'SC-050', category: 'Appetizers & Snacks', basePrice: 51, stock: 55, lowStockAlert: 15, barcode: '2000000015' },
    { name: 'Small Chops Combo (100 Pcs)', sku: 'SC-100', category: 'Appetizers & Snacks', basePrice: 90, stock: 45, lowStockAlert: 10, barcode: '2000000016' },
    { name: 'Samosas (Per Dozen)', sku: 'SM-012', category: 'Appetizers & Snacks', basePrice: 14, stock: 80, lowStockAlert: 20, barcode: '2000000017' },
    { name: 'Spring Rolls (Per Dozen)', sku: 'SR-012', category: 'Appetizers & Snacks', basePrice: 16, stock: 75, lowStockAlert: 20, barcode: '2000000018' },
    { name: 'Chicken Wings (Per Dozen)', sku: 'CWP-012', category: 'Appetizers & Snacks', basePrice: 21, stock: 60, lowStockAlert: 15, barcode: '2000000019' },
    { name: 'Puff-Puff (Per 50)', sku: 'PP-050', category: 'Appetizers & Snacks', basePrice: 12, stock: 90, lowStockAlert: 25, barcode: '2000000020' },
    
    // Pastries & Bakes
    { name: 'Meat Pies (Per Dozen)', sku: 'MP-012', category: 'Pastries & Bakes', basePrice: 18, stock: 100, lowStockAlert: 25, barcode: '2000000021' },
    { name: 'Sausage Rolls (Per Dozen)', sku: 'SRB-012', category: 'Pastries & Bakes', basePrice: 17, stock: 95, lowStockAlert: 25, barcode: '2000000022' },
    { name: 'Chin Chin (Per Kg)', sku: 'CC-001', category: 'Pastries & Bakes', basePrice: 13, stock: 70, lowStockAlert: 20, barcode: '2000000023' },
    { name: 'Coconut Candy (Per Kg)', sku: 'CCA-001', category: 'Pastries & Bakes', basePrice: 11, stock: 65, lowStockAlert: 15, barcode: '2000000024' },
    { name: 'Buns (Per Dozen)', sku: 'BN-012', category: 'Pastries & Bakes', basePrice: 9, stock: 85, lowStockAlert: 20, barcode: '2000000025' },
    
    // Drinks & Beverages
    { name: 'Zobo Drink (Per Litre)', sku: 'ZB-001', category: 'Drinks & Beverages', basePrice: 7, stock: 120, lowStockAlert: 30, barcode: '2000000026' },
    { name: 'Chapman (Per Litre)', sku: 'CH-001', category: 'Drinks & Beverages', basePrice: 9, stock: 100, lowStockAlert: 25, barcode: '2000000027' },
    { name: 'Fresh Orange Juice (Per Litre)', sku: 'OJ-001', category: 'Drinks & Beverages', basePrice: 11, stock: 90, lowStockAlert: 20, barcode: '2000000028' },
    { name: 'Pineapple Juice (Per Litre)', sku: 'PJ-001', category: 'Drinks & Beverages', basePrice: 11, stock: 85, lowStockAlert: 20, barcode: '2000000029' },
    { name: 'Mango Smoothie (Per Litre)', sku: 'MS-001', category: 'Drinks & Beverages', basePrice: 12, stock: 75, lowStockAlert: 20, barcode: '2000000030' },
    
    // Desserts
    { name: 'Birthday Cake (8 inch)', sku: 'BC-008', category: 'Desserts', basePrice: 72, stock: 15, lowStockAlert: 3, barcode: '2000000031' },
    { name: 'Birthday Cake (10 inch)', sku: 'BC-010', category: 'Desserts', basePrice: 108, stock: 12, lowStockAlert: 3, barcode: '2000000032' },
    { name: 'Wedding Cake (3 Tiers)', sku: 'WC-003', category: 'Desserts', basePrice: 450, stock: 5, lowStockAlert: 1, barcode: '2000000033' },
    { name: 'Cupcakes (Per Dozen)', sku: 'CP-012', category: 'Desserts', basePrice: 27, stock: 40, lowStockAlert: 10, barcode: '2000000034' },
    { name: 'Doughnuts (Per Dozen)', sku: 'DN-012', category: 'Desserts', basePrice: 18, stock: 50, lowStockAlert: 15, barcode: '2000000035' },
    
    // Party Accessories - Hire
    { name: 'Plastic Chairs (White) - Per Chair', sku: 'PC-W01', category: 'Party Accessories - Hire', basePrice: 3, stock: 200, lowStockAlert: 50, barcode: '3000000001' },
    { name: 'Plastic Chairs (Red) - Per Chair', sku: 'PC-R01', category: 'Party Accessories - Hire', basePrice: 3, stock: 150, lowStockAlert: 40, barcode: '3000000002' },
    { name: 'Chiavari Chairs (Gold) - Per Chair', sku: 'CC-G01', category: 'Party Accessories - Hire', basePrice: 9, stock: 100, lowStockAlert: 20, barcode: '3000000003' },
    { name: 'Round Tables (6-Seater)', sku: 'RT-006', category: 'Party Accessories - Hire', basePrice: 15, stock: 50, lowStockAlert: 10, barcode: '3000000004' },
    { name: 'Rectangular Tables (8-Seater)', sku: 'RCT-008', category: 'Party Accessories - Hire', basePrice: 18, stock: 40, lowStockAlert: 10, barcode: '3000000005' },
    { name: 'Canopy (10x10 ft)', sku: 'CN-1010', category: 'Party Accessories - Hire', basePrice: 90, stock: 20, lowStockAlert: 5, barcode: '3000000006' },
    { name: 'Canopy (20x20 ft)', sku: 'CN-2020', category: 'Party Accessories - Hire', basePrice: 150, stock: 15, lowStockAlert: 3, barcode: '3000000007' },
    { name: 'Table Cloths (White)', sku: 'TC-W01', category: 'Party Accessories - Hire', basePrice: 5, stock: 100, lowStockAlert: 25, barcode: '3000000008' },
    { name: 'Table Cloths (Colored)', sku: 'TC-C01', category: 'Party Accessories - Hire', basePrice: 6, stock: 80, lowStockAlert: 20, barcode: '3000000009' },
    { name: 'Chair Covers with Sash', sku: 'CCS-001', category: 'Party Accessories - Hire', basePrice: 5, stock: 150, lowStockAlert: 40, barcode: '3000000010' },
    
    // Decor - Hire
    { name: 'Flower Centerpieces', sku: 'FC-001', category: 'Decor - Hire', basePrice: 21, stock: 30, lowStockAlert: 8, barcode: '4000000001' },
    { name: 'Balloon Arch Kit', sku: 'BA-001', category: 'Decor - Hire', basePrice: 72, stock: 15, lowStockAlert: 3, barcode: '4000000002' },
    { name: 'LED Backdrop Lighting', sku: 'LBL-001', category: 'Decor - Hire', basePrice: 120, stock: 10, lowStockAlert: 2, barcode: '4000000003' },
    { name: 'Photo Booth Props Set', sku: 'PB-001', category: 'Decor - Hire', basePrice: 48, stock: 8, lowStockAlert: 2, barcode: '4000000004' },
    { name: 'Stage Backdrop (White)', sku: 'SB-W01', category: 'Decor - Hire', basePrice: 90, stock: 12, lowStockAlert: 3, barcode: '4000000005' }
  ].map(p => ({
    ...p,
    price: adjustPrice(p.basePrice)
  }));
};

// Generate customers
function generateCustomers() {
  const customers = [];
  const tiers = [
    ...Array(60).fill('BRONZE'),
    ...Array(30).fill('SILVER'),
    ...Array(10).fill('GOLD')
  ];

  for (let i = 0; i < 100; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const phone = `${phonePrefix[Math.floor(Math.random() * phonePrefix.length)]}${Math.floor(1000000 + Math.random() * 9000000)}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`;
    
    const tier = tiers[i];
    let points;
    
    if (tier === 'BRONZE') {
      points = Math.floor(Math.random() * 500);
    } else if (tier === 'SILVER') {
      points = Math.floor(500 + Math.random() * 1500);
    } else {
      points = Math.floor(2000 + Math.random() * 3000);
    }

    customers.push({
      firstName,
      lastName,
      email,
      phone,
      loyaltyTier: tier,
      loyaltyPoints: points,
      dateOfBirth: new Date(1960 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      address: `${Math.floor(Math.random() * 200) + 1} ${['Allen Avenue', 'Victoria Island', 'Lekki Phase 1', 'Surulere', 'Ikeja GRA', 'Ikoyi', 'Yaba', 'Gbagada'][Math.floor(Math.random() * 8)]}, Lagos`
    });
  }

  return customers;
}

async function seedDatabase() {
  console.log('\n🌱 AYENDE-CX POS - MULTI-TENANT SEED SCRIPT');
  console.log('============================================\n');

  // Get Business Info
  console.log('📋 Step 1: Business Information\n');
  const externalTenantId = await question('Enter Ayende-CX Tenant ID (press Enter to skip): ');
  const businessName = await question('Enter Business Name: ');
  const businessEmail = await question('Enter Business Email: ');

  // Get Currency
  console.log('\n💱 Step 2: Currency Selection\n');
  console.log('Available Currencies:');
  Object.entries(CURRENCIES).forEach(([key, curr]) => {
    console.log(`  ${key}. ${curr.name} (${curr.symbol} ${curr.code})`);
  });
  
  const currencyChoice = await question('\nSelect currency (1-8): ');
  const selectedCurrency = CURRENCIES[currencyChoice] || CURRENCIES['3']; // Default to NGN
  
  console.log(`\n✅ Selected: ${selectedCurrency.name} (${selectedCurrency.symbol} ${selectedCurrency.code})\n`);

  // Get Tax Rate
  const taxRateInput = await question('Enter tax rate (e.g., 7.5 for 7.5%): ');
  const taxRate = parseFloat(taxRateInput) / 100 || 0;

  console.log('\n🚀 Starting database seeding...\n');

  try {
    // Clear existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.business.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create Business
    console.log('🏢 Creating Business...');
    const business = await prisma.business.create({
      data: {
        externalTenantId: externalTenantId || null,
        businessName,
        businessEmail,
        currency: selectedCurrency.symbol,
        currencyCode: selectedCurrency.code,
        taxEnabled: true,
        taxRate,
        taxLabel: 'VAT',
        isActive: true
      }
    });
    console.log(`✅ Business created: ${business.businessName}\n`);

    // Create Categories
    console.log('📦 Creating categories...');
    const createdCategories = {};
    for (const category of productCategories) {
      const created = await prisma.category.create({
        data: {
          ...category,
          businessId: business.id
        }
      });
      createdCategories[category.name] = created.id;
      console.log(`   ✓ ${category.name}`);
    }
    console.log(`✅ ${productCategories.length} categories created\n`);

    // Create Products
    console.log('🛍️  Creating products...');
    const products = getProducts(selectedCurrency.code);
    let productCount = 0;
    for (const product of products) {
      await prisma.product.create({
        data: {
          businessId: business.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          description: `Premium ${product.name} for your events and celebrations`,
          price: product.price,
          stockQuantity: product.stock,
          lowStockAlert: product.lowStockAlert,
          categoryId: createdCategories[product.category],
          currency: selectedCurrency.symbol,
          currencyCode: selectedCurrency.code,
          isActive: true
        }
      });
      productCount++;
      if (productCount % 10 === 0) {
        console.log(`   ✓ ${productCount} products created...`);
      }
    }
    console.log(`✅ ${productCount} products created\n`);

    // Create Customers
    console.log('👥 Creating customers...');
    const customers = generateCustomers();
    let customerCount = 0;
    
    for (const customer of customers) {
      await prisma.customer.create({
        data: {
          ...customer,
          businessId: business.id
        }
      });
      customerCount++;
      if (customerCount % 20 === 0) {
        console.log(`   ✓ ${customerCount} customers created...`);
      }
    }
    console.log(`✅ ${customerCount} customers created\n`);

    // Summary
    console.log('📊 SEEDING SUMMARY');
    console.log('==================');
    console.log(`Business: ${business.businessName}`);
    console.log(`Currency: ${selectedCurrency.symbol} ${selectedCurrency.code}`);
    console.log(`Tax Rate: ${(taxRate * 100).toFixed(2)}%`);
    console.log(`Categories: ${productCategories.length}`);
    console.log(`Products: ${productCount}`);
    console.log(`Customers: ${customerCount}`);
    console.log('\n🎉 Database seeding completed successfully!\n');

    // Show tier distribution
    const tierCounts = await prisma.customer.groupBy({
      by: ['loyaltyTier'],
      _count: true,
      where: { businessId: business.id }
    });
    console.log('👥 Customer Loyalty Tier Distribution:');
    tierCounts.forEach(tier => {
      console.log(`   ${tier.loyaltyTier}: ${tier._count} customers`);
    });

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

seedDatabase()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
