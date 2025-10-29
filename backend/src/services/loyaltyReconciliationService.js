/**
 * Loyalty Reconciliation Service
 * PHASE 2E: Compare and reconcile loyalty points between POS and CRM
 * 
 * Location: src/services/loyaltyReconciliationService.js
 */

import prisma from '../config/database.js';
import { fetchCustomerFromCRM } from './crmIntegrationService.js';

/**
 * Reconciliation thresholds
 */
const RECONCILIATION_CONFIG = {
  AUTO_SYNC_THRESHOLD: 10,      // Auto-sync if difference <= 10 points
  ALERT_THRESHOLD: 100,          // Alert if difference > 100 points
  MAX_DISCREPANCY_PERCENT: 0.05, // Alert if difference > 5% of total
};

/**
 * Reconcile loyalty points for a single customer
 * @param {string} businessId - Business ID
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} Reconciliation result
 */
export const reconcileCustomerLoyalty = async (businessId, customerId) => {
  try {
    console.log(`[RECONCILIATION] Starting reconciliation for customer ${customerId}`);
    
    // 1. Fetch customer from POS
    const posCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId,
        isAnonymous: false, // Skip anonymous customers
        isActive: true,
      },
      include: {
        business: true,
      },
    });

    if (!posCustomer) {
      console.log(`[RECONCILIATION] Customer ${customerId} not found or inactive`);
      return null;
    }

    // Skip if customer has no external ID (not synced to CRM yet)
    if (!posCustomer.externalId) {
      console.log(`[RECONCILIATION] Customer ${customerId} not synced to CRM yet, skipping`);
      return null;
    }

    // 2. Fetch customer from CRM
    let crmCustomer;
    try {
      crmCustomer = await fetchCustomerFromCRM(
        posCustomer.externalId,
        businessId,
        'id'
      );
    } catch (error) {
      console.error(`[RECONCILIATION] Failed to fetch customer from CRM: ${error.message}`);
      
      // Log reconciliation failure
      await prisma.loyaltyReconciliation.create({
        data: {
          businessId,
          customerId,
          posPoints: posCustomer.loyaltyPoints || 0,
          crmPoints: 0,
          discrepancy: posCustomer.loyaltyPoints || 0,
          action: 'FAILED',
          status: 'FAILED',
          errorMessage: `Failed to fetch from CRM: ${error.message}`,
        },
      });
      
      return {
        success: false,
        error: error.message,
      };
    }

    if (!crmCustomer) {
      console.log(`[RECONCILIATION] Customer ${customerId} not found in CRM`);
      return null;
    }

    // 3. Compare loyalty points
    const posPoints = posCustomer.loyaltyPoints || 0;
    const crmPoints = crmCustomer.loyalty_points || 0;
    const discrepancy = posPoints - crmPoints;

    console.log(`[RECONCILIATION] Customer ${posCustomer.email}:`);
    console.log(`  POS Points: ${posPoints}`);
    console.log(`  CRM Points: ${crmPoints}`);
    console.log(`  Discrepancy: ${discrepancy}`);

    // 4. Determine resolution action
    let action = 'NONE';
    let status = 'RESOLVED';
    let notes = null;

    if (discrepancy === 0) {
      // Perfect match - no action needed
      action = 'NONE';
      notes = 'Points match perfectly';
      console.log(`[RECONCILIATION] Points match, no action needed`);
    } else if (Math.abs(discrepancy) <= RECONCILIATION_CONFIG.AUTO_SYNC_THRESHOLD) {
      // Small discrepancy - auto-sync
      action = 'AUTO_SYNC';
      notes = `Small discrepancy (${discrepancy}), auto-syncing`;
      console.log(`[RECONCILIATION] Small discrepancy, will auto-sync`);
      
      // Update POS to match CRM (CRM is source of truth)
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: crmPoints,
          loyaltyPointsCRM: crmPoints,
          loyaltyLastSyncedAt: new Date(),
        },
      });
    } else if (Math.abs(discrepancy) > RECONCILIATION_CONFIG.ALERT_THRESHOLD) {
      // Large discrepancy - needs manual review
      action = 'MANUAL_REVIEW';
      status = 'PENDING';
      notes = `Large discrepancy (${discrepancy}), flagged for manual review`;
      console.log(`[RECONCILIATION] ALERT: Large discrepancy, needs manual review`);
    } else {
      // Medium discrepancy - sync but log
      action = 'SYNC_WITH_LOG';
      notes = `Medium discrepancy (${discrepancy}), synced with audit log`;
      console.log(`[RECONCILIATION] Medium discrepancy, syncing with log`);
      
      // Update POS to match CRM
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: crmPoints,
          loyaltyPointsCRM: crmPoints,
          loyaltyLastSyncedAt: new Date(),
        },
      });
    }

    // 5. Log reconciliation
    const reconciliation = await prisma.loyaltyReconciliation.create({
      data: {
        businessId,
        customerId,
        posPoints,
        crmPoints,
        discrepancy,
        action,
        status,
        notes,
        resolvedAt: status === 'RESOLVED' ? new Date() : null,
      },
    });

    console.log(`[RECONCILIATION] Reconciliation logged: ${reconciliation.id}`);

    return {
      success: true,
      reconciliation,
      action: action,
      discrepancy,
    };
  } catch (error) {
    console.error(`[RECONCILIATION] Error reconciling customer ${customerId}:`, error);
    throw error;
  }
};

/**
 * Reconcile loyalty points for all customers in a business
 * @param {string} businessId - Business ID
 * @returns {Promise<Object>} Reconciliation summary
 */
export const reconcileAllCustomers = async (businessId) => {
  try {
    console.log(`[RECONCILIATION] Starting full reconciliation for business ${businessId}`);
    const startTime = Date.now();

    // Get all non-anonymous, active customers with external IDs
    const customers = await prisma.customer.findMany({
      where: {
        businessId,
        isAnonymous: false,
        isActive: true,
        externalId: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        loyaltyPoints: true,
      },
    });

    console.log(`[RECONCILIATION] Found ${customers.length} customers to reconcile`);

    const results = {
      totalCustomers: customers.length,
      processed: 0,
      matched: 0,
      autoSynced: 0,
      manualReview: 0,
      failed: 0,
      errors: [],
    };

    // Process each customer
    for (const customer of customers) {
      try {
        const result = await reconcileCustomerLoyalty(businessId, customer.id);
        
        if (result) {
          results.processed++;
          
          if (result.success) {
            switch (result.action) {
              case 'NONE':
                results.matched++;
                break;
              case 'AUTO_SYNC':
                results.autoSynced++;
                break;
              case 'MANUAL_REVIEW':
                results.manualReview++;
                break;
              case 'SYNC_WITH_LOG':
                results.autoSynced++;
                break;
            }
          } else {
            results.failed++;
            results.errors.push({
              customerId: customer.id,
              email: customer.email,
              error: result.error,
            });
          }
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          customerId: customer.id,
          email: customer.email,
          error: error.message,
        });
        console.error(`[RECONCILIATION] Error processing ${customer.email}:`, error.message);
      }
    }

    const duration = Date.now() - startTime;

    console.log(`\n[RECONCILIATION] Reconciliation Complete`);
    console.log(`  Total Customers: ${results.totalCustomers}`);
    console.log(`  Processed: ${results.processed}`);
    console.log(`  Matched: ${results.matched}`);
    console.log(`  Auto-Synced: ${results.autoSynced}`);
    console.log(`  Manual Review: ${results.manualReview}`);
    console.log(`  Failed: ${results.failed}`);
    console.log(`  Duration: ${duration}ms`);

    return results;
  } catch (error) {
    console.error(`[RECONCILIATION] Error in full reconciliation:`, error);
    throw error;
  }
};

/**
 * Get reconciliation history for a customer
 * @param {string} customerId - Customer ID
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>} Reconciliation history
 */
export const getCustomerReconciliationHistory = async (customerId, limit = 10) => {
  return await prisma.loyaltyReconciliation.findMany({
    where: { customerId },
    orderBy: { detectedAt: 'desc' },
    take: limit,
    include: {
      customer: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

/**
 * Get reconciliation summary for a business
 * @param {string} businessId - Business ID
 * @param {Date} startDate - Start date (optional)
 * @param {Date} endDate - End date (optional)
 * @returns {Promise<Object>} Reconciliation summary
 */
export const getReconciliationSummary = async (businessId, startDate = null, endDate = null) => {
  const where = {
    businessId,
  };

  if (startDate || endDate) {
    where.detectedAt = {};
    if (startDate) where.detectedAt.gte = startDate;
    if (endDate) where.detectedAt.lte = endDate;
  }

  const [
    total,
    matched,
    autoSynced,
    manualReview,
    failed,
    totalDiscrepancy,
  ] = await Promise.all([
    prisma.loyaltyReconciliation.count({ where }),
    prisma.loyaltyReconciliation.count({
      where: { ...where, action: 'NONE' },
    }),
    prisma.loyaltyReconciliation.count({
      where: {
        ...where,
        action: { in: ['AUTO_SYNC', 'SYNC_WITH_LOG'] },
      },
    }),
    prisma.loyaltyReconciliation.count({
      where: { ...where, action: 'MANUAL_REVIEW' },
    }),
    prisma.loyaltyReconciliation.count({
      where: { ...where, status: 'FAILED' },
    }),
    prisma.loyaltyReconciliation.aggregate({
      where,
      _sum: { discrepancy: true },
    }),
  ]);

  return {
    total,
    matched,
    autoSynced,
    manualReview,
    failed,
    totalDiscrepancy: totalDiscrepancy._sum.discrepancy || 0,
    averageDiscrepancy: total > 0 ? (totalDiscrepancy._sum.discrepancy || 0) / total : 0,
  };
};

/**
 * Get items needing manual review
 * @param {string} businessId - Business ID
 * @returns {Promise<Array>} Items needing review
 */
export const getItemsNeedingReview = async (businessId) => {
  return await prisma.loyaltyReconciliation.findMany({
    where: {
      businessId,
      status: 'PENDING',
      action: 'MANUAL_REVIEW',
    },
    orderBy: { detectedAt: 'desc' },
    include: {
      customer: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
  });
};

export default {
  reconcileCustomerLoyalty,
  reconcileAllCustomers,
  getCustomerReconciliationHistory,
  getReconciliationSummary,
  getItemsNeedingReview,
  RECONCILIATION_CONFIG,
};
