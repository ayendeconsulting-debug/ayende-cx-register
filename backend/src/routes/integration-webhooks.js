/**
 * Integration Webhook Routes (Compatible with existing CRM)
 * Receives webhook notifications from CRM when customer data changes
 * 
 * This matches the existing CRM webhook_service.py endpoints
 * 
 * Endpoints:
 * - POST /api/integration/webhook/customer-created
 * - POST /api/integration/webhook/customer-updated  
 * - POST /api/integration/webhook/customer-deleted
 */

import express from 'express';
import crypto from 'crypto';
import prisma from '../config/database.js';

const router = express.Router();

const INTEGRATION_SECRET = process.env.INTEGRATION_SECRET;

/**
 * Middleware to verify webhook signature
 * Matches CRM's HMAC signature verification
 */
const verifyWebhookSignature = (req, res, next) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const tenantId = req.headers['x-tenant-id'];
    
    if (!signature) {
      return res.status(401).json({
        success: false,
        error: 'Missing X-Webhook-Signature header'
      });
    }

    if (!INTEGRATION_SECRET) {
      console.error('[WEBHOOK] INTEGRATION_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    // Get raw body as string for signature verification
    const payload = JSON.stringify(req.body);
    
    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', INTEGRATION_SECRET)
      .update(payload)
      .digest('hex');

    // Compare signatures
    if (signature !== expectedSignature) {
      console.error('[WEBHOOK] Invalid signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    // Attach tenant ID to request
    req.tenantId = tenantId;
    next();

  } catch (error) {
    console.error('[WEBHOOK] Signature verification failed:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Signature verification failed'
    });
  }
};

/**
 * POST /api/integration/webhook/customer-created
 * Receive customer creation notification from CRM
 */
router.post('/customer-created', verifyWebhookSignature, async (req, res) => {
  try {
    console.log('[WEBHOOK] Received customer-created from CRM');
    
    const { customer, tenant_id, pos_business_id, timestamp } = req.body;

    if (!customer || !customer.id) {
      return res.status(400).json({
        success: false,
        error: 'Missing customer data'
      });
    }

    // Store CRM customer ID for future reference
    // Note: We create customers in POS first, so this is mainly for logging
    console.log(`[WEBHOOK] Customer created in CRM: ${customer.id}`);
    console.log(`[WEBHOOK] Associated with tenant: ${tenant_id}`);
    
    // If we have the customer in POS, update their externalId to link to CRM
    if (customer.email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          email: customer.email,
          businessId: pos_business_id
        }
      });

      if (existingCustomer) {
        await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            externalId: customer.id,  // Store CRM customer ID
            syncState: 'SYNCED',
            lastSyncedAt: new Date()
          }
        });
        
        console.log(`[WEBHOOK] Linked POS customer ${existingCustomer.id} to CRM customer ${customer.id}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Customer creation acknowledged'
    });

  } catch (error) {
    console.error('[WEBHOOK] Error processing customer-created:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/integration/webhook/customer-updated
 * Receive customer update notification from CRM
 * 
 * This is the main endpoint for syncing CRM updates back to POS
 */
router.post('/customer-updated', verifyWebhookSignature, async (req, res) => {
  try {
    console.log('[WEBHOOK] Received customer-updated from CRM');
    
    const { customer, tenant_id, pos_business_id, timestamp } = req.body;

    if (!customer || !customer.id) {
      return res.status(400).json({
        success: false,
        error: 'Missing customer data'
      });
    }

    // Find customer in POS by email or by CRM ID stored in externalId
    let posCustomer = null;
    
    // Try to find by externalId (CRM customer ID)
    if (customer.id) {
      posCustomer = await prisma.customer.findFirst({
        where: {
          externalId: customer.id,
          businessId: pos_business_id
        }
      });
    }
    
    // If not found, try by email
    if (!posCustomer && customer.email) {
      posCustomer = await prisma.customer.findFirst({
        where: {
          email: customer.email,
          businessId: pos_business_id
        }
      });
    }

    if (!posCustomer) {
      console.log(`[WEBHOOK] Customer not found in POS: ${customer.id} / ${customer.email}`);
      return res.status(404).json({
        success: false,
        error: 'Customer not found in POS'
      });
    }

    // Update customer with CRM data
    // CRM is master for loyalty data, POS is master for basic profile
    const updatedCustomer = await prisma.customer.update({
      where: { id: posCustomer.id },
      data: {
        // Keep POS as master for basic profile (don't override)
        // But allow email updates from CRM
        email: customer.email || posCustomer.email,
        
        // Update loyalty data from CRM (CRM is master for this)
        loyaltyPoints: customer.loyalty_points ?? posCustomer.loyaltyPoints,
        loyaltyTier: customer.loyalty_tier || posCustomer.loyaltyTier,
        totalSpent: customer.total_spent ?? posCustomer.totalSpent,
        visitCount: customer.visit_count ?? posCustomer.visitCount,
        
        // Update marketing preferences
        marketingOptIn: customer.marketing_opt_in ?? posCustomer.marketingOptIn,
        
        // Store CRM customer ID for reference
        externalId: customer.id,
        
        // Mark as synced
        syncState: 'SYNCED',
        lastSyncedAt: new Date()
      }
    });

    console.log(`[WEBHOOK] Customer updated successfully: ${posCustomer.id}`);
    console.log(`[WEBHOOK] Loyalty: ${updatedCustomer.loyaltyPoints} pts (${updatedCustomer.loyaltyTier})`);
    console.log(`[WEBHOOK] Total Spent: $${updatedCustomer.totalSpent}`);

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      customer: {
        id: updatedCustomer.id,
        externalId: updatedCustomer.externalId,
        email: updatedCustomer.email,
        loyaltyPoints: updatedCustomer.loyaltyPoints,
        loyaltyTier: updatedCustomer.loyaltyTier,
        totalSpent: parseFloat(updatedCustomer.totalSpent || 0),
        visitCount: updatedCustomer.visitCount
      }
    });

  } catch (error) {
    console.error('[WEBHOOK] Error processing customer-updated:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/integration/webhook/customer-deleted
 * Receive customer deletion notification from CRM
 */
router.post('/customer-deleted', verifyWebhookSignature, async (req, res) => {
  try {
    console.log('[WEBHOOK] Received customer-deleted from CRM');
    
    const { customer_id, tenant_id, pos_business_id, timestamp } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing customer_id'
      });
    }

    // Find customer by CRM ID
    const posCustomer = await prisma.customer.findFirst({
      where: {
        externalId: customer_id,
        businessId: pos_business_id
      }
    });

    if (!posCustomer) {
      console.log(`[WEBHOOK] Customer not found for deletion: ${customer_id}`);
      // Return success anyway - customer already doesn't exist
      return res.status(200).json({
        success: true,
        message: 'Customer not found (already deleted or never existed)'
      });
    }

    // Mark customer as inactive instead of deleting
    // (preserves transaction history)
    await prisma.customer.update({
      where: { id: posCustomer.id },
      data: {
        isActive: false,
        externalId: null,  // Unlink from CRM
        syncState: 'SYNCED',
        lastSyncedAt: new Date()
      }
    });

    console.log(`[WEBHOOK] Customer marked as inactive: ${posCustomer.id}`);

    return res.status(200).json({
      success: true,
      message: 'Customer marked as inactive'
    });

  } catch (error) {
    console.error('[WEBHOOK] Error processing customer-deleted:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/integration/webhook/health
 * Health check endpoint for webhook system
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Integration webhook endpoints are healthy',
    endpoints: {
      created: '/api/integration/webhook/customer-created',
      updated: '/api/integration/webhook/customer-updated',
      deleted: '/api/integration/webhook/customer-deleted'
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
