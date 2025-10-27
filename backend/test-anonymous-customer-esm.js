// Test Anonymous Customer Functionality
// This script verifies that the anonymous walk-in customer was created correctly

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testAnonymousCustomer() {
  console.log('='.repeat(60));
  console.log('Testing Anonymous Walk-In Customer Setup');
  console.log('='.repeat(60));
  console.log();

  try {
    // Test 1: Check if anonymous customer exists
    console.log('Test 1: Checking for anonymous customer...');
    const anonymousCustomers = await prisma.customer.findMany({
      where: {
        isAnonymous: true
      },
      include: {
        business: {
          select: {
            id: true,
            businessName: true
          }
        }
      }
    });

    if (anonymousCustomers.length === 0) {
      console.log('❌ FAILED: No anonymous customer found');
      return false;
    }

    console.log(`✓ PASSED: Found ${anonymousCustomers.length} anonymous customer(s)`);
    console.log();

    // Test 2: Verify anonymous customer properties
    console.log('Test 2: Verifying anonymous customer properties...');
    const customer = anonymousCustomers[0];
    
    const checks = [
      { name: 'First Name is "Walk-In"', value: customer.firstName === 'Walk-In' },
      { name: 'Last Name is "Customer"', value: customer.lastName === 'Customer' },
      { name: 'isAnonymous is true', value: customer.isAnonymous === true },
      { name: 'customerSource is ANONYMOUS', value: customer.customerSource === 'ANONYMOUS' },
      { name: 'syncState is SYNCED', value: customer.syncState === 'SYNCED' },
      { name: 'loyaltyPoints is 0', value: customer.loyaltyPoints === 0 },
      { name: 'totalSpent is 0', value: parseFloat(customer.totalSpent) === 0 },
      { name: 'visitCount is 0', value: customer.visitCount === 0 },
      { name: 'Has businessId', value: !!customer.businessId },
      { name: 'No email', value: customer.email === null },
      { name: 'No phone', value: customer.phone === null }
    ];

    let allPassed = true;
    checks.forEach(check => {
      if (check.value) {
        console.log(`  ✓ ${check.name}`);
      } else {
        console.log(`  ❌ ${check.name}`);
        allPassed = false;
      }
    });

    console.log();

    if (!allPassed) {
      console.log('❌ FAILED: Some property checks failed');
      return false;
    }

    console.log('✓ PASSED: All property checks passed');
    console.log();

    // Test 3: Display anonymous customer details
    console.log('Test 3: Anonymous Customer Details:');
    console.log('-'.repeat(60));
    console.log(`ID:             ${customer.id}`);
    console.log(`Name:           ${customer.firstName} ${customer.lastName}`);
    console.log(`Business:       ${customer.business.businessName}`);
    console.log(`Business ID:    ${customer.businessId}`);
    console.log(`Customer Source: ${customer.customerSource}`);
    console.log(`Sync State:     ${customer.syncState}`);
    console.log(`Is Anonymous:   ${customer.isAnonymous}`);
    console.log(`Is Active:      ${customer.isActive}`);
    console.log(`Loyalty Points: ${customer.loyaltyPoints}`);
    console.log(`Total Spent:    $${customer.totalSpent}`);
    console.log(`Visit Count:    ${customer.visitCount}`);
    console.log(`Created At:     ${customer.createdAt}`);
    console.log('-'.repeat(60));
    console.log();

    // Test 4: Verify one anonymous customer per business
    console.log('Test 4: Checking anonymous customer count per business...');
    const businesses = await prisma.business.findMany({
      select: { id: true, businessName: true }
    });

    for (const business of businesses) {
      const count = await prisma.customer.count({
        where: {
          businessId: business.id,
          isAnonymous: true
        }
      });

      if (count !== 1) {
        console.log(`❌ FAILED: Business "${business.businessName}" has ${count} anonymous customers (expected 1)`);
        return false;
      }
      console.log(`  ✓ Business "${business.businessName}": 1 anonymous customer`);
    }

    console.log();
    console.log('✓ PASSED: Each business has exactly one anonymous customer');
    console.log();

    // All tests passed
    console.log('='.repeat(60));
    console.log('✓ ALL TESTS PASSED');
    console.log('='.repeat(60));
    console.log();
    console.log('Summary:');
    console.log(`  - Anonymous customers found: ${anonymousCustomers.length}`);
    console.log(`  - All properties correct: Yes`);
    console.log(`  - One per business: Yes`);
    console.log();

    return true;

  } catch (error) {
    console.error('❌ TEST ERROR:', error.message);
    console.error(error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAnonymousCustomer()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
