// src/services/integration/customerSyncService.js
/**
 * Customer Sync Service
 * Processes customer data from CRM and syncs to POS database
 */

import prisma from '../../config/database.js';
import * as MappingService from '../crmMappingService.js';

/**
 * Map CRM customer data to POS customer format
 * @param {Object} crmCustomer - Customer data from CRM
 * @returns {Object} - Mapped customer data for POS
 */
function mapCRMCustomerToPOS(crmCustomer) {
  return {
    firstName: crmCustomer.first_name || '',
    lastName: crmCustomer.last_name || '',
    email: crmCustomer.email || null,
    phone: crmCustomer.phone || null,
    dateOfBirth: crmCustomer.date_of_birth ? new Date(crmCustomer.date_of_birth) : null,
    address: crmCustomer.address || null,
    city: crmCustomer.city || null,
    state: crmCustomer.state || null,
    zipCode: crmCustomer.zip_code || null,
    
    // Loyalty fields - CRM is authoritative
    loyaltyPoints: crmCustomer.loyalty_points || 0,
    loyaltyTier: crmCustomer.loyalty_tier || 'BRONZE',
    totalSpent: parseFloat(crmCustomer.total_spent || 0),
    visitCount: crmCustomer.visit_count || 0,
    
    // Sync fields
    loyaltyPointsCRM: crmCustomer.loyalty_points || 0,
    loyaltyPointsLocal: crmCustomer.loyalty_points || 0, // Initialize local to CRM value
    loyaltyLastSyncedAt: new Date(),
    
    // Marketing and status
    marketingOptIn: crmCustomer.marketing_opt_in || false,
    isActive: crmCustomer.is_active !== false, // Default to true
    notes: crmCustomer.notes || null,
    
    // Sync metadata
    customerSource: 'CRM',
    syncState: 'SYNCED',
    lastSyncedAt: new Date(),
    lastRefreshedAt: new Date(),
    syncRetryCount: 0,
    syncError: null,
    isAnonymous: false,
    needsEnrichment: false,
    
    // External reference
    externalId: crmCustomer.id
  };
}

/**
 * Sync customer from CRM to POS
 * @param {Object} crmCustomer - Customer data from CRM
 * @param {string} businessId - POS business ID
 * @param {string} operation - 'created', 'updated', or 'deleted'
 * @returns {Object} - Result with success status and customer ID
 */
export async function syncCustomerFromCRM(crmCustomer, businessId, operation) {
  try {
    console.log(`[CUSTOMER SYNC] Processing ${operation} for CRM customer ${crmCustomer.id}`);
    
    // Handle deletion
    if (operation === 'deleted') {
      return await handleCustomerDeletion(crmCustomer.id, businessId);
    }
    
    // Check if customer already exists in POS via mapping
    // Use getPosId to find POS customer ID from CRM customer ID
    const posCustomerId = await MappingService.getPosId('CUSTOMER', crmCustomer.id);
    
    if (posCustomerId) {
      // Customer exists - update
      console.log(`[CUSTOMER SYNC] Updating existing customer: ${posCustomerId}`);
      return await updateExistingCustomer(
        posCustomerId,
        businessId,
        crmCustomer
      );
    } else {
      // Check if customer exists by phone/email (avoid duplicates)
      const duplicateCheck = await findDuplicateCustomer(businessId, crmCustomer);
      
      if (duplicateCheck) {
        console.log(`[CUSTOMER SYNC] Found duplicate customer by ${duplicateCheck.matchType}: ${duplicateCheck.customerId}`);
        
        // Create mapping for existing customer using createCustomerMapping
        await MappingService.createCustomerMapping(
          duplicateCheck.customerId,
          crmCustomer.id,
          businessId
        );
        
        // Update the existing customer with CRM data
        return await updateExistingCustomer(
          duplicateCheck.customerId,
          businessId,
          crmCustomer
        );
      }
      
      // New customer - create
      console.log(`[CUSTOMER SYNC] Creating new customer from CRM`);
      return await createNewCustomer(businessId, crmCustomer);
    }
    
  } catch (error) {
    console.error('[CUSTOMER SYNC] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Find duplicate customer by phone or email
 */
async function findDuplicateCustomer(businessId, crmCustomer) {
  try {
    // Check by phone first (more reliable)
    if (crmCustomer.phone) {
      const byPhone = await prisma.customer.findFirst({
        where: {
          businessId,
          phone: {
            contains: crmCustomer.phone.replace(/\D/g, '') // Normalize phone
          },
          isAnonymous: false
        }
      });
      
      if (byPhone) {
        return {
          customerId: byPhone.id,
          matchType: 'phone'
        };
      }
    }
    
    // Check by email
    if (crmCustomer.email) {
      const byEmail = await prisma.customer.findFirst({
        where: {
          businessId,
          email: crmCustomer.email,
          isAnonymous: false
        }
      });
      
      if (byEmail) {
        return {
          customerId: byEmail.id,
          matchType: 'email'
        };
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('[CUSTOMER SYNC] Error checking duplicates:', error);
    return null;
  }
}

/**
 * Create new customer from CRM data
 */
async function createNewCustomer(businessId, crmCustomer) {
  try {
    const customerData = mapCRMCustomerToPOS(crmCustomer);
    customerData.businessId = businessId;
    
    // Create customer
    const customer = await prisma.customer.create({
      data: customerData
    });
    
    console.log(`[CUSTOMER SYNC] Created customer: ${customer.id}`);
    
    // Create system mapping using createCustomerMapping
    await MappingService.createCustomerMapping(
      customer.id,
      crmCustomer.id,
      businessId
    );
    
    console.log(`[CUSTOMER SYNC] Created mapping: POS ${customer.id} <-> CRM ${crmCustomer.id}`);
    
    return {
      success: true,
      customerId: customer.id,
      operation: 'created'
    };
    
  } catch (error) {
    console.error('[CUSTOMER SYNC] Error creating customer:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update existing customer with CRM data
 */
async function updateExistingCustomer(customerId, businessId, crmCustomer) {
  try {
    const customerData = mapCRMCustomerToPOS(crmCustomer);
    
    // Update customer
    const customer = await prisma.customer.update({
      where: {
        id: customerId,
        businessId // Ensure business ownership
      },
      data: customerData
    });
    
    console.log(`[CUSTOMER SYNC] Updated customer: ${customer.id}`);
    
    // Check for loyalty point discrepancies
    await checkLoyaltyDiscrepancy(customer);
    
    return {
      success: true,
      customerId: customer.id,
      operation: 'updated'
    };
    
  } catch (error) {
    console.error('[CUSTOMER SYNC] Error updating customer:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle customer deletion
 */
async function handleCustomerDeletion(crmCustomerId, businessId) {
  try {
    // Find POS customer ID from CRM customer ID
    const posCustomerId = await MappingService.getPosId('CUSTOMER', crmCustomerId);
    
    if (!posCustomerId) {
      console.log(`[CUSTOMER SYNC] No mapping found for deleted customer: ${crmCustomerId}`);
      return {
        success: true,
        message: 'Customer not found in POS'
      };
    }
    
    // Soft delete - mark as inactive instead of hard delete
    // This preserves transaction history
    await prisma.customer.update({
      where: {
        id: posCustomerId,
        businessId
      },
      data: {
        isActive: false,
        syncState: 'SYNCED',
        lastSyncedAt: new Date(),
        notes: 'Customer deleted in CRM'
      }
    });
    
    // Update mapping status
    await MappingService.updateMappingStatus('CUSTOMER', posCustomerId, 'ARCHIVED');
    
    console.log(`[CUSTOMER SYNC] Soft deleted customer: ${posCustomerId}`);
    
    return {
      success: true,
      operation: 'deleted'
    };
    
  } catch (error) {
    console.error('[CUSTOMER SYNC] Error deleting customer:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check for loyalty point discrepancies
 */
async function checkLoyaltyDiscrepancy(customer) {
  try {
    // If local and CRM points differ significantly (>10%), create reconciliation record
    const localPoints = customer.loyaltyPointsLocal || 0;
    const crmPoints = customer.loyaltyPointsCRM || 0;
    const difference = Math.abs(localPoints - crmPoints);
    
    if (difference > 0 && difference > (crmPoints * 0.1)) {
      console.log(`[LOYALTY] Discrepancy detected: Local ${localPoints} vs CRM ${crmPoints}`);
      
      // Create reconciliation record
      await prisma.loyaltyReconciliation.create({
        data: {
          customerId: customer.id,
          businessId: customer.businessId,
          pointsLocal: localPoints,
          pointsCRM: crmPoints,
          difference: localPoints - crmPoints,
          status: 'PENDING',
          detectedAt: new Date()
        }
      });
      
      console.log(`[LOYALTY] Created reconciliation record for customer ${customer.id}`);
    }
    
  } catch (error) {
    console.error('[LOYALTY] Error checking discrepancy:', error);
  }
}

/**
 * Get sync statistics
 */
export async function getSyncStats(businessId) {
  try {
    const mappings = await MappingService.getBusinessMappings(businessId, 'CUSTOMER');
    
    const customers = await prisma.customer.findMany({
      where: {
        businessId,
        customerSource: 'CRM',
        isAnonymous: false
      },
      select: {
        syncState: true,
        lastSyncedAt: true
      }
    });
    
    const syncStates = customers.reduce((acc, customer) => {
      acc[customer.syncState] = (acc[customer.syncState] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total: customers.length,
      mappings: mappings.length,
      syncStates,
      lastSync: customers.length > 0 
        ? customers.reduce((latest, c) => 
            c.lastSyncedAt > latest ? c.lastSyncedAt : latest, 
            customers[0].lastSyncedAt
          )
        : null
    };
    
  } catch (error) {
    console.error('[CUSTOMER SYNC] Error getting stats:', error);
    return {
      total: 0,
      mappings: 0,
      syncStates: {},
      lastSync: null
    };
  }
}
