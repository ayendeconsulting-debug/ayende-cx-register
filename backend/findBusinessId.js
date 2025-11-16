/**
 * Find Business ID for Bash Events
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findBusiness() {
  try {
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        businessName: true,
        externalTenantId: true,
        createdAt: true,
      }
    });

    console.log('\n📋 All Businesses in POS:\n');
    console.log('═══════════════════════════════════════════════════════════════');
    
    businesses.forEach((business, index) => {
      console.log(`${index + 1}. ${business.businessName}`);
      console.log(`   ID: ${business.id}`);
      console.log(`   External Tenant ID: ${business.externalTenantId || 'None'}`);
      console.log(`   Created: ${business.createdAt}`);
      console.log('───────────────────────────────────────────────────────────────');
    });

    console.log(`\nTotal businesses: ${businesses.length}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findBusiness();
