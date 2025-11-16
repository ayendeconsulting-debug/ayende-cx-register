import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createMissingUsers() {
  try {
    const password = 'Admin2025!';
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Get businesses without users
    const businesses = await prisma.business.findMany({
      where: {
        businessName: {
          in: ['BASH EVENTS', 'Simi African Store']
        }
      }
    });
    
    console.log('Creating users for businesses without users...\n');
    
    for (const business of businesses) {
      // Create admin user
      const admin = await prisma.user.create({
        data: {
          businessId: business.id,
          username: 'admin',
          email: `admin@${business.businessName.toLowerCase().replace(/\s/g, '')}.com`,
          passwordHash: passwordHash,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          isActive: true,
        }
      });
      
      // Create cashier user
      const cashier = await prisma.user.create({
        data: {
          businessId: business.id,
          username: 'cashier',
          email: `cashier@${business.businessName.toLowerCase().replace(/\s/g, '')}.com`,
          passwordHash: passwordHash,
          firstName: 'Cashier',
          lastName: 'User',
          role: 'CASHIER',
          isActive: true,
        }
      });
      
      console.log(`✅ ${business.businessName}:`);
      console.log(`   - Admin: admin / Admin2025!`);
      console.log(`   - Cashier: cashier / Admin2025!\n`);
    }
    
    console.log('✅ All users created!\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingUsers();