/**
 * Database Setup for E2E Tests
 * Finds or creates the test business
 */

import prisma from './src/config/database.js';

async function setupTestBusiness() {
  console.log('Setting up test business...\n');

  try {
    // Check if any business exists
    const existingBusiness = await prisma.business.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (existingBusiness) {
      console.log('✅ Found existing business:');
      console.log(`   ID: ${existingBusiness.id}`);
      console.log(`   Name: ${existingBusiness.businessName}`);
      console.log(`   Tenant ID: ${existingBusiness.externalTenantId || 'NOT SET'}`);
      
      // If no tenant ID, add one
      if (!existingBusiness.externalTenantId) {
        console.log('\n⚠️  Business has no CRM tenant ID. Adding one...');
        
        const updated = await prisma.business.update({
          where: { id: existingBusiness.id },
          data: { externalTenantId: 'a-cx-d8bf4' },
        });
        
        console.log(`✅ Added tenant ID: ${updated.externalTenantId}`);
      }

      console.log('\n📋 Use this in your test:');
      console.log(`   Business ID: ${existingBusiness.id}`);
      
      return existingBusiness;
    }

    // No business found, create one
    console.log('No business found. Creating test business...\n');

    const newBusiness = await prisma.business.create({
      data: {
        businessName: 'Test Business',
        externalTenantId: 'a-cx-d8bf4',
        businessEmail: 'test@ayendecx.com',
        businessPhone: '555-0123',
        businessAddress: '123 Test St',
        businessCity: 'Test City',
        businessState: 'TS',
        businessZipCode: '12345',
        currency: 'USD',
        currencyCode: 'USD',
        timezone: 'America/New_York',
        isActive: true,
        loyaltyEnabled: true,
      },
    });

    console.log('✅ Created new business:');
    console.log(`   ID: ${newBusiness.id}`);
    console.log(`   Name: ${newBusiness.businessName}`);
    console.log(`   Tenant ID: ${newBusiness.externalTenantId}`);

    console.log('\n📋 Use this in your test:');
    console.log(`   Business ID: ${newBusiness.id}`);

    return newBusiness;

  } catch (error) {
    console.error('❌ Error setting up business:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupTestBusiness();
