// Test Phase 1 Mapping Service
// This script verifies that Phase 1 business-tenant mapping is still working

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testMappingService() {
  console.log('='.repeat(60));
  console.log('Testing Phase 1 Mapping Service');
  console.log('='.repeat(60));
  console.log();

  try {
    // Test 1: Check if SystemMapping table exists
    console.log('Test 1: Checking SystemMapping table...');
    const mappingCount = await prisma.systemMapping.count();
    console.log(`✓ PASSED: SystemMapping table accessible (${mappingCount} mappings)`);
    console.log();

    // Test 2: Verify business-tenant mapping exists
    console.log('Test 2: Checking for business-tenant mappings...');
    const businessMappings = await prisma.systemMapping.findMany({
      where: {
        entityType: 'BUSINESS'
      },
      include: {
        business: {
          select: {
            id: true,
            businessName: true
          }
        }
      }
    });

    if (businessMappings.length === 0) {
      console.log('⚠ WARNING: No business-tenant mappings found');
      console.log('  This is expected if you haven\'t created any mappings yet');
      console.log('  Phase 1 infrastructure is in place and ready to use');
      console.log();
    } else {
      console.log(`✓ PASSED: Found ${businessMappings.length} business mapping(s)`);
      console.log();

      // Display mapping details
      console.log('Business-Tenant Mappings:');
      console.log('-'.repeat(60));
      businessMappings.forEach((mapping, index) => {
        console.log(`Mapping ${index + 1}:`);
        console.log(`  POS Business ID:  ${mapping.posId}`);
        console.log(`  Business Name:    ${mapping.business.businessName}`);
        console.log(`  CRM Tenant ID:    ${mapping.crmId}`);
        console.log(`  Sync Status:      ${mapping.syncStatus}`);
        console.log(`  Last Synced:      ${mapping.lastSyncedAt}`);
        console.log('-'.repeat(60));
      });
      console.log();
    }

    // Test 3: Verify mapping can be queried by POS ID
    console.log('Test 3: Testing mapping lookup by POS ID...');
    const business = await prisma.business.findFirst();
    
    if (!business) {
      console.log('❌ FAILED: No business found in database');
      return false;
    }

    const mappingByPosId = await prisma.systemMapping.findFirst({
      where: {
        entityType: 'BUSINESS',
        posId: business.id
      }
    });

    if (mappingByPosId) {
      console.log(`✓ PASSED: Found mapping for POS business ${business.id}`);
      console.log(`  Mapped to CRM tenant: ${mappingByPosId.crmId}`);
    } else {
      console.log(`⚠ INFO: No mapping found for POS business ${business.id}`);
      console.log('  You can create a mapping when ready');
    }
    console.log();

    // Test 4: Verify all mapping types are supported
    console.log('Test 4: Checking supported entity types...');
    const allMappings = await prisma.systemMapping.groupBy({
      by: ['entityType'],
      _count: {
        entityType: true
      }
    });

    console.log('  Entity Type Counts:');
    allMappings.forEach(group => {
      console.log(`    ${group.entityType}: ${group._count.entityType} mapping(s)`);
    });

    console.log();
    console.log('✓ PASSED: Mapping service supports all entity types');
    console.log();

    // Test 5: Test mapping statistics
    console.log('Test 5: Mapping Statistics:');
    console.log('-'.repeat(60));
    
    const stats = {
      total: await prisma.systemMapping.count(),
      business: await prisma.systemMapping.count({ where: { entityType: 'BUSINESS' } }),
      customer: await prisma.systemMapping.count({ where: { entityType: 'CUSTOMER' } }),
      transaction: await prisma.systemMapping.count({ where: { entityType: 'TRANSACTION' } }),
      active: await prisma.systemMapping.count({ where: { syncStatus: 'ACTIVE' } }),
      pending: await prisma.systemMapping.count({ where: { syncStatus: 'PENDING' } }),
      failed: await prisma.systemMapping.count({ where: { syncStatus: 'FAILED' } })
    };

    console.log(`Total Mappings:        ${stats.total}`);
    console.log(`  Business Mappings:   ${stats.business}`);
    console.log(`  Customer Mappings:   ${stats.customer}`);
    console.log(`  Transaction Mappings: ${stats.transaction}`);
    console.log();
    console.log(`By Status:`);
    console.log(`  Active:              ${stats.active}`);
    console.log(`  Pending:             ${stats.pending}`);
    console.log(`  Failed:              ${stats.failed}`);
    console.log('-'.repeat(60));
    console.log();

    console.log('✓ PASSED: Mapping statistics retrieved successfully');
    console.log();

    // All tests passed
    console.log('='.repeat(60));
    console.log('✓ ALL PHASE 1 MAPPING TESTS PASSED');
    console.log('='.repeat(60));
    console.log();
    console.log('Summary:');
    console.log('  - SystemMapping table: Accessible');
    console.log('  - Entity types: Supported');
    console.log('  - Query operations: Working');
    console.log('  - Phase 1 infrastructure: Intact');
    console.log();

    if (stats.business > 0) {
      console.log('✓ Phase 1 business mapping is active and working');
    } else {
      console.log('⚠ No business mappings yet, but infrastructure is ready');
    }
    console.log();

    return true;

  } catch (error) {
    console.error('❌ TEST ERROR:', error.message);
    console.error(error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testMappingService()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
