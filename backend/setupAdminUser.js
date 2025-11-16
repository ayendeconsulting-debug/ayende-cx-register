import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupAdminUser() {
  try {
    console.log('Setting up admin user...\n');

    let business = await prisma.business.findFirst({
      where: { businessName: 'Bash Events' }
    });

    if (!business) {
      business = await prisma.business.create({
        data: {
          businessName: 'Bash Events',
          businessEmail: 'info@bashevents.com',
          businessPhone: '+1234567890',
          businessCity: 'Toronto',
          currency: '$',
        },
      });
      console.log('Business created:', business.businessName);
    }

    const passwordHash = await bcrypt.hash('Admin123!', 10);

    await prisma.user.create({
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

    console.log('\nAdmin user created!');
    console.log('Username: admin');
    console.log('Password: Admin123!\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminUser();