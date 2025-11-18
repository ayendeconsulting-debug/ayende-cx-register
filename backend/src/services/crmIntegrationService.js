import axios from 'axios';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

// Configuration
const CRM_API_URL = process.env.CRM_API_URL || 'http://ayendecx.com';
const INTEGRATION_SECRET = process.env.INTEGRATION_SECRET;
const SYNC_TIMEOUT = parseInt(process.env.CRM_API_TIMEOUT || '30000');
const ENABLE_SYNC = process.env.ENABLE_REALTIME_SYNC === 'true';
const MAX_RETRY_ATTEMPTS = parseInt(process.env.SYNC_RETRY_ATTEMPTS || '3');

// Performance tracking
const syncMetrics = {
  transactionsSynced: 0,
  customersSynced: 0,
  anonymousTransactionsSynced: 0,  // NEW: Track anonymous transactions
  failedSyncs: 0,
  totalSyncTime: 0,
};

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
const crmApiRequest = async (endpoint, method, data, businessId) => {
  if (!ENABLE_SYNC) {
    console.log('[CRM SYNC] Sync disabled, skipping request');
    return null;
  }

  const startTime = Date.now();
  let tenantId;  // Declare at function level so it's accessible in catch

  try {
    // Get business to access externalTenantId
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { externalTenantId: true }
    });

    if (!business?.externalTenantId) {
      throw new Error(`Business ${businessId} has no externalTenantId (CRM tenant UUID)`);
    }

    tenantId = business.externalTenantId;  // Remove 'const'
    const token = generateIntegrationToken(tenantId);
    const url = `${CRM_API_URL}${endpoint}`;  // ADD THIS LINE

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

    const duration = Date.now() - startTime;
    console.log(`[CRM SYNC] ${method} ${endpoint} - ${response.status} (${duration}ms)`);

    return response.data;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('[CRM SYNC ERROR]', {
      endpoint,
      method,
      tenantId,
      duration: `${duration}ms`,
      status: error.response?.status,
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
    console.error('[SYNC LOG ERROR]', logError.message);
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
      console.log(`[CRM SYNC] Retry attempt ${attempt}/${maxRetries} in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Validate entity has required business relation
 */
const validateBusinessRelation = (entity, entityType) => {
  if (!entity.business) {
    throw new Error(`${entityType} missing business relation - cannot access externalTenantId`);
  }
  
  if (!entity.business.externalTenantId) {
    throw new Error(`Business externalTenantId not configured for ${entityType} - cannot sync to CRM`);
  }
  
  return entity.business.externalTenantId;
};

/**
 * Sync transaction to CRM (Real-time)
 * Called immediately after transaction is completed in POS
 * 
 * UPDATED: Now supports anonymous transactions
 * FIXED: Line 198 - Changed customerId to tenantCustomerId
 */
export const syncTransactionToCRM = async (transaction) => {
  if (!ENABLE_SYNC) {
    console.log('[CRM SYNC] Transaction sync disabled');
    return;
  }

  const syncStartTime = Date.now();
  
  // NEW: Check if this is an anonymous transaction
  const isAnonymous = transaction.isAnonymousTransaction || transaction.customer?.isAnonymous || false;
  
  const transactionType = isAnonymous ? 'ANONYMOUS transaction' : 'transaction';
  console.log(`[CRM SYNC] Syncing ${transactionType} ${transaction.transactionNumber} to CRM`);

  try {
    // Validate and extract CRM tenant ID
    const tenantId = validateBusinessRelation(transaction, 'Transaction');
    
    console.log(`[CRM SYNC] Using tenant ID: ${tenantId} (from business.externalTenantId)`);
    
    // Prepare payload
    const payload = {
      transactionId: transaction.id,
      transactionNumber: transaction.transactionNumber,
      tenantId: tenantId,
      
      // NEW: Include anonymous flag
      isAnonymous: isAnonymous,
      
      // FIXED: Changed customerId to tenantCustomerId (CRM expects this field name)
      tenantCustomerId: isAnonymous ? null : transaction.customerId,
      customerEmail: isAnonymous ? null : transaction.customer?.email,
      
      // Financial data
      amount: parseFloat(transaction.subtotal),
      tax: parseFloat(transaction.taxAmount),
      discount: parseFloat(transaction.discountAmount),
      total: parseFloat(transaction.total),
      currency: transaction.currency || 'USD',
      currencyCode: transaction.currencyCode || 'USD',
      
      // Payment details
      paymentMethod: transaction.paymentMethod,
      amountPaid: parseFloat(transaction.amountPaid),
      changeGiven: parseFloat(transaction.changeGiven),
      
      // Loyalty (only for non-anonymous)
      pointsEarned: isAnonymous ? 0 : (transaction.loyaltyPointsEarned || 0),
      pointsRedeemed: isAnonymous ? 0 : (transaction.loyaltyPointsRedeemed || 0),
      
      // Items
      items: transaction.items?.map(item => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        subtotal: parseFloat(item.subtotal),
        discount: parseFloat(item.discount || 0),
        tax: parseFloat(item.tax || 0),
        total: parseFloat(item.total),
      })) || [],
      
      // Metadata
      status: transaction.status,
      notes: transaction.notes,
      createdBy: transaction.userId,
      timestamp: transaction.createdAt.toISOString(),
    };

    // DEBUG: Log the payload being sent to CRM
    console.log('[CRM SYNC DEBUG] Transaction payload:', JSON.stringify({
      transactionId: payload.transactionId,
      transactionNumber: payload.transactionNumber,
      tenantCustomerId: payload.tenantCustomerId,
      isAnonymous: payload.isAnonymous,
      customerId: transaction.customerId,
      hasCustomer: !!transaction.customer,
      customerEmail: transaction.customer?.email,
      total: payload.total
    }, null, 2));

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

    // Update metrics
    if (isAnonymous) {
      syncMetrics.anonymousTransactionsSynced++;
    } else {
      syncMetrics.transactionsSynced++;
    }
    
    const syncDuration = Date.now() - syncStartTime;
    syncMetrics.totalSyncTime += syncDuration;

    console.log(`[CRM SYNC] Transaction ${transaction.transactionNumber} synced successfully (${syncDuration}ms)`);
  } catch (error) {
    const syncDuration = Date.now() - syncStartTime;
    syncMetrics.failedSyncs++;
    
    console.error(`[CRM SYNC] Failed to sync transaction ${transaction.transactionNumber} (${syncDuration}ms)`, {
      error: error.message,
      transactionId: transaction.id,
      tenantId: transaction.business?.externalTenantId || 'missing',
      isAnonymous: isAnonymous,
    });

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

    // Don't throw error - transaction creation should still complete
  }
};

/**
 * Sync customer to CRM (Real-time)
 * Called immediately after customer is created or updated in POS
 */
export const syncCustomerToCRM = async (customer, operation = 'create') => {
  if (!ENABLE_SYNC) {
    console.log('[CRM SYNC] Customer sync disabled');
    return;
  }

  const syncStartTime = Date.now();
  console.log(`[CRM SYNC] Syncing customer ${customer.email} to CRM (${operation})`);

  try {
    // Validate and extract CRM tenant ID
    const tenantId = validateBusinessRelation(customer, 'Customer');
    
    console.log(`[CRM SYNC] Using tenant ID: ${tenantId} (from business.externalTenantId)`);
    
    // Prepare payload
    const payload = {
      customerId: customer.id,
      tenantId: tenantId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      postalCode: customer.zipCode || '',
      zipCode: customer.zipCode || '',
      country: customer.country || '',
      dateOfBirth: customer.dateOfBirth?.toISOString() || null,
      loyaltyPoints: customer.loyaltyPoints || 0,
      loyaltyTier: customer.loyaltyTier || 'BRONZE',
      totalSpent: parseFloat(customer.totalSpent || 0),
      visitCount: customer.visitCount || 0,
      lastVisit: customer.lastVisit?.toISOString() || null,
      marketingOptIn: customer.marketingOptIn || false,
      notes: customer.notes || '',
      isActive: customer.isActive !== false,
      tags: customer.tags || [],
      preferences: customer.preferences || {},
      createdAt: customer.createdAt?.toISOString(),
      updatedAt: customer.updatedAt?.toISOString(),
    };

    // Send to CRM with retry
    const response = await retryOperation(async () => {
      return await crmApiRequest(
        '/api/v1/sync/customer',
        'POST',
        payload,
        customer.businessId
      );
    });

    // Update customer to mark as synced AND save CRM customer ID
    const updateData = { lastSyncedAt: new Date() };

    // Save the CRM customer ID if returned
    if (response?.customer?.id) {
      updateData.externalId = response.customer.id.toString();
      console.log(`[CRM SYNC] Saved CRM customer ID: ${updateData.externalId}`);
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: updateData,
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

    // Update metrics
    syncMetrics.customersSynced++;
    const syncDuration = Date.now() - syncStartTime;
    syncMetrics.totalSyncTime += syncDuration;

    console.log(`[CRM SYNC] Customer ${customer.email} synced successfully (${syncDuration}ms)`);
  } catch (error) {
    const syncDuration = Date.now() - syncStartTime;
    syncMetrics.failedSyncs++;
    
    console.error(`[CRM SYNC] Failed to sync customer ${customer.email} (${syncDuration}ms)`, {
      error: error.message,
      customerId: customer.id,
      tenantId: customer.business?.externalTenantId || 'missing',
    });

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
    console.error(`[CRM SYNC] Failed to fetch customer ${identifier}:`, error.message);
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

    // Find customer by email or external ID - include business relation
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { id: customerId },
          { email: customerData.email, businessId: tenantId },
        ],
      },
      include: {
        business: true,
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
    console.error('[CRM SYNC] Failed to update customer from CRM:', error.message);
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
 * Get sync metrics
 */
export const getSyncMetrics = () => {
  return {
    ...syncMetrics,
    averageSyncTime: syncMetrics.transactionsSynced + syncMetrics.customersSynced + syncMetrics.anonymousTransactionsSynced > 0
      ? (syncMetrics.totalSyncTime / (syncMetrics.transactionsSynced + syncMetrics.customersSynced + syncMetrics.anonymousTransactionsSynced)).toFixed(2)
      : 0,
  };
};

/**
 * Reset sync metrics
 */
export const resetSyncMetrics = () => {
  syncMetrics.transactionsSynced = 0;
  syncMetrics.customersSynced = 0;
  syncMetrics.anonymousTransactionsSynced = 0;
  syncMetrics.failedSyncs = 0;
  syncMetrics.totalSyncTime = 0;
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
              business: true,
            },
          });

          if (transaction) {
            await syncTransactionToCRM(transaction);
          }
        } else if (syncLog.entityType === 'customer') {
          const customer = await prisma.customer.findUnique({
            where: { id: syncLog.entityId },
            include: {
              business: true,
            },
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
    console.error('[CRM SYNC] Failed to process retry queue:', error.message);
  }
};

export default {
  syncTransactionToCRM,
  syncCustomerToCRM,
  fetchCustomerFromCRM,
  updateCustomerFromCRM,
  checkCRMHealth,
  retryFailedSyncs,
  getSyncMetrics,
  resetSyncMetrics,
};
