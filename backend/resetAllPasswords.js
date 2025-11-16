import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAllPasswords() {
  try {
    const universalPassword = 'Admin2025!';
    
    console.log('🔐 Resetting ALL user passwords...\n');
    
    // Get all businesses
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        businessName: true
      }
    });
    
    console.log(`Found ${businesses.length} businesses:\n`);
    businesses.forEach(b => console.log(`  - ${b.businessName}`));
    
    // Hash the universal password
    const passwordHash = await bcrypt.hash(universalPassword, 10);
    
    // Update ALL users across ALL businesses
    const result = await prisma.user.updateMany({
      data: { passwordHash: passwordHash }
    });
    
    console.log(`\n✅ Successfully reset ${result.count} user passwords!\n`);
    console.log('═══════════════════════════════════════');
    console.log('UNIVERSAL LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════');
    console.log('Password: Admin2025!');
    console.log('\nUsernames (business-specific):');
    console.log('  - admin (for admin users)');
    console.log('  - cashier (for cashier users)');
    console.log('  - Or check each business user table');
    console.log('═══════════════════════════════════════\n');
    
    // Show all users for reference
    const users = await prisma.user.findMany({
      select: {
        username: true,
        email: true,
        role: true,
        business: {
          select: { businessName: true }
        }
      },
      orderBy: { businessId: 'asc' }
    });
    
    console.log('All users updated:');
    users.forEach(u => {
      console.log(`  ${u.business.businessName.padEnd(25)} | ${u.username.padEnd(20)} | ${u.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAllPasswords();