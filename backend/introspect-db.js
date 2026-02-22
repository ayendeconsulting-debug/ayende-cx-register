// introspect-db.js - Run this on Railway to get production schema
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔍 Starting database introspection...');
console.log('📊 This will read the actual production schema\n');

try {
  // Run Prisma introspection
  console.log('Running: npx prisma db pull');
  const output = execSync('npx prisma db pull', { 
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  
  console.log(output);
  
  // Read the generated schema
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ INTROSPECTION COMPLETE!');
  console.log('='.repeat(80));
  console.log('\n📄 Generated Schema:\n');
  console.log(schema);
  console.log('\n' + '='.repeat(80));
  
} catch (error) {
  console.error('❌ Error during introspection:', error.message);
  if (error.stdout) console.log('STDOUT:', error.stdout.toString());
  if (error.stderr) console.log('STDERR:', error.stderr.toString());
  process.exit(1);
}
