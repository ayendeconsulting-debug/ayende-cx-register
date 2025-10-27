/**
 * CRM Integration Service
 * Handles synchronization between POS and CRM systems
 * 
 * This service sends data from POS (source of truth for transactions)
 * to CRM (source of truth for customer profiles)
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

// Configuration
const CRM_API_URL = process.env.CRM_API_URL || 'http://ayendecx.com';
const INTEGRATION_SECRET = process.env.INTEGRATION_SECRET;
const SYNC_TIMEOUT = parseInt(process.env.CRM_API_TIMEOUT || '30000');
const ENABLE_SYNC = process.env.ENABLE_REALTIME_SYNC === 'true';
const MAX_RETRY_ATTEMPTS = parseInt(process.env.SYNC_RETRY_ATTEMPTS || '3');

/**
 * Generate JWT token for system-to-system authentication
 */
const generateIntegrationToken = (tenantId) => {
  if (!INTEGRATION_SECRET) {
    throw new Error('INTEGRATION_SECRET not configured');
  }

  return jwt.sign(
    {
      iss: 'ayende-pos',
      sub: 'system-to-system',
      tenantId,
      scope: 'integration',
    },
    INTEGRATION_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * Make authenticated request to CRM API
 */
const crmApiRequest = async (endpoint, method, data, tenantId) => {
  if (!ENABLE_SYNC) {
    console.log('[CRM SYNC] Sync disabled, skipping request');
    return null;
  }

  try {
    const token = generateIntegrationToken(tenantId);
    const url = `${CRM_API_URL}${endpoint}`;

    const response = await axios({
      method,
      url,
      data,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
      },
      timeout: SYNC_TIMEOUT,
    });

    return response.data;
  } catch (error) {
    console.error('[CRM SYNC ERROR]', {
      endpoint,
      error: error.message,
      response: error.response?.data,
    });

    throw error;
  }
};

/**
 * Log sync operation to database
 */
const logSyncOperation = async (operation, entityType, entityId, businessId, status, payload, error = null) => {
  try {
    await prisma.syncLog.create({
      data: {
        businessId,
        operation,
        direction: 'POS_TO_CRM',
        entityType,
        entityId,
        status,
        payload: JSON.stringify(payload),
        errorMessage: error ? error.message : null,
        attemptCount: 1,
      },
    });
  } catch (logError) {
    console.error('[SYNC LOG ERROR]', logError);
  }
};

/**
 * Retry wrapper with exponential backoff
 */
const retryOperation = async (operation, maxRetries = MAX_RETRY_ATTEMPTS) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 2^attempt seconds
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`[CRM SYNC] Retry attempt ${attempt} in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Sync transaction to CRM (Real-time)
 * Called immediately after transaction is completed in POS
 */
export const syncTransactionToCRM = async (transaction) => {
  if (!ENABLE_SYNC) {
    console.log('[CRM SYNC] Transaction sync disabled');
    return;
  }

  console.log(`[CRM SYNC] Syncing transaction ${transaction.transactionNumber} to CRM`);

  try {
    // Prepare payload
    const payload = {
      transactionId: transaction.id,
      transactionNumber: transaction.transactionNumber,
      tenantId: transaction.business.externalTenantId,  // ✅ Correct - sends CRM tenant UUID
      customerId: transaction.customerId,
      customerEmail: transaction.customer?.email,
      
      // Financial data
      amount: parseFloat(transaction.subtotal),
      tax: parseFloat(transaction.taxAmount),
      discount: parseFloat(transaction.discountAmount),
      total: parseFloat(transaction.total),
      currency: transaction.currency,
      currencyCode: transaction.currencyCode,
      
      // Payment details
      paymentMethod: transaction.paymentMethod,
      amountPaid: parseFloat(transaction.amountPaid),
      changeGiven: parseFloat(transaction.changeGiven),
      
      // Loyalty
      pointsEarned: transaction.loyaltyPointsEarned,
      pointsRedeemed: transaction.loyaltyPointsRedeemed,
      
      // Items
      items: transaction.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        subtotal: parseFloat(item.subtotal),
        discount: parseFloat(item.discount),
        tax: parseFloat(item.tax),
        total: parseFloat(item.total),
      })),
      
      // Metadata
      status: transaction.status,
      notes: transaction.notes,
      createdBy: transaction.userId,
      timestamp: transaction.createdAt.toISOString(),
    };

    // Send to CRM with retry
    await retryOperation(async () => {
      return await crmApiRequest(
        '/api/v1/sync/transaction',
        'POST',
        payload,
        transaction.businessId
      );
    });

    // Update transaction to mark as synced
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        syncedToCRM: true,
        syncedAt: new Date(),
      },
    });

    // Log success
    await logSyncOperation(
      'transaction_sync',
      'transaction',
      transaction.id,
      transaction.businessId,
      'SUCCESS',
      payload
    );

    console.log(`[CRM SYNC] Transaction ${transaction.transactionNumber} synced successfully`);
  } catch (error) {
    console.error(`[CRM SYNC] Failed to sync transaction ${transaction.transactionNumber}`, error);

    // Log failure
    await logSyncOperation(
      'transaction_sync',
      'transaction',
      transaction.id,
      transaction.businessId,
      'FAILED',
      { transactionId: transaction.id },
      error
    );

    // Don't throw error - transaction should still complete
    // Failed syncs will be retried later
  }
};

/**
 * Sync customer to CRM (Real-time)
 * Called when customer is created or updated in POS
 */
export const syncCustomerToCRM = async (customer, operation = 'create') => {
  if (!ENABLE_SYNC) {
    console.log('[CRM SYNC] Customer sync disabled');
    return;
  }

  console.log(`[CRM SYNC] Syncing customer ${customer.email} to CRM (${operation})`);

  try {
    // Prepare payload
    const payload = {
      customerId: customer.id,
      tenantId: customer.businessId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      postalCode: customer.postalCode,
      country: customer.country,
      dateOfBirth: customer.dateOfBirth?.toISOString() || null,
      
      // Loyalty data (POS is source of truth)
      loyaltyPoints: customer.loyaltyPoints,
      loyaltyTier: customer.loyaltyTier,
      totalSpent: parseFloat(customer.totalSpent),
      visitCount: customer.visitCount,
      lastVisit: customer.lastVisit?.toISOString() || null,
      
      // Preferences
      marketingOptIn: customer.marketingOptIn,
      
      // Metadata
      memberSince: customer.memberSince.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };

    // Send to CRM with retry
    await retryOperation(async () => {
      return await crmApiRequest(
        '/api/v1/sync/customer',
        'POST',
        payload,
        customer.businessId
      );
    });

    // Update customer to mark as synced
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        lastSyncedAt: new Date(),
      },
    });

    // Log success
    await logSyncOperation(
      'customer_sync',
      'customer',
      customer.id,
      customer.businessId,
      'SUCCESS',
      payload
    );

    console.log(`[CRM SYNC] Customer ${customer.email} synced successfully`);
  } catch (error) {
    console.error(`[CRM SYNC] Failed to sync customer ${customer.email}`, error);

    // Log failure
    await logSyncOperation(
      'customer_sync',
      'customer',
      customer.id,
      customer.businessId,
      'FAILED',
      { customerId: customer.id },
      error
    );

    // Don't throw error - customer creation should still complete
  }
};

/**
 * Fetch customer profile from CRM
 * Used to get latest customer data (CRM is source of truth for profiles)
 */
export const fetchCustomerFromCRM = async (identifier, businessId, lookupType = 'email') => {
  try {
    let endpoint;
    
    if (lookupType === 'email') {
      endpoint = `/api/v1/customers/${encodeURIComponent(identifier)}`;
    } else if (lookupType === 'phone') {
      endpoint = `/api/v1/customers/check-phone?phone=${encodeURIComponent(identifier)}`;
    } else {
      throw new Error(`Invalid lookup type: ${lookupType}`);
    }

    const response = await retryOperation(async () => {
      return await crmApiRequest(
        endpoint,
        'GET',
        null,
        businessId
      );
    });

    // For phone lookup, API returns { exists: boolean, customer: object }
    if (lookupType === 'phone') {
      return response?.exists ? response.customer : null;
    }

    return response;
  } catch (error) {
    console.error(`[CRM SYNC] Failed to fetch customer ${identifier}:`, error);
    return null;
  }
};

/**
 * Update customer profile from CRM data
 * Called during hourly sync job
 */
export const updateCustomerFromCRM = async (crmCustomerData) => {
  try {
    const { customerId, tenantId, ...customerData } = crmCustomerData;

    // Find customer by email or external ID
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { id: customerId },
          { email: customerData.email, businessId: tenantId },
        ],
      },
    });

    if (!customer) {
      console.log(`[CRM SYNC] Customer not found in POS: ${customerData.email}`);
      return null;
    }

    // Update only profile fields (not transaction data)
    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        email: customerData.email,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        phone: customerData.phone,
        address: customerData.address,
        city: customerData.city,
        postalCode: customerData.postalCode,
        country: customerData.country,
        dateOfBirth: customerData.dateOfBirth ? new Date(customerData.dateOfBirth) : null,
        marketingOptIn: customerData.marketingOptIn,
        notes: customerData.notes,
        lastSyncedAt: new Date(),
      },
    });

    console.log(`[CRM SYNC] Customer ${customerData.email} updated from CRM`);
    return updated;
  } catch (error) {
    console.error('[CRM SYNC] Failed to update customer from CRM', error);
    throw error;
  }
};

/**
 * Health check - verify CRM is reachable
 */
export const checkCRMHealth = async (businessId) => {
  try {
    const response = await crmApiRequest(
      '/api/v1/sync/health',
      'GET',
      null,
      businessId
    );
    return { healthy: true, data: response };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
    };
  }
};

/**
 * Retry failed sync operations
 * Called by cron job to process failed syncs
 */
export const retryFailedSyncs = async () => {
  try {
    // Get failed syncs pending retry
    const failedSyncs = await prisma.syncLog.findMany({
      where: {
        status: 'FAILED',
        attemptCount: { lt: MAX_RETRY_ATTEMPTS },
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { lte: new Date() } },
        ],
      },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });

    console.log(`[CRM SYNC] Found ${failedSyncs.length} failed syncs to retry`);

    for (const syncLog of failedSyncs) {
      try {
        const payload = JSON.parse(syncLog.payload);

        // Retry based on entity type
        if (syncLog.entityType === 'transaction') {
          const transaction = await prisma.transaction.findUnique({
            where: { id: syncLog.entityId },
            include: {
              items: true,
              customer: true,
            },
          });

          if (transaction) {
            await syncTransactionToCRM(transaction);
          }
        } else if (syncLog.entityType === 'customer') {
          const customer = await prisma.customer.findUnique({
            where: { id: syncLog.entityId },
          });

          if (customer) {
            await syncCustomerToCRM(customer);
          }
        }

        // Delete successful retry
        await prisma.syncLog.delete({
          where: { id: syncLog.id },
        });
      } catch (error) {
        // Update attempt count and schedule next retry
        await prisma.syncLog.update({
          where: { id: syncLog.id },
          data: {
            attemptCount: { increment: 1 },
            nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            errorMessage: error.message,
          },
        });
      }
    }

    console.log(`[CRM SYNC] Retry job completed`);
  } catch (error) {
    console.error('[CRM SYNC] Failed to process retry queue', error);
  }
};

export default {
  syncTransactionToCRM,
  syncCustomerToCRM,
  fetchCustomerFromCRM,
  updateCustomerFromCRM,
  checkCRMHealth,
  retryFailedSyncs,
};
