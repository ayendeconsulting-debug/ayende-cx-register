
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupAdminUser() {
  try {
    console.log('🚀 Setting up admin user for Bash Events POS...\n');

    let business = await prisma.business.findFirst({
      where: { businessName: 'Bash Events' }
    });

    if (!business) {
      console.log('📦 Creating business...');
      business = await prisma.business.create({
        data: {
          businessName: 'Bash Events',
          businessEmail: 'info@bashevents.com',
          businessPhone: '+1234567890',
          businessAddress: '123 Event Street',
          businessCity: 'Toronto',
          businessState: 'ON',
          businessZipCode: 'M5V 1A1',
          businessCountry: 'Canada',
          currency: '`$',
          primaryColor: '#667eea',
          secondaryColor: '#764ba2',
        },
      });
      console.log('✅ Business created:', business.businessName);
    } else {
      console.log('✅ Business found:', business.businessName);
    }

    const password = 'Admin123!';
    const passwordHash = await bcrypt.hash(password, 10);

    const adminUser = await prisma.user.create({
      data: {
        businessId: business.id,
        email: 'admin@bashevents.com',
        username: 'admin',
        passwordHash: passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('\n✅ Admin user created!\n');
    console.log('═══════════════════════════════════════');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════');
    console.log('  Username: admin');
    console.log('  Password: Admin123!');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminUser();
