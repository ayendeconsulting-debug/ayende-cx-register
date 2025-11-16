import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSimiUser() {
  const simi = await prisma.business.findUnique({
    where: { subdomain: 'simistore' },
    include: {
      users: {
        select: {
          username: true,
          email: true,
          role: true
        }
      }
    }
  });

  console.log('\n📋 SIMI AFRICAN STORE USERS:\n');
  console.log(`Business: ${simi.businessName}`);
  console.log(`Subdomain: ${simi.subdomain}`);
  console.log(`ID: ${simi.id}\n`);
  
  simi.users.forEach(u => {
    console.log(`Username: ${u.username} | Email: ${u.email} | Role: ${u.role}`);
  });

  await prisma.$disconnect();
}

checkSimiUser();