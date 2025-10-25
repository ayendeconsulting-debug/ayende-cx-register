import prisma from './src/config/database.js';
import { hashPassword } from './src/utils/auth.js';

/**
 * Seed Script for BASH EVENTS
 * A Party Catering and Accessories Rental Business
 * 
 * This script seeds:
 * - Business details
 * - Categories (Catering, Decorations, Tables & Chairs, Audio/Visual, Party Supplies)
 * - Products (50 party-related items)
 * - Sample customers (20 party planners and event organizers)
 * - Users (admin, cashier, inventory manager)
 */

async function seedBashEvents() {
  console.log('🎉 Starting BASH EVENTS seed...');

  // Get BASH EVENTS business ID (assuming it was created manually)
  // Replace this with your actual business ID
  const BUSINESS_ID = 'YOUR_BASH_EVENTS_BUSINESS_ID'; // ⚠️ UPDATE THIS!

  try {
    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: BUSINESS_ID }
    });

    if (!business) {
      console.error('❌ Business not found. Please update BUSINESS_ID in the script.');
      console.log('💡 Run this query to get your business ID:');
      console.log('   SELECT id, "businessName" FROM "Business" WHERE "businessName" = \'BASH EVENTS\';');
      return;
    }

    console.log(`✅ Found business: ${business.businessName}`);

    // 1. Create Users
    console.log('\n👤 Creating users...');
    const users = await Promise.all([
      prisma.user.create({
        data: {
          businessId: BUSINESS_ID,
          email: 'admin@bashevents.com',
          username: 'bash_admin',
          passwordHash: await hashPassword('bash_admin123'),
          firstName: 'Sarah',
          lastName: 'Thompson',
          role: 'SUPER_ADMIN',
          isActive: true
        }
      }),
      prisma.user.create({
        data: {
          businessId: BUSINESS_ID,
          email: 'cashier@bashevents.com',
          username: 'bash_cashier',
          passwordHash: await hashPassword('bash_cashier123'),
          firstName: 'Michael',
          lastName: 'Davis',
          role: 'CASHIER',
          isActive: true
        }
      }),
      prisma.user.create({
        data: {
          businessId: BUSINESS_ID,
          email: 'inventory@bashevents.com',
          username: 'bash_inventory',
          passwordHash: await hashPassword('bash_inventory123'),
          firstName: 'Jennifer',
          lastName: 'Martinez',
          role: 'INVENTORY_MANAGER',
          isActive: true
        }
      })
    ]);
    console.log(`✅ Created ${users.length} users`);

    // 2. Create Categories
    console.log('\n📁 Creating categories...');
    const categories = await Promise.all([
      prisma.category.create({
        data: {
          businessId: BUSINESS_ID,
          name: 'Catering & Food',
          description: 'Food platters, drinks, and catering services',
          sortOrder: 1,
          isActive: true
        }
      }),
      prisma.category.create({
        data: {
          businessId: BUSINESS_ID,
          name: 'Decorations',
          description: 'Balloons, banners, centerpieces, and decorative items',
          sortOrder: 2,
          isActive: true
        }
      }),
      prisma.category.create({
        data: {
          businessId: BUSINESS_ID,
          name: 'Tables & Chairs',
          description: 'Tables, chairs, and seating arrangements',
          sortOrder: 3,
          isActive: true
        }
      }),
      prisma.category.create({
        data: {
          businessId: BUSINESS_ID,
          name: 'Audio/Visual Equipment',
          description: 'Sound systems, projectors, lighting, and AV equipment',
          sortOrder: 4,
          isActive: true
        }
      }),
      prisma.category.create({
        data: {
          businessId: BUSINESS_ID,
          name: 'Party Supplies',
          description: 'Plates, cups, utensils, and party essentials',
          sortOrder: 5,
          isActive: true
        }
      }),
      prisma.category.create({
        data: {
          businessId: BUSINESS_ID,
          name: 'Tents & Canopies',
          description: 'Outdoor tents, canopies, and weather protection',
          sortOrder: 6,
          isActive: true
        }
      })
    ]);
    console.log(`✅ Created ${categories.length} categories`);

    // 3. Create Products
    console.log('\n📦 Creating products...');
    const products = [
      // Catering & Food
      { name: 'Premium Buffet Package (50 pax)', sku: 'CAT-BUFF-50', categoryId: categories[0].id, price: 2500.00, costPrice: 1500.00, stockQuantity: 10, lowStockAlert: 3, unit: 'package', description: 'Complete buffet service for 50 people including appetizers, main course, and dessert', loyaltyPoints: 250 },
      { name: 'Cocktail Hour Package', sku: 'CAT-COCK-01', categoryId: categories[0].id, price: 800.00, costPrice: 450.00, stockQuantity: 15, lowStockAlert: 5, unit: 'package', description: 'Assorted finger foods and drinks for cocktail hour', loyaltyPoints: 80 },
      { name: 'BBQ Grill Station Setup', sku: 'CAT-BBQ-01', categoryId: categories[0].id, price: 1200.00, costPrice: 700.00, stockQuantity: 5, lowStockAlert: 2, unit: 'setup', description: 'Live BBQ grill station with chef', loyaltyPoints: 120 },
      { name: 'Wedding Cake (3-tier)', sku: 'CAT-CAKE-03', categoryId: categories[0].id, price: 450.00, costPrice: 250.00, stockQuantity: 8, lowStockAlert: 3, unit: 'cake', description: 'Custom 3-tier wedding cake', loyaltyPoints: 45 },
      { name: 'Beverage Station', sku: 'CAT-BEV-01', categoryId: categories[0].id, price: 350.00, costPrice: 180.00, stockQuantity: 20, lowStockAlert: 5, unit: 'station', description: 'Soft drinks, juice, and water station', loyaltyPoints: 35 },

      // Decorations
      { name: 'Balloon Arch Kit (Large)', sku: 'DEC-ARCH-L', categoryId: categories[1].id, price: 250.00, costPrice: 120.00, stockQuantity: 25, lowStockAlert: 8, unit: 'kit', description: 'Complete balloon arch kit with stand', loyaltyPoints: 25 },
      { name: 'Centerpiece Set (10 tables)', sku: 'DEC-CENT-10', categoryId: categories[1].id, price: 500.00, costPrice: 280.00, stockQuantity: 15, lowStockAlert: 5, unit: 'set', description: 'Elegant floral centerpieces for 10 tables', loyaltyPoints: 50 },
      { name: 'LED String Lights (100ft)', sku: 'DEC-LED-100', categoryId: categories[1].id, price: 180.00, costPrice: 90.00, stockQuantity: 30, lowStockAlert: 10, unit: 'roll', description: 'Warm white LED string lights', loyaltyPoints: 18 },
      { name: 'Backdrop Stand (8x8ft)', sku: 'DEC-BACK-88', categoryId: categories[1].id, price: 200.00, costPrice: 100.00, stockQuantity: 12, lowStockAlert: 4, unit: 'stand', description: 'Adjustable backdrop stand with draping', loyaltyPoints: 20 },
      { name: 'Flower Wall Panel', sku: 'DEC-WALL-01', categoryId: categories[1].id, price: 450.00, costPrice: 220.00, stockQuantity: 8, lowStockAlert: 3, unit: 'panel', description: 'Artificial flower wall panel for photos', loyaltyPoints: 45 },
      { name: 'Table Runner (Gold)', sku: 'DEC-RUN-GLD', categoryId: categories[1].id, price: 15.00, costPrice: 7.00, stockQuantity: 100, lowStockAlert: 30, unit: 'piece', description: 'Elegant gold sequin table runner', loyaltyPoints: 2 },
      { name: 'Lantern Set (12 pcs)', sku: 'DEC-LANT-12', categoryId: categories[1].id, price: 120.00, costPrice: 60.00, stockQuantity: 20, lowStockAlert: 8, unit: 'set', description: 'Hanging paper lanterns in assorted colors', loyaltyPoints: 12 },

      // Tables & Chairs
      { name: 'Round Table (6ft)', sku: 'FUR-TBL-6R', categoryId: categories[2].id, price: 25.00, costPrice: 15.00, stockQuantity: 50, lowStockAlert: 15, unit: 'piece', description: 'White round banquet table (seats 8)', loyaltyPoints: 3 },
      { name: 'Rectangle Table (8ft)', sku: 'FUR-TBL-8R', categoryId: categories[2].id, price: 30.00, costPrice: 18.00, stockQuantity: 40, lowStockAlert: 12, unit: 'piece', description: 'Rectangle folding table', loyaltyPoints: 3 },
      { name: 'Chiavari Chair (Gold)', sku: 'FUR-CHR-GLD', categoryId: categories[2].id, price: 8.00, costPrice: 4.00, stockQuantity: 200, lowStockAlert: 50, unit: 'piece', description: 'Elegant gold chiavari chair', loyaltyPoints: 1 },
      { name: 'Folding Chair (White)', sku: 'FUR-CHR-WHT', categoryId: categories[2].id, price: 5.00, costPrice: 2.50, stockQuantity: 300, lowStockAlert: 80, unit: 'piece', description: 'Standard white folding chair', loyaltyPoints: 1 },
      { name: 'High Bar Table', sku: 'FUR-BAR-01', categoryId: categories[2].id, price: 35.00, costPrice: 20.00, stockQuantity: 25, lowStockAlert: 8, unit: 'piece', description: 'Cocktail high bar table', loyaltyPoints: 4 },
      { name: 'Kids Table Set', sku: 'FUR-KIDS-01', categoryId: categories[2].id, price: 40.00, costPrice: 22.00, stockQuantity: 15, lowStockAlert: 5, unit: 'set', description: 'Colorful kids table with 4 chairs', loyaltyPoints: 4 },

      // Audio/Visual Equipment
      { name: 'PA Sound System (Medium)', sku: 'AV-PA-MED', categoryId: categories[3].id, price: 400.00, costPrice: 200.00, stockQuantity: 8, lowStockAlert: 3, unit: 'system', description: 'Complete PA system with speakers and mixer', loyaltyPoints: 40 },
      { name: 'Wireless Microphone Set', sku: 'AV-MIC-WIRE', categoryId: categories[3].id, price: 80.00, costPrice: 40.00, stockQuantity: 15, lowStockAlert: 5, unit: 'set', description: 'Dual wireless microphone system', loyaltyPoints: 8 },
      { name: 'DJ Lighting Package', sku: 'AV-LIGHT-DJ', categoryId: categories[3].id, price: 350.00, costPrice: 180.00, stockQuantity: 10, lowStockAlert: 3, unit: 'package', description: 'Moving head lights and effects', loyaltyPoints: 35 },
      { name: 'Projector & Screen (120")', sku: 'AV-PROJ-120', categoryId: categories[3].id, price: 250.00, costPrice: 130.00, stockQuantity: 6, lowStockAlert: 2, unit: 'set', description: 'HD projector with 120" screen', loyaltyPoints: 25 },
      { name: 'Uplighting Set (8 lights)', sku: 'AV-UP-08', categoryId: categories[3].id, price: 200.00, costPrice: 100.00, stockQuantity: 12, lowStockAlert: 4, unit: 'set', description: 'LED uplighting for venue ambiance', loyaltyPoints: 20 },
      { name: 'Dance Floor (12x12ft)', sku: 'AV-DANCE-12', categoryId: categories[3].id, price: 600.00, costPrice: 350.00, stockQuantity: 5, lowStockAlert: 2, unit: 'floor', description: 'Portable LED dance floor', loyaltyPoints: 60 },

      // Party Supplies
      { name: 'Disposable Plate Set (100)', sku: 'SUP-PLT-100', categoryId: categories[4].id, price: 45.00, costPrice: 22.00, stockQuantity: 50, lowStockAlert: 15, unit: 'set', description: 'Elegant disposable plates', loyaltyPoints: 5 },
      { name: 'Cutlery Set (100 sets)', sku: 'SUP-CUT-100', categoryId: categories[4].id, price: 35.00, costPrice: 18.00, stockQuantity: 60, lowStockAlert: 20, unit: 'set', description: 'Plastic cutlery sets', loyaltyPoints: 4 },
      { name: 'Champagne Flutes (50)', sku: 'SUP-FLUTE-50', categoryId: categories[4].id, price: 30.00, costPrice: 15.00, stockQuantity: 40, lowStockAlert: 12, unit: 'set', description: 'Plastic champagne flutes', loyaltyPoints: 3 },
      { name: 'Napkin Set (200)', sku: 'SUP-NAP-200', categoryId: categories[4].id, price: 25.00, costPrice: 12.00, stockQuantity: 70, lowStockAlert: 20, unit: 'pack', description: 'Premium paper napkins', loyaltyPoints: 3 },
      { name: 'Table Cloth (60x120)', sku: 'SUP-CLOTH-W', categoryId: categories[4].id, price: 18.00, costPrice: 9.00, stockQuantity: 80, lowStockAlert: 25, unit: 'piece', description: 'White polyester tablecloth', loyaltyPoints: 2 },
      { name: 'Serving Platter Set', sku: 'SUP-PLAT-01', categoryId: categories[4].id, price: 55.00, costPrice: 28.00, stockQuantity: 30, lowStockAlert: 10, unit: 'set', description: 'Assorted serving platters', loyaltyPoints: 6 },
      { name: 'Chafing Dish (Full Size)', sku: 'SUP-CHAF-FULL', categoryId: categories[4].id, price: 40.00, costPrice: 20.00, stockQuantity: 25, lowStockAlert: 8, unit: 'piece', description: 'Full-size chafing dish with fuel', loyaltyPoints: 4 },
      { name: 'Ice Bucket (Large)', sku: 'SUP-ICE-LRG', categoryId: categories[4].id, price: 20.00, costPrice: 10.00, stockQuantity: 35, lowStockAlert: 10, unit: 'piece', description: 'Large acrylic ice bucket', loyaltyPoints: 2 },

      // Tents & Canopies
      { name: 'Party Tent (20x20ft)', sku: 'TENT-2020', categoryId: categories[5].id, price: 800.00, costPrice: 450.00, stockQuantity: 8, lowStockAlert: 3, unit: 'tent', description: 'White party tent with sidewalls', loyaltyPoints: 80 },
      { name: 'Pop-up Canopy (10x10ft)', sku: 'TENT-POPUP-10', categoryId: categories[5].id, price: 150.00, costPrice: 80.00, stockQuantity: 20, lowStockAlert: 6, unit: 'canopy', description: 'Instant pop-up canopy', loyaltyPoints: 15 },
      { name: 'Tent Sidewall (20ft)', sku: 'TENT-WALL-20', categoryId: categories[5].id, price: 50.00, costPrice: 25.00, stockQuantity: 30, lowStockAlert: 10, unit: 'piece', description: 'Clear sidewall panel', loyaltyPoints: 5 },
      { name: 'Tent Heater (Propane)', sku: 'TENT-HEAT-01', categoryId: categories[5].id, price: 120.00, costPrice: 60.00, stockQuantity: 10, lowStockAlert: 3, unit: 'heater', description: 'Outdoor propane heater', loyaltyPoints: 12 },
      { name: 'Tent Lighting Kit', sku: 'TENT-LIGHT-01', categoryId: categories[5].id, price: 100.00, costPrice: 50.00, stockQuantity: 15, lowStockAlert: 5, unit: 'kit', description: 'String lights for tent interior', loyaltyPoints: 10 },
      { name: 'Tent Flooring (per sq ft)', sku: 'TENT-FLOOR-01', categoryId: categories[5].id, price: 3.00, costPrice: 1.50, stockQuantity: 500, lowStockAlert: 150, unit: 'sq ft', description: 'Interlocking tent flooring', loyaltyPoints: 1 },

      // Additional specialty items
      { name: 'Red Carpet Runner (25ft)', sku: 'SPEC-CARPET-25', categoryId: categories[1].id, price: 85.00, costPrice: 45.00, stockQuantity: 12, lowStockAlert: 4, unit: 'runner', description: 'VIP red carpet runner', loyaltyPoints: 9 },
      { name: 'Photo Booth Package', sku: 'SPEC-PHOTO-01', categoryId: categories[3].id, price: 500.00, costPrice: 250.00, stockQuantity: 5, lowStockAlert: 2, unit: 'package', description: 'Complete photo booth with props', loyaltyPoints: 50 },
      { name: 'Chocolate Fountain (Large)', sku: 'SPEC-CHOC-LRG', categoryId: categories[0].id, price: 300.00, costPrice: 150.00, stockQuantity: 4, lowStockAlert: 2, unit: 'fountain', description: '5-tier chocolate fountain', loyaltyPoints: 30 },
      { name: 'Popcorn Machine', sku: 'SPEC-POP-01', categoryId: categories[0].id, price: 100.00, costPrice: 50.00, stockQuantity: 8, lowStockAlert: 3, unit: 'machine', description: 'Commercial popcorn maker', loyaltyPoints: 10 },
      { name: 'Cotton Candy Machine', sku: 'SPEC-CANDY-01', categoryId: categories[0].id, price: 120.00, costPrice: 60.00, stockQuantity: 6, lowStockAlert: 2, unit: 'machine', description: 'Cotton candy maker with supplies', loyaltyPoints: 12 },
      { name: 'Champagne Tower (7 tier)', sku: 'SPEC-TOWER-07', categoryId: categories[4].id, price: 150.00, costPrice: 75.00, stockQuantity: 5, lowStockAlert: 2, unit: 'tower', description: 'Acrylic champagne tower', loyaltyPoints: 15 },
      { name: 'Stage Platform (4x8ft)', sku: 'SPEC-STAGE-48', categoryId: categories[2].id, price: 100.00, costPrice: 55.00, stockQuantity: 20, lowStockAlert: 8, unit: 'section', description: 'Modular stage platform section', loyaltyPoints: 10 },
      { name: 'Generator (5000W)', sku: 'SPEC-GEN-5K', categoryId: categories[3].id, price: 250.00, costPrice: 130.00, stockQuantity: 6, lowStockAlert: 2, unit: 'generator', description: 'Portable power generator', loyaltyPoints: 25 },
      { name: 'Coat Check System', sku: 'SPEC-COAT-01', categoryId: categories[4].id, price: 150.00, costPrice: 75.00, stockQuantity: 8, lowStockAlert: 3, unit: 'system', description: 'Numbered coat check system', loyaltyPoints: 15 },
      { name: 'VIP Velvet Rope (6ft)', sku: 'SPEC-ROPE-06', categoryId: categories[1].id, price: 60.00, costPrice: 30.00, stockQuantity: 15, lowStockAlert: 5, unit: 'set', description: 'Stanchion with velvet rope', loyaltyPoints: 6 }
    ];

    const createdProducts = [];
    for (const product of products) {
      const created = await prisma.product.create({
        data: {
          businessId: BUSINESS_ID,
          ...product,
          currency: business.currency,
          currencyCode: business.currencyCode,
          isTaxable: true,
          isActive: true
        }
      });
      createdProducts.push(created);
    }
    console.log(`✅ Created ${createdProducts.length} products`);

    // 4. Create Sample Customers
    console.log('\n👥 Creating sample customers...');
    const customers = [
      { firstName: 'Emily', lastName: 'Johnson', email: 'emily.j@email.com', phone: '555-0101', loyaltyTier: 'GOLD' },
      { firstName: 'David', lastName: 'Williams', email: 'david.w@email.com', phone: '555-0102', loyaltyTier: 'SILVER' },
      { firstName: 'Jessica', lastName: 'Brown', email: 'jessica.b@email.com', phone: '555-0103', loyaltyTier: 'BRONZE' },
      { firstName: 'Robert', lastName: 'Garcia', email: 'robert.g@email.com', phone: '555-0104', loyaltyTier: 'GOLD' },
      { firstName: 'Amanda', lastName: 'Martinez', email: 'amanda.m@email.com', phone: '555-0105', loyaltyTier: 'SILVER' },
      { firstName: 'Christopher', lastName: 'Rodriguez', email: 'chris.r@email.com', phone: '555-0106', loyaltyTier: 'BRONZE' },
      { firstName: 'Michelle', lastName: 'Wilson', email: 'michelle.w@email.com', phone: '555-0107', loyaltyTier: 'GOLD' },
      { firstName: 'Daniel', lastName: 'Anderson', email: 'daniel.a@email.com', phone: '555-0108', loyaltyTier: 'SILVER' },
      { firstName: 'Lisa', lastName: 'Taylor', email: 'lisa.t@email.com', phone: '555-0109', loyaltyTier: 'BRONZE' },
      { firstName: 'James', lastName: 'Thomas', email: 'james.t@email.com', phone: '555-0110', loyaltyTier: 'GOLD' },
      { firstName: 'Patricia', lastName: 'Moore', email: 'patricia.m@email.com', phone: '555-0111', loyaltyTier: 'SILVER' },
      { firstName: 'Richard', lastName: 'Jackson', email: 'richard.j@email.com', phone: '555-0112', loyaltyTier: 'BRONZE' },
      { firstName: 'Maria', lastName: 'White', email: 'maria.w@email.com', phone: '555-0113', loyaltyTier: 'GOLD' },
      { firstName: 'Charles', lastName: 'Harris', email: 'charles.h@email.com', phone: '555-0114', loyaltyTier: 'SILVER' },
      { firstName: 'Nancy', lastName: 'Martin', email: 'nancy.m@email.com', phone: '555-0115', loyaltyTier: 'BRONZE' },
      { firstName: 'Thomas', lastName: 'Thompson', email: 'thomas.t@email.com', phone: '555-0116', loyaltyTier: 'GOLD' },
      { firstName: 'Linda', lastName: 'Lee', email: 'linda.l@email.com', phone: '555-0117', loyaltyTier: 'SILVER' },
      { firstName: 'Kevin', lastName: 'Perez', email: 'kevin.p@email.com', phone: '555-0118', loyaltyTier: 'BRONZE' },
      { firstName: 'Karen', lastName: 'Clark', email: 'karen.c@email.com', phone: '555-0119', loyaltyTier: 'GOLD' },
      { firstName: 'Steven', lastName: 'Lewis', email: 'steven.l@email.com', phone: '555-0120', loyaltyTier: 'SILVER' }
    ];

    const createdCustomers = [];
    for (const customer of customers) {
      const created = await prisma.customer.create({
        data: {
          businessId: BUSINESS_ID,
          ...customer,
          loyaltyPoints: customer.loyaltyTier === 'GOLD' ? 1500 : customer.loyaltyTier === 'SILVER' ? 800 : 300,
          totalSpent: customer.loyaltyTier === 'GOLD' ? 15000 : customer.loyaltyTier === 'SILVER' ? 8000 : 3000,
          visitCount: customer.loyaltyTier === 'GOLD' ? 25 : customer.loyaltyTier === 'SILVER' ? 15 : 5,
          memberSince: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          isActive: true,
          marketingOptIn: true
        }
      });
      createdCustomers.push(created);
    }
    console.log(`✅ Created ${createdCustomers.length} customers`);

    console.log('\n✅ BASH EVENTS seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Business: ${business.businessName}`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Products: ${createdProducts.length}`);
    console.log(`   - Customers: ${createdCustomers.length}`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin: bash_admin / bash_admin123');
    console.log('   Cashier: bash_cashier / bash_cashier123');
    console.log('   Inventory: bash_inventory / bash_inventory123');

  } catch (error) {
    console.error('❌ Error seeding BASH EVENTS:', error);
    throw error;
  }
}

// Run the seed
seedBashEvents()
  .then(() => {
    console.log('\n🎉 Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });