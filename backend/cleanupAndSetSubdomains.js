import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupAndSetSubdomains() {
  try {
    console.log('🧹 Cleaning up duplicate businesses and setting CRM subdomains...\n');
    
    // STEP 1: Delete duplicate "Bash Events" (lowercase)
    const deleted = await prisma.business.deleteMany({
      where: { 
        businessName: 'Bash Events'  // Delete the duplicate
      }
    });
    
    if (deleted.count > 0) {
      console.log(`✅ Deleted duplicate "Bash Events" (${deleted.count} record)\n`);
    }
    
    // STEP 2: Set CRM subdomains for remaining businesses
    const mappings = {
      'BASH EVENTS': 'bashevents',
      'Ayende Consulting Inc.': 'consulting',
      'Simi African Store': 'simistore'
    };
    
    console.log('Setting CRM subdomains:\n');
    
    for (const [businessName, subdomain] of Object.entries(mappings)) {
      const result = await prisma.business.updateMany({
        where: { businessName: businessName },
        data: { subdomain: subdomain }
      });
      
      if (result.count > 0) {
        console.log(`✅ ${businessName.padEnd(30)} → ${subdomain}`);
      } else {
        console.log(`⚠️  ${businessName.padEnd(30)} → NOT FOUND`);
      }
    }
    
    console.log('\n✅ Cleanup complete!\n');
    console.log('═══════════════════════════════════════');
    console.log('LOGIN FORMAT EXAMPLES:');
    console.log('═══════════════════════════════════════');
    console.log('  admin.bashevents');
    console.log('  cashier.consulting');
    console.log('  admin.simistore');
    console.log('═══════════════════════════════════════\n');
    
    // Show final state
    const businesses = await prisma.business.findMany({
      select: { 
        businessName: true, 
        subdomain: true,
        _count: {
          select: { users: true }
        }
      }
    });
    
    console.log('Current businesses:');
    businesses.forEach(b => {
      console.log(`  ${b.businessName.padEnd(30)} | ${(b.subdomain || 'NO SUBDOMAIN').padEnd(15)} | ${b._count.users} users`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupAndSetSubdomains();