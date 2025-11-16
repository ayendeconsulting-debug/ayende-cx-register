import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const username = 'admin';
    const newPassword = 'Admin123!';
    
    console.log(`Resetting password for: ${username}`);
    
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    const user = await prisma.user.updateMany({
      where: { username: username },
      data: { passwordHash: passwordHash }
    });
    
    if (user.count > 0) {
      console.log('\n✅ Password reset successfully!');
      console.log(`Username: ${username}`);
      console.log(`New Password: ${newPassword}`);
    } else {
      console.log(`❌ User not found`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();