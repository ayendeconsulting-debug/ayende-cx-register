import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed process...\n');

  // Clean existing data (staging only!)
  console.log('🧹 Cleaning existing data...');
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.saleLineItem.deleteMany();
  await prisma.rentalLineItem.deleteMany();
  await prisma.serviceLineItem.deleteMany();
  await prisma.hospitalityLineItem.deleteMany();
  await prisma.transactionLineItem.deleteMany();
  await prisma.saleTransaction.deleteMany();
  await prisma.rentalTransaction.deleteMany();
  await prisma.serviceTransaction.deleteMany();
  await prisma.hospitalityTransaction.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.loyaltyProgram.deleteMany();
  await prisma.staffPermission.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.tenantCustomer.deleteMany();
  await prisma.businessConfig.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.business.deleteMany();
  console.log('✅ Cleaned existing data\n');

  // ============================================================================
  // 1. CREATE BUSINESSES
  // ============================================================================
  console.log('📦 Creating businesses...');

  const simistore = await prisma.business.create({
    data: {
      id: 'bus_simistore_001',
      name: 'Simi African Store',
      subdomain: 'simistore',
      business_type: 'RETAIL',
      owner_name: 'Simisola Adeleke',
      owner_email: 'simi@simistore.com',
      owner_phone: '+234-803-555-0101',
      logo_url: 'https://example.com/simistore-logo.png',
      primary_color: '#10B981',
      secondary_color: '#059669',
      address: '45 Market Street',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      postal_code: '100001',
      is_active: true,
      subscription_tier: 'professional',
      externalTenantId: 'crm_tenant_simistore',
    },
  });

  const bashevents = await prisma.business.create({
    data: {
      id: 'bus_bashevents_001',
      name: 'Bash Events',
      subdomain: 'bashevents',
      business_type: 'RENTAL',
      owner_name: 'Olabisi Ogunleye',
      owner_email: 'bash@bashevents.com',
      owner_phone: '+234-805-555-0202',
      logo_url: 'https://example.com/bashevents-logo.png',
      primary_color: '#3B82F6',
      secondary_color: '#2563EB',
      address: '12 Event Plaza',
      city: 'Abuja',
      state: 'FCT',
      country: 'Nigeria',
      postal_code: '900001',
      is_active: true,
      subscription_tier: 'professional',
      externalTenantId: 'crm_tenant_bashevents',
    },
  });

  console.log(`✅ Created ${simistore.name} (RETAIL)`);
  console.log(`✅ Created ${bashevents.name} (RENTAL)\n`);

  // ============================================================================
  // 2. CREATE BUSINESS CONFIGURATIONS
  // ============================================================================
  console.log('⚙️  Creating business configurations...');

  const simistoreConfig = await prisma.businessConfig.create({
    data: {
      business_id: simistore.id,
      inventory_enabled: true,
      barcode_scanning: true,
      stock_alerts: true,
      low_stock_threshold: 10,
      loyalty_enabled: true,
      email_receipts: true,
      multi_currency_enabled: false,
      default_currency: 'NGN',
      supported_currencies: ['NGN'],
      tax_enabled: true,
      tax_rate: 7.5,
      refund_enabled: true,
      refund_window_days: 14,
      offline_mode_enabled: true,
      color_theme: 'green',
    },
  });

  const basheventsConfig = await prisma.businessConfig.create({
    data: {
      business_id: bashevents.id,
      rental_contracts: true,
      deposit_management: true,
      late_fee_enabled: true,
      late_fee_per_day: 5000,
      damage_fee_enabled: true,
      loyalty_enabled: true,
      email_receipts: true,
      multi_currency_enabled: false,
      default_currency: 'NGN',
      supported_currencies: ['NGN'],
      partial_payments_enabled: true,
      min_deposit_percent: 30,
      tax_enabled: true,
      tax_rate: 7.5,
      offline_mode_enabled: true,
      color_theme: 'blue',
    },
  });

  console.log('✅ Created business configurations\n');

  // ============================================================================
  // 3. CREATE STAFF MEMBERS
  // ============================================================================
  console.log('👥 Creating staff members...');

  const simiCashier = await prisma.staff.create({
    data: {
      business_id: simistore.id,
      first_name: 'Tunde',
      last_name: 'Adeyemi',
      email: 'tunde@simistore.com',
      phone: '+234-803-555-0301',
      username: 'tunde.simistore',
      password_hash: '$2b$10$hashedpassword123', // In real app, properly hash passwords
      role: 'CASHIER',
      is_active: true,
    },
  });

  const bashManager = await prisma.staff.create({
    data: {
      business_id: bashevents.id,
      first_name: 'Ngozi',
      last_name: 'Chukwu',
      email: 'ngozi@bashevents.com',
      phone: '+234-805-555-0302',
      username: 'ngozi.bashevents',
      password_hash: '$2b$10$hashedpassword456',
      role: 'MANAGER',
      is_active: true,
    },
  });

  console.log(`✅ Created ${simiCashier.first_name} ${simiCashier.last_name} (Cashier)`);
  console.log(`✅ Created ${bashManager.first_name} ${bashManager.last_name} (Manager)\n`);

  // ============================================================================
  // 4. CREATE CUSTOMERS
  // ============================================================================
  console.log('👤 Creating customers...');

  // Person customers for Simistore
  const personCustomer1 = await prisma.tenantCustomer.create({
    data: {
      tenant_id: simistore.id,
      account_type: 'PERSON',
      first_name: 'Amara',
      last_name: 'Okafor',
      email: 'amara.okafor@example.com',
      phone: '+234-803-555-0401',
      address: '23 Victoria Island',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      loyalty_points_balance: 250,
      loyalty_tier: 'SILVER',
      total_lifetime_value: 125000,
      visit_count: 8,
      marketing_opt_in: true,
    },
  });

  const personCustomer2 = await prisma.tenantCustomer.create({
    data: {
      tenant_id: simistore.id,
      account_type: 'PERSON',
      first_name: 'Chinedu',
      last_name: 'Eze',
      email: 'chinedu.eze@example.com',
      phone: '+234-803-555-0402',
      address: '67 Lekki Phase 1',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      loyalty_points_balance: 500,
      loyalty_tier: 'GOLD',
      total_lifetime_value: 280000,
      visit_count: 15,
      marketing_opt_in: true,
    },
  });

  // Business customer for Bashevents
  const businessCustomer1 = await prisma.tenantCustomer.create({
    data: {
      tenant_id: bashevents.id,
      account_type: 'BUSINESS',
      business_name: 'TechCorp Nigeria Ltd',
      business_reg_no: 'RC-123456',
      industry: 'Technology',
      company_size: 'MEDIUM',
      contact_person_name: 'Yemi Adebayo',
      contact_person_title: 'Events Manager',
      contact_person_phone: '+234-805-555-0501',
      contact_person_email: 'yemi.adebayo@techcorp.ng',
      email: 'events@techcorp.ng',
      phone: '+234-805-555-0500',
      address: '100 Corporate Drive',
      city: 'Abuja',
      state: 'FCT',
      country: 'Nigeria',
      credit_limit: 500000,
      payment_terms: 'NET_30',
      outstanding_balance: 0,
      tax_exempt: false,
      loyalty_points_balance: 100,
      total_lifetime_value: 450000,
      visit_count: 5,
    },
  });

  // Person customer for Bashevents
  const personCustomer3 = await prisma.tenantCustomer.create({
    data: {
      tenant_id: bashevents.id,
      account_type: 'PERSON',
      first_name: 'Folake',
      last_name: 'Ajayi',
      email: 'folake.ajayi@example.com',
      phone: '+234-805-555-0403',
      address: '45 Maitama District',
      city: 'Abuja',
      state: 'FCT',
      country: 'Nigeria',
      loyalty_points_balance: 75,
      loyalty_tier: 'BRONZE',
      total_lifetime_value: 95000,
      visit_count: 3,
      marketing_opt_in: true,
    },
  });

  console.log(`✅ Created 4 customers (2 PERSON, 1 BUSINESS)\n`);

  // ============================================================================
  // 5. CREATE LOYALTY PROGRAMS
  // ============================================================================
  console.log('🎁 Creating loyalty programs...');

  const simistoreLoyalty = await prisma.loyaltyProgram.create({
    data: {
      business_id: simistore.id,
      points_calculation_method: 'per_dollar',
      points_per_dollar: 1,
      redemption_value: 0.01,
      min_points_redemption: 100,
      bronze_threshold: 0,
      silver_threshold: 200,
      gold_threshold: 500,
      platinum_threshold: 1000,
    },
  });

  const basheventsLoyalty = await prisma.loyaltyProgram.create({
    data: {
      business_id: bashevents.id,
      points_calculation_method: 'per_transaction',
      points_per_transaction: 50,
      redemption_value: 0.02,
      min_points_redemption: 50,
      bronze_threshold: 0,
      silver_threshold: 150,
      gold_threshold: 300,
      platinum_threshold: 600,
    },
  });

  console.log('✅ Created loyalty programs\n');

  // ============================================================================
  // 6. CREATE PRODUCTS (for Simistore - RETAIL)
  // ============================================================================
  console.log('🛍️  Creating products for Simistore...');

  const products = await Promise.all([
    prisma.product.create({
      data: {
        business_id: simistore.id,
        sku: 'SIMI-001',
        name: 'Premium Rice 50kg',
        description: 'Quality Nigerian rice',
        category: 'Groceries',
        price: 35000,
        cost_price: 28000,
        stock_quantity: 50,
        low_stock_alert: 10,
        unit: 'bag',
        barcode: '123456789001',
        is_active: true,
        is_taxable: true,
        loyalty_points: 35,
      },
    }),
    prisma.product.create({
      data: {
        business_id: simistore.id,
        sku: 'SIMI-002',
        name: 'Vegetable Oil 5L',
        description: 'Pure vegetable cooking oil',
        category: 'Groceries',
        price: 8500,
        cost_price: 6800,
        stock_quantity: 100,
        low_stock_alert: 20,
        unit: 'bottle',
        barcode: '123456789002',
        is_active: true,
        is_taxable: true,
        loyalty_points: 8,
      },
    }),
    prisma.product.create({
      data: {
        business_id: simistore.id,
        sku: 'SIMI-003',
        name: 'African Ankara Fabric',
        description: 'Premium quality ankara print fabric',
        category: 'Textiles',
        price: 4500,
        cost_price: 3200,
        stock_quantity: 200,
        low_stock_alert: 30,
        unit: 'yard',
        barcode: '123456789003',
        is_active: true,
        is_taxable: true,
        loyalty_points: 4,
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products\n`);

  // ============================================================================
  // 7. CREATE EQUIPMENT (for Bashevents - RENTAL)
  // ============================================================================
  console.log('🎪 Creating equipment for Bashevents...');

  const equipment = await Promise.all([
    prisma.equipment.create({
      data: {
        business_id: bashevents.id,
        sku: 'BASH-CHAIR-001',
        name: 'Chiavari Chair Gold',
        description: 'Elegant gold chiavari chair for events',
        category: 'Seating',
        daily_rate: 1500,
        weekly_rate: 8000,
        deposit_required: true,
        deposit_amount: 5000,
        quantity_total: 200,
        quantity_available: 200,
        min_rental_days: 1,
        max_rental_days: 14,
        is_active: true,
      },
    }),
    prisma.equipment.create({
      data: {
        business_id: bashevents.id,
        sku: 'BASH-TABLE-001',
        name: 'Round Table (6-seater)',
        description: '6-seater round table with white linen',
        category: 'Tables',
        daily_rate: 3500,
        weekly_rate: 18000,
        deposit_required: true,
        deposit_amount: 10000,
        quantity_total: 50,
        quantity_available: 50,
        min_rental_days: 1,
        max_rental_days: 14,
        is_active: true,
      },
    }),
    prisma.equipment.create({
      data: {
        business_id: bashevents.id,
        sku: 'BASH-TENT-001',
        name: 'Party Tent 20x30ft',
        description: 'Large white party tent, accommodates 100 guests',
        category: 'Tents',
        daily_rate: 50000,
        weekly_rate: 250000,
        deposit_required: true,
        deposit_amount: 100000,
        quantity_total: 5,
        quantity_available: 5,
        min_rental_days: 1,
        max_rental_days: 7,
        is_active: true,
      },
    }),
  ]);

  console.log(`✅ Created ${equipment.length} equipment items\n`);

  // ============================================================================
  // 8. CREATE SAMPLE TRANSACTIONS
  // ============================================================================
  console.log('💳 Creating sample transactions...\n');

  // ========== RETAIL SALE TRANSACTION ==========
  console.log('  Creating retail sale...');
  
  const retailTransaction = await prisma.transaction.create({
    data: {
      business_id: simistore.id,
      transaction_type: 'SALE',
      customer_id: personCustomer1.id,
      is_walk_in: false,
      currency: 'NGN',
      subtotal: 52000,
      tax_amount: 3900,
      discount_amount: 0,
      tip_amount: 0,
      total_amount: 55900,
      payment_status: 'PAID',
      amount_paid: 55900,
      amount_due: 0,
      loyalty_points_earned: 52,
      processed_by: simiCashier.id,
      notes: 'Regular customer purchase',
      transaction_date: new Date('2026-01-01T10:30:00Z'),
    },
  });

  await prisma.saleTransaction.create({
    data: {
      transaction_id: retailTransaction.id,
      receipt_number: 'RCT-SIMI-20260101-001',
    },
  });

  // Line items for retail sale
  const retailLineItem1 = await prisma.transactionLineItem.create({
    data: {
      transaction_id: retailTransaction.id,
      item_type: 'PRODUCT',
    },
  });

  await prisma.saleLineItem.create({
    data: {
      line_item_id: retailLineItem1.id,
      product_id: products[0].id,
      product_name: products[0].name,
      sku: products[0].sku,
      quantity: 1,
      unit_price: 35000,
      line_total: 35000,
      discount_percent: 0,
      discount_amount: 0,
    },
  });

  const retailLineItem2 = await prisma.transactionLineItem.create({
    data: {
      transaction_id: retailTransaction.id,
      item_type: 'PRODUCT',
    },
  });

  await prisma.saleLineItem.create({
    data: {
      line_item_id: retailLineItem2.id,
      product_id: products[1].id,
      product_name: products[1].name,
      sku: products[1].sku,
      quantity: 2,
      unit_price: 8500,
      line_total: 17000,
      discount_percent: 0,
      discount_amount: 0,
    },
  });

  await prisma.payment.create({
    data: {
      transaction_id: retailTransaction.id,
      amount: 55900,
      currency: 'NGN',
      payment_method: 'CASH',
      status: 'PAID',
      reference: 'CASH-20260101-001',
    },
  });

  console.log('  ✅ Created retail sale transaction\n');

  // ========== RENTAL TRANSACTION ==========
  console.log('  Creating rental transaction...');

  const rentalTransaction = await prisma.transaction.create({
    data: {
      business_id: bashevents.id,
      transaction_type: 'RENTAL',
      customer_id: businessCustomer1.id,
      is_walk_in: false,
      currency: 'NGN',
      subtotal: 170000,
      tax_amount: 12750,
      discount_amount: 0,
      tip_amount: 0,
      total_amount: 182750,
      payment_status: 'PARTIAL',
      amount_paid: 60000, // 30% deposit
      amount_due: 122750,
      loyalty_points_earned: 50,
      processed_by: bashManager.id,
      notes: 'Corporate event rental - TechCorp Annual Dinner',
      transaction_date: new Date('2026-01-01T14:00:00Z'),
    },
  });

  const rentalStart = new Date('2026-01-10T09:00:00Z');
  const rentalEnd = new Date('2026-01-12T18:00:00Z');

  await prisma.rentalTransaction.create({
    data: {
      transaction_id: rentalTransaction.id,
      contract_number: 'RENT-BASH-20260101-001',
      rental_start: rentalStart,
      rental_end: rentalEnd,
      deposit_amount: 60000,
      deposit_status: 'HELD',
      late_fee_per_day: 5000,
      late_fee_charged: 0,
      damage_fee: 0,
    },
  });

  // Rental line items
  const rentalLineItem1 = await prisma.transactionLineItem.create({
    data: {
      transaction_id: rentalTransaction.id,
      item_type: 'EQUIPMENT',
    },
  });

  await prisma.rentalLineItem.create({
    data: {
      line_item_id: rentalLineItem1.id,
      equipment_id: equipment[0].id,
      equipment_name: equipment[0].name,
      rental_period_days: 3,
      daily_rate: 1500,
      total_rental_fee: 90000, // 60 chairs x 1500 x 3 days
      condition_out: 'Excellent condition, all chairs inspected',
    },
  });

  const rentalLineItem2 = await prisma.transactionLineItem.create({
    data: {
      transaction_id: rentalTransaction.id,
      item_type: 'EQUIPMENT',
    },
  });

  await prisma.rentalLineItem.create({
    data: {
      line_item_id: rentalLineItem2.id,
      equipment_id: equipment[1].id,
      equipment_name: equipment[1].name,
      rental_period_days: 3,
      daily_rate: 3500,
      total_rental_fee: 31500, // 3 tables x 3500 x 3 days
      condition_out: 'Good condition with white linen',
    },
  });

  const rentalLineItem3 = await prisma.transactionLineItem.create({
    data: {
      transaction_id: rentalTransaction.id,
      item_type: 'EQUIPMENT',
    },
  });

  await prisma.rentalLineItem.create({
    data: {
      line_item_id: rentalLineItem3.id,
      equipment_id: equipment[2].id,
      equipment_name: equipment[2].name,
      rental_period_days: 3,
      daily_rate: 50000,
      total_rental_fee: 150000,
      condition_out: 'New tent, pristine condition',
    },
  });

  // Partial payment (deposit)
  await prisma.payment.create({
    data: {
      transaction_id: rentalTransaction.id,
      amount: 60000,
      currency: 'NGN',
      payment_method: 'BANK_TRANSFER',
      status: 'PAID',
      reference: 'TRF-TECHCORP-20260101',
      notes: '30% deposit payment',
    },
  });

  console.log('  ✅ Created rental transaction\n');

  // ========== LOYALTY TRANSACTIONS ==========
  console.log('  Creating loyalty transactions...');

  await prisma.loyaltyTransaction.create({
    data: {
      customer_id: personCustomer1.id,
      transaction_id: retailTransaction.id,
      points_earned: 52,
      points_redeemed: 0,
      points_balance: 302, // Previous 250 + 52
      type: 'EARN',
      reason: 'Purchase reward',
    },
  });

  await prisma.loyaltyTransaction.create({
    data: {
      customer_id: businessCustomer1.id,
      transaction_id: rentalTransaction.id,
      points_earned: 50,
      points_redeemed: 0,
      points_balance: 150, // Previous 100 + 50
      type: 'EARN',
      reason: 'Rental booking reward',
    },
  });

  console.log('  ✅ Created loyalty transactions\n');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`  • Businesses: 2 (1 RETAIL, 1 RENTAL)`);
  console.log(`  • Staff: 2`);
  console.log(`  • Customers: 4 (3 PERSON, 1 BUSINESS)`);
  console.log(`  • Products: ${products.length}`);
  console.log(`  • Equipment: ${equipment.length}`);
  console.log(`  • Transactions: 2 (1 SALE, 1 RENTAL)`);
  console.log(`  • Loyalty Programs: 2`);
  console.log('\n🔗 Test Businesses:');
  console.log(`  • Simistore (RETAIL): https://staging-app.ayendecx.com?subdomain=simistore`);
  console.log(`  • Bashevents (RENTAL): https://staging-app.ayendecx.com?subdomain=bashevents`);
  console.log('\n✅ Database ready for testing!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });