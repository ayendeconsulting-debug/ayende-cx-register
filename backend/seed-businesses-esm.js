import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding POS database with businesses...\n');

  // Create BASH EVENTS
  const bashEvents = await prisma.business.create({
    data: {
      externalTenantId: 'a-cx-zcq3y',  // CRM tenant UUID
      businessName: 'BASH EVENTS',
      businessCity: null,
      businessState: null,
      businessCountry: 'NG',
      businessPhone: null,
      businessEmail: 'admin@bashevents.com',
      currency: 'N',
      currencyCode: 'NGN',
      timezone: 'Africa/Lagos',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      taxEnabled: false,
      taxRate: 0.0,
      taxLabel: 'VAT',
      receiptHeader: 'BASH EVENTS',
      receiptFooter: 'Thank you for your business!',
      loyaltyEnabled: true,
      isActive: true,
      subscriptionTier: 'BASIC',
    },
  });
  console.log('✓ Created BASH EVENTS:', bashEvents.id);

  // Create Ayende Consulting Inc.
  const consulting = await prisma.business.create({
    data: {
      externalTenantId: 'a-cx-fyi7d',  // CRM tenant UUID
      businessName: 'Ayende Consulting Inc.',
      businessAddress: '5191 Dundas Street West',
      businessCity: 'Etobicoke',
      businessState: 'ON',
      businessCountry: 'CA',
      businessPhone: '4374885250',
      businessEmail: 'ehinmidu18@gmail.com',
      currency: '$',
      currencyCode: 'CAD',
      timezone: 'America/Toronto',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      taxEnabled: false,
      taxRate: 0.0,
      taxLabel: 'Tax',
      receiptHeader: 'Ayende Consulting Inc.',
      receiptFooter: 'Thank you for your business!',
      loyaltyEnabled: true,
      isActive: true,
      subscriptionTier: 'BASIC',
    },
  });
  console.log('✓ Created Ayende Consulting Inc.:', consulting.id);

  // Create Simi African Store
  const simiStore = await prisma.business.create({
    data: {
      externalTenantId: 'a-cx-o45y8',  // CRM tenant UUID
      businessName: 'Simi African Store',
      businessCity: null,
      businessState: null,
      businessCountry: 'CA',
      businessPhone: null,
      businessEmail: 'contact@simistore.com',
      currency: '$',
      currencyCode: 'CAD',
      timezone: 'America/Toronto',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      taxEnabled: false,
      taxRate: 0.0,
      taxLabel: 'Tax',
      receiptHeader: 'Simi African Store',
      receiptFooter: 'Thank you for your business!',
      loyaltyEnabled: true,
      isActive: true,
      subscriptionTier: 'BASIC',
    },
  });
  console.log('✓ Created Simi African Store:', simiStore.id);

  console.log('\n✅ Database seeded successfully!');
  console.log('\nBusiness IDs mapped to CRM Tenant UUIDs:');
  console.log(`- BASH EVENTS (${bashEvents.id}) → a-cx-zcq3y`);
  console.log(`- Ayende Consulting (${consulting.id}) → a-cx-fyi7d`);
  console.log(`- Simi Store (${simiStore.id}) → a-cx-o45y8`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
