/**
 * Create Business-Tenant Mapping in POS Database
 * Run with: node create-pos-mapping.js
 */

import mappingService from './src/services/crmMappingService.js';

const businessId = 'e6fa01f0-857a-4e23-bc86-346a816cd4f4';
const tenantUuid = 'a-cx-d8bf4';

async function createPOSMapping() {
  try {
    console.log('Creating Business-Tenant mapping in POS database...\n');
    
    const mapping = await mappingService.createBusinessMapping(
      businessId,
      tenantUuid,
      {
        note: 'Initial setup mapping - created from POS side',
        created_by: 'manual',
        source: 'pos_setup'
      }
    );
    
    console.log('✓ Mapping created successfully!');
    console.log('\nMapping Details:');
    console.log('  Mapping ID:', mapping.id);
    console.log('  Entity Type:', mapping.entityType);
    console.log('  POS Business ID:', mapping.posId);
    console.log('  CRM Tenant UUID:', mapping.crmId);
    console.log('  Status:', mapping.syncStatus);
    
    // Verify it works
    console.log('\n✓ Verification:');
    const retrievedTenant = await mappingService.getTenantUuid(businessId);
    console.log('  Business ID → Tenant UUID:', retrievedTenant);
    
    const retrievedBusiness = await mappingService.getBusinessId(tenantUuid);
    console.log('  Tenant UUID → Business ID:', retrievedBusiness);
    
    console.log('\n✓ Phase 1 Complete!');
    console.log('  Both POS and CRM now have the business-tenant mapping');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

createPOSMapping();
