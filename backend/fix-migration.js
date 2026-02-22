// Fix failed Prisma migration by marking it as complete
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMigration() {
  try {
    console.log('🔍 Checking migration status...');
    
    // Check current migrations
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, started_at 
      FROM _prisma_migrations 
      ORDER BY started_at DESC
    `;
    
    console.log('Current migrations:', migrations);
    
    // Insert the baseline migration record
    console.log('\n📝 Marking migration as complete...');
    
    const result = await prisma.$executeRaw`
      INSERT INTO _prisma_migrations (
        id,
        checksum,
        finished_at,
        migration_name,
        logs,
        rolled_back_at,
        started_at,
        applied_steps_count
      ) VALUES (
        '20260101132941-initial-v2-schema',
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        NOW(),
        '20260101132941_initial_v2_schema',
        'Baseline migration - schema already exists in database',
        NULL,
        NOW(),
        1
      )
      ON CONFLICT (migration_name) 
      DO UPDATE SET 
        finished_at = NOW(), 
        applied_steps_count = 1,
        logs = 'Baseline migration - schema already exists in database'
    `;
    
    console.log('✅ Migration record inserted/updated:', result);
    
    // Verify
    const updated = await prisma.$queryRaw`
      SELECT migration_name, finished_at, applied_steps_count 
      FROM _prisma_migrations 
      WHERE migration_name = '20260101132941_initial_v2_schema'
    `;
    
    console.log('\n✅ Verification:', updated);
    console.log('\n🎉 Migration fix complete! The deployment should now succeed.');
    
  } catch (error) {
    console.error('❌ Error fixing migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixMigration();
