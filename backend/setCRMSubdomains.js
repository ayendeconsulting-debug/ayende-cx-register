import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setCRMSubdomains() {
  try {
    console.log('Setting CRM subdomains for POS businesses...\n');
    
    // Map POS businesses to their CRM subdomains
    const mappings = {
      'Bash Events': 'bashevents',           // CRM: bashevents.ayendecx.com
      'BASH EVENTS': 'bashevents',           // Same as above
      'Ayende Consulting Inc.': 'ayende',    // CRM: ayende.ayendecx.com
      'Simi African Store': 'simi'           // CRM: simi.ayendecx.com
    };
    
    for (const [businessName, subdomain] of Object.entries(mappings)) {
      const result = await prisma.business.updateMany({
        where: { businessName: businessName },
        data: { subdomain: subdomain }
      });
      
      if (result.count > 0) {
        console.log(`✅ ${businessName.padEnd(30)} → CRM subdomain: ${subdomain}`);
      }
    }
    
    console.log('\n✅ CRM subdomains set!\n');
    console.log('Login format examples:');
    console.log('  admin.bashevents');
    console.log('  cashier.ayende');
    console.log('  admin.simi\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setCRMSubdomains();