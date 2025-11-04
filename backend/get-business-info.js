const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getBusinessInfo() {
  try {
    const business = await prisma.business.findFirst({
      where: {
        businessName: 'Integration Test Store'
      },
      include: {
        owner: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!business) {
      console.log('Business not found!');
      console.log('Available businesses:');
      const allBusinesses = await prisma.business.findMany({
        select: {
          id: true,
          businessName: true,
          subdomain: true
        }
      });
      console.log(allBusinesses);
      return;
    }

    console.log('=== POS Business Information ===');
    console.log('Business ID:', business.id);
    console.log('Business Name:', business.businessName);
    console.log('Subdomain:', business.subdomain);
    console.log('Owner Email:', business.owner.email);
    console.log('Owner Name:', business.owner.firstName, business.owner.lastName);
    console.log('External Tenant ID:', business.externalTenantId || 'NOT SET');
    console.log('================================');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getBusinessInfo();