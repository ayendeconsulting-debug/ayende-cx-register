// src/controllers/integration/customerSyncController.js
/**
 * Customer Sync Webhook Controller
 * Handles incoming webhooks from CRM system
 * SIMPLIFIED VERSION - Uses req.body for signature verification
 */

import crypto from 'crypto';
import { syncCustomerFromCRM } from '../../services/integration/customerSyncService.js';

/**
 * Verify webhook signature
 * @param {Object} body - Parsed request body
 * @param {string} signature - Signature from X-Webhook-Signature header
 * @param {string} secret - Shared secret key
 * @returns {boolean} - True if signature is valid
 */
function verifyWebhookSignature(body, signature, secret) {
  if (!signature || !secret) {
    return false;
  }
  
  // Recreate the JSON string from the parsed body
  // Use same formatting as CRM (no spaces)
  const payload = JSON.stringify(body, null, 0);
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // CRITICAL: Check length first to avoid timingSafeEqual error
  if (signature.length !== expectedSignature.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Middleware to validate webhook requests
 */
async function validateWebhook(req, res, next) {
  try {
    // Get signature from header
    const signature = req.headers['x-webhook-signature'];
    const tenantId = req.headers['x-tenant-id'];
    
    if (!signature) {
      console.error('[WEBHOOK] Missing signature');
      return res.status(401).json({
        success: false,
        error: 'Missing webhook signature'
      });
    }
    
    if (!tenantId) {
      console.error('[WEBHOOK] Missing tenant ID');
      return res.status(400).json({
        success: false,
        error: 'Missing tenant ID'
      });
    }
    
    // Get secret from environment
    const secret = process.env.INTEGRATION_SECRET;
    if (!secret) {
      console.error('[WEBHOOK] INTEGRATION_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'Webhook authentication not configured'
      });
    }
    
    // Verify signature using parsed body
    const isValid = verifyWebhookSignature(req.body, signature, secret);
    
    if (!isValid) {
      console.error('[WEBHOOK] Invalid signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }
    
    console.log(`[WEBHOOK] Signature verified for tenant: ${tenantId}`);
    next();
    
  } catch (error) {
    console.error('[WEBHOOK] Validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Webhook validation failed'
    });
  }
}

/**
 * Handle customer created webhook
 */
export async function handleCustomerCreated(req, res) {
  // Validate webhook first
  await validateWebhook(req, res, async () => {
    try {
      const { customer, tenant_id, pos_business_id } = req.body;
      
      console.log('[WEBHOOK] Customer created:', {
        customerId: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        tenantId: tenant_id,
        businessId: pos_business_id
      });
      
      // Validate required fields
      if (!customer || !customer.id) {
        return res.status(400).json({
          success: false,
          error: 'Missing customer data'
        });
      }
      
      if (!pos_business_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing POS business ID'
        });
      }
      
      // Sync customer to POS
      const result = await syncCustomerFromCRM(
        customer,
        pos_business_id,
        'created'
      );
      
      if (result.success) {
        console.log(`[WEBHOOK] Customer created successfully: ${result.customerId}`);
        return res.status(201).json({
          success: true,
          message: 'Customer created successfully',
          customerId: result.customerId
        });
      } else {
        console.error('[WEBHOOK] Failed to create customer:', result.error);
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      console.error('[WEBHOOK] Error handling customer created:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process webhook'
      });
    }
  });
}

/**
 * Handle customer updated webhook
 */
export async function handleCustomerUpdated(req, res) {
  // Validate webhook first
  await validateWebhook(req, res, async () => {
    try {
      const { customer, tenant_id, pos_business_id } = req.body;
      
      console.log('[WEBHOOK] Customer updated:', {
        customerId: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        tenantId: tenant_id,
        businessId: pos_business_id
      });
      
      // Validate required fields
      if (!customer || !customer.id) {
        return res.status(400).json({
          success: false,
          error: 'Missing customer data'
        });
      }
      
      if (!pos_business_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing POS business ID'
        });
      }
      
      // Sync customer to POS
      const result = await syncCustomerFromCRM(
        customer,
        pos_business_id,
        'updated'
      );
      
      if (result.success) {
        console.log(`[WEBHOOK] Customer updated successfully: ${result.customerId}`);
        return res.status(200).json({
          success: true,
          message: 'Customer updated successfully',
          customerId: result.customerId
        });
      } else {
        console.error('[WEBHOOK] Failed to update customer:', result.error);
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      console.error('[WEBHOOK] Error handling customer updated:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process webhook'
      });
    }
  });
}

/**
 * Handle customer deleted webhook
 */
export async function handleCustomerDeleted(req, res) {
  // Validate webhook first
  await validateWebhook(req, res, async () => {
    try {
      const { customer_id, tenant_id, pos_business_id } = req.body;
      
      console.log('[WEBHOOK] Customer deleted:', {
        customerId: customer_id,
        tenantId: tenant_id,
        businessId: pos_business_id
      });
      
      // Validate required fields
      if (!customer_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing customer ID'
        });
      }
      
      if (!pos_business_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing POS business ID'
        });
      }
      
      // Sync customer deletion to POS
      const result = await syncCustomerFromCRM(
        { id: customer_id },
        pos_business_id,
        'deleted'
      );
      
      if (result.success) {
        console.log(`[WEBHOOK] Customer deleted successfully: ${customer_id}`);
        return res.status(200).json({
          success: true,
          message: 'Customer deleted successfully'
        });
      } else {
        console.error('[WEBHOOK] Failed to delete customer:', result.error);
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
      
    } catch (error) {
      console.error('[WEBHOOK] Error handling customer deleted:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process webhook'
      });
    }
  });
}