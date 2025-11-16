import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkCustomers() {
  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { id: 'e900d8d7-c822-4178-b1a8-f6807a226df5' },
        { id: 'f00efad0-021f-4b5f-a559-fa5e16b04beb' }
      ]
    }
  });

  console.log('Found', customers.length, 'customers:');
  console.log('');
  
  customers.forEach(c => {
    console.log('Customer ID:', c.id);
    console.log('Name:', c.firstName, c.lastName);
    console.log('Email:', c.email);
    console.log('Phone:', c.phone);
    console.log('Anonymous:', c.isAnonymous);
    console.log('Created:', c.createdAt);
    console.log('---');
  });

  await prisma.$disconnect();
}

checkCustomers();