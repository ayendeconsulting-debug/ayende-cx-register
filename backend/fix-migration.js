import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function resetMigrations() {
  try {
    console.log('Connecting to database...');
    
    console.log('Deleting failed migration record...');
    const result = await prisma.$executeRaw`DELETE FROM "_prisma_migrations" WHERE migration_name = '20260101161452_multi_business_type_architecture'`;
    
    console.log(`Deleted ${result} migration record(s)`);
    
    await prisma.$disconnect();
    
    console.log('Running migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    console.log('Success! Migrations completed.');
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

resetMigrations();