/**
 * Integration Routes
 * Handle incoming requests from CRM system
 */

import express from 'express';
import { verifyIntegrationToken, validateTenantAccess } from '../middleware/integrationAuth.js';
import prisma from '../config/database.js';
import { checkCRMHealth, updateCustomerFromCRM } from '../services/crmIntegrationService.js';
import { successResponse, errorResponse } from '../utils/response.js';

const router = express.Router();

// Apply integration authentication to all routes
router.use(verifyIntegrationToken);
router.use(validateTenantAccess);

/**
 * Health check endpoint
 * GET /api/v1/integration/health
 */
router.get('/health', async (req, res) => {
  try {
    const crmHealth = await checkCRMHealth(req.tenantId);

    res.json(successResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      crm_reachable: crmHealth.healthy,
      tenant_id: req.tenantId,
    }));
  } catch (error) {
    res.status(500).json(errorResponse('Health check failed', error.message));
  }
});

/**
 * Receive customer profile update from CRM
 * POST /api/v1/integration/customer-update
 * 
 * Body: {
 *   customerId: "uuid",
 *   email: "customer@email.com",
 *   firstName: "John",
 *   lastName: "Doe",
 *   phone: "+1234567890",
 *   address: "123 Main St",
 *   city: "Toronto",
 *   postalCode: "M1M 1M1",
 *   country: "Canada",
 *   dateOfBirth: "1990-01-01",
 *   marketingOptIn: true,
 *   notes: "VIP customer",
 *   updatedAt: "2025-10-25T10:30:00Z"
 * }
 */
router.post('/customer-update', async (req, res) => {
  try {
    const { customerId, tenantId, ...customerData } = req.body;

    // Validate tenant ID matches
    if (tenantId !== req.tenantId) {
      return res.status(403).json(errorResponse('Tenant ID mismatch'));
    }

    // Validate required fields
    if (!customerId && !customerData.email) {
      return res.status(400).json(errorResponse('Customer ID or email required'));
    }

    // Update customer in POS
    const crmData = { customerId, tenantId, ...customerData };
    const updated = await updateCustomerFromCRM(crmData);

    if (!updated) {
      return res.status(404).json(errorResponse('Customer not found in POS'));
    }

    res.json(successResponse({
      message: 'Customer updated successfully',
      customerId: updated.id,
      email: updated.email,
    }));
  } catch (error) {
    console.error('[INTEGRATION] Customer update error:', error);
    res.status(500).json(errorResponse('Failed to update customer', error.message));
  }
});

/**
 * Receive marketing preferences update from CRM
 * POST /api/v1/integration/marketing-prefs
 * 
 * Body: {
 *   customerId: "uuid",
 *   marketingOptIn: true,
 *   emailNotifications: true,
 *   smsNotifications: false
 * }
 */
router.post('/marketing-prefs', async (req, res) => {
  try {
    const { customerId, tenantId, marketingOptIn, emailNotifications, smsNotifications } = req.body;

    // Validate tenant ID
    if (tenantId !== req.tenantId) {
      return res.status(403).json(errorResponse('Tenant ID mismatch'));
    }

    // Find customer
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId: req.tenantId,
      },
    });

    if (!customer) {
      return res.status(404).json(errorResponse('Customer not found'));
    }

    // Update preferences
    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        marketingOptIn: marketingOptIn !== undefined ? marketingOptIn : customer.marketingOptIn,
        lastSyncedAt: new Date(),
      },
    });

    res.json(successResponse({
      message: 'Marketing preferences updated',
      customerId: updated.id,
      marketingOptIn: updated.marketingOptIn,
    }));
  } catch (error) {
    console.error('[INTEGRATION] Marketing prefs update error:', error);
    res.status(500).json(errorResponse('Failed to update preferences', error.message));
  }
});

/**
 * Get customer with loyalty data
 * GET /api/v1/integration/customer/:id
 * 
 * Returns customer with transaction history and loyalty details
 */
router.get('/customer/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        businessId: req.tenantId,
      },
      include: {
        transactions: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            transactionNumber: true,
            total: true,
            createdAt: true,
            loyaltyPointsEarned: true,
            loyaltyPointsRedeemed: true,
          },
        },
        loyaltyHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!customer) {
      return res.status(404).json(errorResponse('Customer not found'));
    }

    res.json(successResponse(customer));
  } catch (error) {
    console.error('[INTEGRATION] Get customer error:', error);
    res.status(500).json(errorResponse('Failed to fetch customer', error.message));
  }
});

/**
 * Get transactions by date range
 * GET /api/v1/integration/transactions?startDate=2025-01-01&endDate=2025-12-31
 * 
 * Query params:
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - customerId: (optional) filter by customer
 * - page: pagination page (default: 1)
 * - limit: items per page (default: 50)
 */
router.get('/transactions', async (req, res) => {
  try {
    const { startDate, endDate, customerId, page = 1, limit = 50 } = req.query;

    const where = {
      businessId: req.tenantId,
      status: 'COMPLETED',
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json(successResponse({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    }));
  } catch (error) {
    console.error('[INTEGRATION] Get transactions error:', error);
    res.status(500).json(errorResponse('Failed to fetch transactions', error.message));
  }
});

/**
 * Get product catalog
 * GET /api/v1/integration/products
 * 
 * Returns active products for the tenant
 */
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 100, categoryId } = req.query;

    const where = {
      businessId: req.tenantId,
      isActive: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json(successResponse({
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    }));
  } catch (error) {
    console.error('[INTEGRATION] Get products error:', error);
    res.status(500).json(errorResponse('Failed to fetch products', error.message));
  }
});

/**
 * Sync status check
 * GET /api/v1/integration/sync-status
 * 
 * Returns sync statistics
 */
router.get('/sync-status', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      businessId: req.tenantId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [successCount, failedCount, pendingCount, lastSync] = await Promise.all([
      prisma.syncLog.count({
        where: { ...where, status: 'SUCCESS' },
      }),
      prisma.syncLog.count({
        where: { ...where, status: 'FAILED' },
      }),
      prisma.syncLog.count({
        where: { ...where, status: 'PENDING' },
      }),
      prisma.syncLog.findFirst({
        where: { ...where, status: 'SUCCESS' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalSyncs = successCount + failedCount + pendingCount;
    const successRate = totalSyncs > 0 ? ((successCount / totalSyncs) * 100).toFixed(2) : 0;

    res.json(successResponse({
      totalSyncs,
      successCount,
      failedCount,
      pendingCount,
      successRate: parseFloat(successRate),
      lastSuccessfulSync: lastSync?.createdAt || null,
      tenantId: req.tenantId,
    }));
  } catch (error) {
    console.error('[INTEGRATION] Sync status error:', error);
    res.status(500).json(errorResponse('Failed to fetch sync status', error.message));
  }
});

export default router;
