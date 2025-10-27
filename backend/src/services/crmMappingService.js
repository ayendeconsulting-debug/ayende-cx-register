/**
 * CRM Mapping Service
 * Manages ID mappings between POS system and CRM system
 * 
 * This service handles the SystemMapping table which stores:
 * - Business ID (POS) <-> Tenant UUID (CRM)
 * - Customer ID (POS) <-> Customer UUID (CRM)
 * - Transaction ID (POS) <-> Transaction UUID (CRM)
 */

import prisma from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create or update a mapping between POS and CRM entities
 * 
 * @param {Object} params - Mapping parameters
 * @param {string} params.entityType - Type of entity: 'BUSINESS', 'CUSTOMER', 'TRANSACTION'
 * @param {string} params.posId - ID in POS system
 * @param {string} params.crmId - UUID in CRM system
 * @param {string} params.businessId - Business ID this mapping belongs to
 * @param {Object} params.metadata - Optional additional data
 * @returns {Promise<Object>} Created or updated mapping
 */
export const createMapping = async ({ entityType, posId, crmId, businessId, metadata = null }) => {
  try {
    // Check if mapping already exists
    const existing = await prisma.systemMapping.findFirst({
      where: {
        entityType,
        posId,
      },
    });

    if (existing) {
      // Update existing mapping
      return await prisma.systemMapping.update({
        where: { id: existing.id },
        data: {
          crmId,
          lastSyncedAt: new Date(),
          syncStatus: 'ACTIVE',
          metadata,
          updatedAt: new Date(),
        },
      });
    }

    // Create new mapping
    return await prisma.systemMapping.create({
      data: {
        id: uuidv4(),
        entityType,
        posId,
        crmId,
        businessId,
        lastSyncedAt: new Date(),
        syncStatus: 'ACTIVE',
        metadata,
      },
    });
  } catch (error) {
    console.error('[MAPPING SERVICE] Error creating mapping:', error);
    throw error;
  }
};

/**
 * Get CRM ID from POS ID
 * 
 * @param {string} entityType - Type of entity
 * @param {string} posId - POS system ID
 * @returns {Promise<string|null>} CRM UUID or null if not found
 */
export const getCrmId = async (entityType, posId) => {
  try {
    const mapping = await prisma.systemMapping.findUnique({
      where: {
        entityType_posId: {
          entityType,
          posId,
        },
      },
      select: {
        crmId: true,
      },
    });

    return mapping?.crmId || null;
  } catch (error) {
    console.error('[MAPPING SERVICE] Error getting CRM ID:', error);
    return null;
  }
};

/**
 * Get POS ID from CRM ID
 * 
 * @param {string} entityType - Type of entity
 * @param {string} crmId - CRM system UUID
 * @returns {Promise<string|null>} POS ID or null if not found
 */
export const getPosId = async (entityType, crmId) => {
  try {
    const mapping = await prisma.systemMapping.findUnique({
      where: {
        entityType_crmId: {
          entityType,
          crmId,
        },
      },
      select: {
        posId: true,
      },
    });

    return mapping?.posId || null;
  } catch (error) {
    console.error('[MAPPING SERVICE] Error getting POS ID:', error);
    return null;
  }
};

/**
 * Get complete mapping record
 * 
 * @param {string} entityType - Type of entity
 * @param {string} posId - POS system ID
 * @returns {Promise<Object|null>} Complete mapping record or null
 */
export const getMapping = async (entityType, posId) => {
  try {
    return await prisma.systemMapping.findUnique({
      where: {
        entityType_posId: {
          entityType,
          posId,
        },
      },
      include: {
        business: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('[MAPPING SERVICE] Error getting mapping:', error);
    return null;
  }
};

/**
 * Get all mappings for a business
 * 
 * @param {string} businessId - Business ID
 * @param {string} entityType - Optional: filter by entity type
 * @returns {Promise<Array>} Array of mapping records
 */
export const getBusinessMappings = async (businessId, entityType = null) => {
  try {
    const where = { businessId };
    if (entityType) {
      where.entityType = entityType;
    }

    return await prisma.systemMapping.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('[MAPPING SERVICE] Error getting business mappings:', error);
    return [];
  }
};

/**
 * Delete a mapping
 * 
 * @param {string} entityType - Type of entity
 * @param {string} posId - POS system ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteMapping = async (entityType, posId) => {
  try {
    await prisma.systemMapping.delete({
      where: {
        entityType_posId: {
          entityType,
          posId,
        },
      },
    });
    return true;
  } catch (error) {
    console.error('[MAPPING SERVICE] Error deleting mapping:', error);
    return false;
  }
};

/**
 * Update mapping status
 * 
 * @param {string} entityType - Type of entity
 * @param {string} posId - POS system ID
 * @param {string} status - New status: 'ACTIVE', 'PENDING', 'FAILED', 'ARCHIVED'
 * @returns {Promise<Object|null>} Updated mapping or null
 */
export const updateMappingStatus = async (entityType, posId, status) => {
  try {
    return await prisma.systemMapping.update({
      where: {
        entityType_posId: {
          entityType,
          posId,
        },
      },
      data: {
        syncStatus: status,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('[MAPPING SERVICE] Error updating mapping status:', error);
    return null;
  }
};

/**
 * Create business-tenant mapping
 * This is the primary mapping that must exist before any other mappings
 * 
 * @param {string} businessId - POS Business ID
 * @param {string} tenantUuid - CRM Tenant UUID
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<Object>} Created mapping
 */
export const createBusinessMapping = async (businessId, tenantUuid, metadata = null) => {
  try {
    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        businessName: true,
        externalTenantId: true,
      },
    });

    if (!business) {
      throw new Error(`Business not found: ${businessId}`);
    }

    // Create mapping
    const mapping = await createMapping({
      entityType: 'BUSINESS',
      posId: businessId,
      crmId: tenantUuid,
      businessId: businessId,
      metadata: {
        ...metadata,
        businessName: business.businessName,
        createdAt: new Date().toISOString(),
      },
    });

    // Update Business table with externalTenantId
    await prisma.business.update({
      where: { id: businessId },
      data: {
        externalTenantId: tenantUuid,
        lastSyncedAt: new Date(),
        syncStatus: 'ACTIVE',
      },
    });

    console.log(`[MAPPING SERVICE] Business mapping created: ${businessId} <-> ${tenantUuid}`);
    return mapping;
  } catch (error) {
    console.error('[MAPPING SERVICE] Error creating business mapping:', error);
    throw error;
  }
};

/**
 * Create customer mapping
 * 
 * @param {string} customerId - POS Customer ID
 * @param {string} customerUuid - CRM Customer UUID
 * @param {string} businessId - Business ID this customer belongs to
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<Object>} Created mapping
 */
export const createCustomerMapping = async (customerId, customerUuid, businessId, metadata = null) => {
  try {
    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        businessId: true,
      },
    });

    if (!customer) {
      throw new Error(`Customer not found: ${customerId}`);
    }

    if (customer.businessId !== businessId) {
      throw new Error(`Customer ${customerId} does not belong to business ${businessId}`);
    }

    // Create mapping
    const mapping = await createMapping({
      entityType: 'CUSTOMER',
      posId: customerId,
      crmId: customerUuid,
      businessId: businessId,
      metadata: {
        ...metadata,
        customerName: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        createdAt: new Date().toISOString(),
      },
    });

    // Update Customer table with externalId
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        externalId: customerUuid,
        lastSyncedAt: new Date(),
        syncStatus: 'ACTIVE',
      },
    });

    console.log(`[MAPPING SERVICE] Customer mapping created: ${customerId} <-> ${customerUuid}`);
    return mapping;
  } catch (error) {
    console.error('[MAPPING SERVICE] Error creating customer mapping:', error);
    throw error;
  }
};

/**
 * Create transaction mapping
 * 
 * @param {string} transactionId - POS Transaction ID
 * @param {string} transactionUuid - CRM Transaction UUID
 * @param {string} businessId - Business ID
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<Object>} Created mapping
 */
export const createTransactionMapping = async (transactionId, transactionUuid, businessId, metadata = null) => {
  try {
    // Verify transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        transactionNumber: true,
        businessId: true,
      },
    });

    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    if (transaction.businessId !== businessId) {
      throw new Error(`Transaction ${transactionId} does not belong to business ${businessId}`);
    }

    // Create mapping
    const mapping = await createMapping({
      entityType: 'TRANSACTION',
      posId: transactionId,
      crmId: transactionUuid,
      businessId: businessId,
      metadata: {
        ...metadata,
        transactionNumber: transaction.transactionNumber,
        createdAt: new Date().toISOString(),
      },
    });

    // Update Transaction table with externalId
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        externalId: transactionUuid,
        syncedAt: new Date(),
        syncStatus: 'ACTIVE',
      },
    });

    console.log(`[MAPPING SERVICE] Transaction mapping created: ${transactionId} <-> ${transactionUuid}`);
    return mapping;
  } catch (error) {
    console.error('[MAPPING SERVICE] Error creating transaction mapping:', error);
    throw error;
  }
};

/**
 * Get tenant UUID for a business
 * 
 * @param {string} businessId - Business ID
 * @returns {Promise<string|null>} Tenant UUID or null
 */
export const getTenantUuid = async (businessId) => {
  return await getCrmId('BUSINESS', businessId);
};

/**
 * Get business ID from tenant UUID
 * 
 * @param {string} tenantUuid - CRM Tenant UUID
 * @returns {Promise<string|null>} Business ID or null
 */
export const getBusinessId = async (tenantUuid) => {
  return await getPosId('BUSINESS', tenantUuid);
};

/**
 * Get mapping statistics for a business
 * 
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Statistics object
 */
export const getMappingStats = async (businessId) => {
  try {
    const [
      totalMappings,
      customerMappings,
      transactionMappings,
      activeMappings,
      failedMappings,
    ] = await Promise.all([
      prisma.systemMapping.count({ where: { businessId } }),
      prisma.systemMapping.count({ where: { businessId, entityType: 'CUSTOMER' } }),
      prisma.systemMapping.count({ where: { businessId, entityType: 'TRANSACTION' } }),
      prisma.systemMapping.count({ where: { businessId, syncStatus: 'ACTIVE' } }),
      prisma.systemMapping.count({ where: { businessId, syncStatus: 'FAILED' } }),
    ]);

    return {
      total: totalMappings,
      byType: {
        business: 1, // Should always be 1
        customer: customerMappings,
        transaction: transactionMappings,
      },
      byStatus: {
        active: activeMappings,
        failed: failedMappings,
      },
    };
  } catch (error) {
    console.error('[MAPPING SERVICE] Error getting mapping stats:', error);
    return null;
  }
};

/**
 * Validate mapping integrity
 * Checks that all mapped entities still exist in both systems
 * 
 * @param {string} businessId - Business ID to validate
 * @returns {Promise<Object>} Validation results
 */
export const validateMappings = async (businessId) => {
  try {
    const mappings = await getBusinessMappings(businessId);
    const results = {
      total: mappings.length,
      valid: 0,
      invalid: [],
    };

    for (const mapping of mappings) {
      let exists = false;

      // Check if entity exists in POS system
      if (mapping.entityType === 'CUSTOMER') {
        const customer = await prisma.customer.findUnique({
          where: { id: mapping.posId },
        });
        exists = !!customer;
      } else if (mapping.entityType === 'TRANSACTION') {
        const transaction = await prisma.transaction.findUnique({
          where: { id: mapping.posId },
        });
        exists = !!transaction;
      } else if (mapping.entityType === 'BUSINESS') {
        const business = await prisma.business.findUnique({
          where: { id: mapping.posId },
        });
        exists = !!business;
      }

      if (exists) {
        results.valid++;
      } else {
        results.invalid.push({
          mappingId: mapping.id,
          entityType: mapping.entityType,
          posId: mapping.posId,
          crmId: mapping.crmId,
          reason: 'Entity not found in POS system',
        });
      }
    }

    return results;
  } catch (error) {
    console.error('[MAPPING SERVICE] Error validating mappings:', error);
    throw error;
  }
};

export default {
  // Core mapping functions
  createMapping,
  getCrmId,
  getPosId,
  getMapping,
  getBusinessMappings,
  deleteMapping,
  updateMappingStatus,

  // Entity-specific functions
  createBusinessMapping,
  createCustomerMapping,
  createTransactionMapping,
  getTenantUuid,
  getBusinessId,

  // Utility functions
  getMappingStats,
  validateMappings,
};
