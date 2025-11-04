/**
 * CRM Sync Service
 * Handles sending data from POS to CRM via webhooks
 * 
 * Endpoints:
 * - POST /api/v1/sync/transaction - Send transaction to CRM
 * - POST /api/v1/sync/customer - Send customer to CRM
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

// Get CRM configuration from environment
const CRM_BASE_URL = process.env.CRM_BASE_URL || 'https://consulting.ayendecx.com';
const INTEGRATION_SECRET = process.env.INTEGRATION_SECRET;
const JWT_EXPIRATION = '5m'; // Short-lived tokens for webhooks

/**
 * Generate JWT token for CRM authentication
 * @param {string} tenantId - CRM tenant UUID
 * @returns {string} JWT token
 */
const generateJWT = (tenantId) => {
  if (!INTEGRATION_SECRET) {
    throw new Error('INTEGRATION_SECRET not configured');
  }

  const payload = {
  iss: 'ayende-pos',
  sub: 'system-to-system',
  tenantId,
  scope: 'integration',
  source: 'pos',
  timestamp: Date.now(),
};

  return jwt.sign(payload, INTEGRATION_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });
};

/**
 * Get CRM tenant UUID for a business
 * @param {string} businessId - POS business ID
 * @returns {string|null} CRM tenant UUID
 */
const getCRMTenantId = async (businessId) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { externalTenantId: true },
    });

    return business?.externalTenantId || null;
  } catch (error) {
    console.error('[CRM SYNC] Error getting tenant ID:', error);
    return null;
  }
};

/**
 * Send transaction to CRM
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<boolean>} Success status
 */
export const syncTransactionToCRM = async (transactionId) => {
  try {
    console.log(`[CRM SYNC] Starting transaction sync: ${transactionId}`);

    // Fetch transaction with all related data
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        business: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isAnonymous: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    // Skip if anonymous customer
    if (transaction.customer?.isAnonymous) {
      console.log(`[CRM SYNC] Skipping anonymous transaction: ${transactionId}`);
      return true; // Return success to remove from queue
    }

    // Get CRM tenant ID
    const tenantId = await getCRMTenantId(transaction.businessId);
    if (!tenantId) {
      throw new Error(`No CRM tenant mapping for business: ${transaction.businessId}`);
    }

    // Generate JWT token
    const token = generateJWT(tenantId);

    // Prepare payload
    const payload = {
      transactionId: transaction.id,
      transactionNumber: transaction.transactionNumber,
      tenantId,
      customerId: transaction.customerId,
      customerEmail: transaction.customer?.email || '',
      amount: parseFloat(transaction.subtotal || 0),
      tax: parseFloat(transaction.taxAmount || 0),
      discount: parseFloat(transaction.discountAmount || 0),
      total: parseFloat(transaction.total || 0),
      currency: 'USD', // TODO: Make configurable
      paymentMethod: transaction.paymentMethod,
      pointsEarned: transaction.loyaltyPointsEarned || 0,
      pointsRedeemed: transaction.loyaltyPointsRedeemed || 0,
      items: transaction.items.map(item => ({
        productId: item.productId,
        productName: item.product?.name || item.productName,
        sku: item.product?.sku || item.sku,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice || 0),
        subtotal: parseFloat(item.subtotal || 0),
        discount: parseFloat(item.discount || 0),
        tax: parseFloat(item.tax || 0),
        total: parseFloat(item.total || 0),
      })),
      status: transaction.status,
      notes: transaction.notes || '',
      timestamp: transaction.createdAt.toISOString(),
    };

    // Send to CRM
    const url = `${CRM_BASE_URL}/api/v1/sync/transaction`;
    
    console.log(`[CRM SYNC] Sending transaction to CRM: ${url}`);
    
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId,  // ADD THIS LINE
      },
      timeout: 30000, // 30 second timeout
    });

    if (response.status === 200 || response.status === 201) {
      console.log(`[CRM SYNC] Transaction synced successfully: ${transactionId}`);
      
      // Update transaction sync status
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          lastSyncedAt: new Date(),
          syncStatus: 'SUCCESS',
        },
      });

      return true;
    } else {
      throw new Error(`CRM returned status ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`[CRM SYNC] Error syncing transaction ${transactionId}:`, error.message);
    
    // Update transaction sync status
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        syncStatus: 'FAILED',
        syncError: error.message,
      },
    }).catch(err => console.error('[CRM SYNC] Failed to update sync status:', err));

    throw error;
  }
};

/**
 * Send customer to CRM
 * @param {string} customerId - Customer ID
 * @returns {Promise<boolean>} Success status
 */
export const syncCustomerToCRM = async (customerId) => {
  try {
    console.log(`[CRM SYNC] Starting customer sync: ${customerId}`);

    // Fetch customer with business info
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        business: true,
      },
    });

    if (!customer) {
      throw new Error(`Customer not found: ${customerId}`);
    }

    // Skip if anonymous customer
    if (customer.isAnonymous) {
      console.log(`[CRM SYNC] Skipping anonymous customer: ${customerId}`);
      return true; // Return success to remove from queue
    }

    // Get CRM tenant ID
    const tenantId = await getCRMTenantId(customer.businessId);
    if (!tenantId) {
      throw new Error(`No CRM tenant mapping for business: ${customer.businessId}`);
    }

    // Generate JWT token
    const token = generateJWT(tenantId);

    // Prepare payload
    const payload = {
      customerId: customer.id,
      tenantId,
      email: customer.email || '',
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      postalCode: customer.zipCode || '',
      zipCode: customer.zipCode || '',
      dateOfBirth: customer.dateOfBirth?.toISOString() || null,
      loyaltyPoints: customer.loyaltyPoints || 0,
      loyaltyTier: customer.loyaltyTier || 'BRONZE',
      totalSpent: parseFloat(customer.totalSpent || 0),
      visitCount: customer.visitCount || 0,
      lastVisit: customer.lastVisit?.toISOString() || null,
      marketingOptIn: customer.marketingOptIn || false,
      notes: customer.notes || '',
      isActive: customer.isActive,
      updatedAt: customer.updatedAt.toISOString(),
    };

    // Send to CRM
    const url = `${CRM_BASE_URL}/api/v1/sync/customer`;
    
    console.log(`[CRM SYNC] Sending customer to CRM: ${url}`);
    
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      timeout: 30000, // 30 second timeout
    });

    if (response.status === 200 || response.status === 201) {
      console.log(`[CRM SYNC] Customer synced successfully: ${customerId}`);
      
      // Update customer sync status
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          lastSyncedAt: new Date(),
          syncState: 'SYNCED',
        },
      });

      // If CRM returned customer data, store external_id
      if (response.data?.customer?.id) {
        await prisma.customer.update({
          where: { id: customerId },
          data: {
            externalId: response.data.customer.id,
          },
        });
      }

      return true;
    } else {
      throw new Error(`CRM returned status ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`[CRM SYNC] Error syncing customer ${customerId}:`, error.message);
    
    // Update customer sync status
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        syncState: 'FAILED',
      },
    }).catch(err => console.error('[CRM SYNC] Failed to update sync status:', err));

    throw error;
  }
};

/**
 * Test CRM connection
 * @returns {Promise<Object>} Connection test result
 */
export const testCRMConnection = async () => {
  try {
    const url = `${CRM_BASE_URL}/api/v1/sync/health`;
    
    console.log(`[CRM SYNC] Testing connection to: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
    });

    return {
      success: true,
      status: response.status,
      data: response.data,
      url: CRM_BASE_URL,
    };
  } catch (error) {
    console.error('[CRM SYNC] Connection test failed:', error.message);
    return {
      success: false,
      error: error.message,
      url: CRM_BASE_URL,
    };
  }
};

export default {
  syncTransactionToCRM,
  syncCustomerToCRM,
  testCRMConnection,
};
