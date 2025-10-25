const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

// Product categories for African catering and party business
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

// Products for African catering business
const products = [
  // Main Dishes
  { name: 'Jollof Rice (Per Pack)', sku: 'JR-001', category: 'Rice Dishes', price: 2500, stock: 150, lowStockAlert: 20, barcode: '2000000001' },
  { name: 'Fried Rice (Per Pack)', sku: 'FR-001', category: 'Rice Dishes', price: 2500, stock: 120, lowStockAlert: 20, barcode: '2000000002' },
  { name: 'Coconut Rice (Per Pack)', sku: 'CR-001', category: 'Rice Dishes', price: 2800, stock: 80, lowStockAlert: 15, barcode: '2000000003' },
  { name: 'Native Jollof Rice', sku: 'NJR-001', category: 'Rice Dishes', price: 3000, stock: 60, lowStockAlert: 15, barcode: '2000000004' },
  
  // Soups & Stews
  { name: 'Egusi Soup (Per Litre)', sku: 'ES-001', category: 'Soups & Stews', price: 4500, stock: 45, lowStockAlert: 10, barcode: '2000000005' },
  { name: 'Banga Soup (Per Litre)', sku: 'BS-001', category: 'Soups & Stews', price: 4200, stock: 35, lowStockAlert: 10, barcode: '2000000006' },
  { name: 'Vegetable Soup (Per Litre)', sku: 'VS-001', category: 'Soups & Stews', price: 3800, stock: 50, lowStockAlert: 10, barcode: '2000000007' },
  { name: 'Pepper Soup (Per Litre)', sku: 'PS-001', category: 'Soups & Stews', price: 4000, stock: 40, lowStockAlert: 10, barcode: '2000000008' },
  { name: 'Ogbono Soup (Per Litre)', sku: 'OS-001', category: 'Soups & Stews', price: 4300, stock: 38, lowStockAlert: 10, barcode: '2000000009' },
  
  // Grilled & BBQ
  { name: 'Suya Beef (Per Kg)', sku: 'SB-001', category: 'Grilled & BBQ', price: 6500, stock: 25, lowStockAlert: 8, barcode: '2000000010' },
  { name: 'Grilled Chicken (Whole)', sku: 'GC-001', category: 'Grilled & BBQ', price: 5500, stock: 40, lowStockAlert: 10, barcode: '2000000011' },
  { name: 'Grilled Fish (Tilapia)', sku: 'GF-001', category: 'Grilled & BBQ', price: 4500, stock: 30, lowStockAlert: 8, barcode: '2000000012' },
  { name: 'Asun (Spicy Goat Meat)', sku: 'AS-001', category: 'Grilled & BBQ', price: 7000, stock: 20, lowStockAlert: 5, barcode: '2000000013' },
  { name: 'BBQ Chicken Wings (Per Dozen)', sku: 'CW-001', category: 'Grilled & BBQ', price: 4800, stock: 35, lowStockAlert: 10, barcode: '2000000014' },
  
  // Appetizers & Snacks (Small Chops)
  { name: 'Small Chops Combo (50 Pcs)', sku: 'SC-050', category: 'Appetizers & Snacks', price: 8500, stock: 55, lowStockAlert: 15, barcode: '2000000015' },
  { name: 'Small Chops Combo (100 Pcs)', sku: 'SC-100', category: 'Appetizers & Snacks', price: 15000, stock: 45, lowStockAlert: 10, barcode: '2000000016' },
  { name: 'Samosas (Per Dozen)', sku: 'SM-012', category: 'Appetizers & Snacks', price: 2400, stock: 80, lowStockAlert: 20, barcode: '2000000017' },
  { name: 'Spring Rolls (Per Dozen)', sku: 'SR-012', category: 'Appetizers & Snacks', price: 2600, stock: 75, lowStockAlert: 20, barcode: '2000000018' },
  { name: 'Chicken Wings (Per Dozen)', sku: 'CWP-012', category: 'Appetizers & Snacks', price: 3500, stock: 60, lowStockAlert: 15, barcode: '2000000019' },
  { name: 'Puff-Puff (Per 50)', sku: 'PP-050', category: 'Appetizers & Snacks', price: 2000, stock: 90, lowStockAlert: 25, barcode: '2000000020' },
  
  // Pastries & Bakes
  { name: 'Meat Pies (Per Dozen)', sku: 'MP-012', category: 'Pastries & Bakes', price: 3000, stock: 100, lowStockAlert: 25, barcode: '2000000021' },
  { name: 'Sausage Rolls (Per Dozen)', sku: 'SRB-012', category: 'Pastries & Bakes', price: 2800, stock: 95, lowStockAlert: 25, barcode: '2000000022' },
  { name: 'Chin Chin (Per Kg)', sku: 'CC-001', category: 'Pastries & Bakes', price: 2200, stock: 70, lowStockAlert: 20, barcode: '2000000023' },
  { name: 'Coconut Candy (Per Kg)', sku: 'CCA-001', category: 'Pastries & Bakes', price: 1800, stock: 65, lowStockAlert: 15, barcode: '2000000024' },
  { name: 'Buns (Per Dozen)', sku: 'BN-012', category: 'Pastries & Bakes', price: 1500, stock: 85, lowStockAlert: 20, barcode: '2000000025' },
  
  // Drinks & Beverages
  { name: 'Zobo Drink (Per Litre)', sku: 'ZB-001', category: 'Drinks & Beverages', price: 1200, stock: 120, lowStockAlert: 30, barcode: '2000000026' },
  { name: 'Chapman (Per Litre)', sku: 'CH-001', category: 'Drinks & Beverages', price: 1500, stock: 100, lowStockAlert: 25, barcode: '2000000027' },
  { name: 'Fresh Orange Juice (Per Litre)', sku: 'OJ-001', category: 'Drinks & Beverages', price: 1800, stock: 90, lowStockAlert: 20, barcode: '2000000028' },
  { name: 'Pineapple Juice (Per Litre)', sku: 'PJ-001', category: 'Drinks & Beverages', price: 1800, stock: 85, lowStockAlert: 20, barcode: '2000000029' },
  { name: 'Mango Smoothie (Per Litre)', sku: 'MS-001', category: 'Drinks & Beverages', price: 2000, stock: 75, lowStockAlert: 20, barcode: '2000000030' },
  
  // Desserts
  { name: 'Birthday Cake (8 inch)', sku: 'BC-008', category: 'Desserts', price: 12000, stock: 15, lowStockAlert: 3, barcode: '2000000031' },
  { name: 'Birthday Cake (10 inch)', sku: 'BC-010', category: 'Desserts', price: 18000, stock: 12, lowStockAlert: 3, barcode: '2000000032' },
  { name: 'Wedding Cake (3 Tiers)', sku: 'WC-003', category: 'Desserts', price: 75000, stock: 5, lowStockAlert: 1, barcode: '2000000033' },
  { name: 'Cupcakes (Per Dozen)', sku: 'CP-012', category: 'Desserts', price: 4500, stock: 40, lowStockAlert: 10, barcode: '2000000034' },
  { name: 'Doughnuts (Per Dozen)', sku: 'DN-012', category: 'Desserts', price: 3000, stock: 50, lowStockAlert: 15, barcode: '2000000035' },
  
  // Party Accessories - Hire (Rental Items)
  { name: 'Plastic Chairs (White) - Per Chair', sku: 'PC-W01', category: 'Party Accessories - Hire', price: 500, stock: 200, lowStockAlert: 50, barcode: '3000000001' },
  { name: 'Plastic Chairs (Red) - Per Chair', sku: 'PC-R01', category: 'Party Accessories - Hire', price: 500, stock: 150, lowStockAlert: 40, barcode: '3000000002' },
  { name: 'Chiavari Chairs (Gold) - Per Chair', sku: 'CC-G01', category: 'Party Accessories - Hire', price: 1500, stock: 100, lowStockAlert: 20, barcode: '3000000003' },
  { name: 'Round Tables (6-Seater)', sku: 'RT-006', category: 'Party Accessories - Hire', price: 2500, stock: 50, lowStockAlert: 10, barcode: '3000000004' },
  { name: 'Rectangular Tables (8-Seater)', sku: 'RCT-008', category: 'Party Accessories - Hire', price: 3000, stock: 40, lowStockAlert: 10, barcode: '3000000005' },
  { name: 'Canopy (10x10 ft)', sku: 'CN-1010', category: 'Party Accessories - Hire', price: 15000, stock: 20, lowStockAlert: 5, barcode: '3000000006' },
  { name: 'Canopy (20x20 ft)', sku: 'CN-2020', category: 'Party Accessories - Hire', price: 25000, stock: 15, lowStockAlert: 3, barcode: '3000000007' },
  { name: 'Table Cloths (White)', sku: 'TC-W01', category: 'Party Accessories - Hire', price: 800, stock: 100, lowStockAlert: 25, barcode: '3000000008' },
  { name: 'Table Cloths (Colored)', sku: 'TC-C01', category: 'Party Accessories - Hire', price: 1000, stock: 80, lowStockAlert: 20, barcode: '3000000009' },
  { name: 'Chair Covers with Sash', sku: 'CCS-001', category: 'Party Accessories - Hire', price: 800, stock: 150, lowStockAlert: 40, barcode: '3000000010' },
  
  // Decor - Hire
  { name: 'Flower Centerpieces', sku: 'FC-001', category: 'Decor - Hire', price: 3500, stock: 30, lowStockAlert: 8, barcode: '4000000001' },
  { name: 'Balloon Arch Kit', sku: 'BA-001', category: 'Decor - Hire', price: 12000, stock: 15, lowStockAlert: 3, barcode: '4000000002' },
  { name: 'LED Backdrop Lighting', sku: 'LBL-001', category: 'Decor - Hire', price: 20000, stock: 10, lowStockAlert: 2, barcode: '4000000003' },
  { name: 'Photo Booth Props Set', sku: 'PB-001', category: 'Decor - Hire', price: 8000, stock: 8, lowStockAlert: 2, barcode: '4000000004' },
  { name: 'Stage Backdrop (White)', sku: 'SB-W01', category: 'Decor - Hire', price: 15000, stock: 12, lowStockAlert: 3, barcode: '4000000005' }
];

// Generate customers with loyalty tiers
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
    
    // Points based on tier
    if (tier === 'BRONZE') {
      points = Math.floor(Math.random() * 500); // 0-499
    } else if (tier === 'SILVER') {
      points = Math.floor(500 + Math.random() * 1500); // 500-1999
    } else { // GOLD
      points = Math.floor(2000 + Math.random() * 3000); // 2000-4999
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
  console.log('🌱 Starting database seeding...\n');

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Cleaning existing data...');
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.customer.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create categories
    console.log('📦 Creating categories...');
    const createdCategories = {};
    for (const category of productCategories) {
      const created = await prisma.category.create({
        data: category
      });
      createdCategories[category.name] = created.id;
      console.log(`   ✓ ${category.name}`);
    }
    console.log(`✅ ${productCategories.length} categories created\n`);

    // Create products
    console.log('🛍️  Creating products...');
    let productCount = 0;
    for (const product of products) {
      await prisma.product.create({
        data: {
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          description: `Premium ${product.name} for your events and celebrations`,
          price: product.price,
          stockQuantity: product.stock,
          lowStockAlert: product.lowStockAlert,
          categoryId: createdCategories[product.category],
          isActive: true
        }
      });
      productCount++;
      if (productCount % 10 === 0) {
        console.log(`   ✓ ${productCount} products created...`);
      }
    }
    console.log(`✅ ${productCount} products created\n`);

    // Create customers
    console.log('👥 Creating customers...');
    const customers = generateCustomers();
    let customerCount = 0;
    
    for (const customer of customers) {
      await prisma.customer.create({
        data: customer
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
    console.log(`✅ Categories: ${productCategories.length}`);
    console.log(`✅ Products: ${productCount}`);
    console.log(`✅ Customers: ${customerCount}`);
    console.log('\n🎉 Database seeding completed successfully!\n');

    // Show customer tier distribution
    const tierCounts = await prisma.customer.groupBy({
      by: ['loyaltyTier'],
      _count: true
    });
    console.log('👥 Customer Loyalty Tier Distribution:');
    tierCounts.forEach(tier => {
      console.log(`   ${tier.loyaltyTier}: ${tier._count} customers`);
    });

    // Show category product counts
    console.log('\n📦 Products per Category:');
    const categoryProducts = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    categoryProducts.forEach(cat => {
      console.log(`   ${cat.name}: ${cat._count.products} products`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedDatabase()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
