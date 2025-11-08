/**
 * Webhook Routes
 * Receives webhook notifications from CRM when customer data changes
 * 
 * This implements the CRM → POS direction of bidirectional sync
 * 
 * Endpoints:
 * - POST /api/v1/webhooks/customer - Receive customer updates/creates from CRM
 * - GET /api/v1/webhooks/health - Health check endpoint
 * 
 * UPDATED: Added support for customer creation (operation='created')
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createFromWebhook } from '../services/customerService.js';

const prisma = new PrismaClient();
const router = express.Router();
const INTEGRATION_SECRET = process.env.INTEGRATION_SECRET;

/**
 * Middleware to verify webhook JWT token
 */
const verifyWebhookToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid Authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const payload = jwt.verify(token, INTEGRATION_SECRET, {
      algorithms: ['HS256']
    });

    // Verify required fields
    if (payload.iss !== 'ayende-crm') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token issuer'
      });
    }

    if (payload.scope !== 'webhook') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token scope'
      });
    }

    // Attach payload to request
    req.webhookPayload = payload;
    next();

  } catch (error) {
    console.error('[WEBHOOK] Token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

/**
 * POST /api/v1/webhooks/customer
 * Receive customer create/update from CRM
 * 
 * Expected payload:
 * {
 *   "operation": "created" | "updated" | "deleted",
 *   "customerId": "crm-customer-uuid",
 *   "externalId": "pos-customer-uuid",  // POS customer ID (for updates)
 *   "email": "customer@example.com",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "phone": "1234567890",
 *   "loyaltyPoints": 150,
 *   "loyaltyTier": "SILVER",
 *   "totalSpent": 250.00,
 *   "visitCount": 5,
 *   "marketingOptIn": true,
 *   "tenantId": "tenant-uuid"
 * }
 */
router.post('/customer', verifyWebhookToken, async (req, res) => {
  try {
    const {
      operation,       // NEW: 'created', 'updated', or 'deleted'
      customerId,      // CRM customer ID
      externalId,      // POS customer ID (for updates)
      email,
      firstName,
      lastName,
      phone,
      loyaltyPoints,
      loyaltyTier,
      totalSpent,
      visitCount,
      marketingOptIn,
      address,
      city,
      state,
      postalCode,
      dateOfBirth,
      tenantId
    } = req.body;

    console.log(`[WEBHOOK] Received customer ${operation || 'update'} from CRM`);
    console.log(`[WEBHOOK] Customer: ${firstName} ${lastName} (${email})`);

    // Validate operation type
    const validOperations = ['created', 'updated', 'deleted'];
    const currentOperation = operation || 'updated'; // Default to 'updated' for backward compatibility
    
    if (!validOperations.includes(currentOperation)) {
      return res.status(400).json({
        success: false,
        error: `Invalid operation: ${currentOperation}. Must be one of: ${validOperations.join(', ')}`
      });
    }

    // Handle different operations
    switch (currentOperation) {
      case 'created':
        return await handleCustomerCreation(req, res);
      
      case 'updated':
        return await handleCustomerUpdate(req, res);
      
      case 'deleted':
        return await handleCustomerDeletion(req, res);
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Unknown operation'
        });
    }

  } catch (error) {
    console.error('[WEBHOOK] Error processing customer webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * Handle customer creation from CRM
 */
async function handleCustomerCreation(req, res) {
  const {
    customerId,      // CRM customer ID
    email,
    firstName,
    lastName,
    phone,
    loyaltyPoints,
    loyaltyTier,
    totalSpent,
    visitCount,
    marketingOptIn,
    address,
    city,
    state,
    postalCode,
    dateOfBirth,
    tenantId
  } = req.body;

  // Validate required fields for creation
  if (!customerId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: customerId'
    });
  }

  if (!firstName || !lastName) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: firstName and lastName'
    });
  }

  if (!tenantId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: tenantId'
    });
  }

  try {
    // Find the business (tenant) by external tenant ID
    const business = await prisma.business.findFirst({
      where: { externalTenantId: tenantId }
    });

    if (!business) {
      console.log(`[WEBHOOK] Business not found for tenant: ${tenantId}`);
      return res.status(404).json({
        success: false,
        error: 'Business not found for this tenant'
      });
    }

    console.log(`[WEBHOOK] Creating new customer in POS for business: ${business.name}`);

    // Check if customer already exists (by email or phone)
    let existingCustomer = null;
    
    if (email) {
      existingCustomer = await prisma.customer.findFirst({
        where: {
          businessId: business.id,
          email: email,
          isAnonymous: false
        }
      });
    }

    if (!existingCustomer && phone) {
      existingCustomer = await prisma.customer.findFirst({
        where: {
          businessId: business.id,
          phone: phone,
          isAnonymous: false
        }
      });
    }

    if (existingCustomer) {
      console.log(`[WEBHOOK] Customer already exists in POS: ${existingCustomer.id}`);
      
      // Update existing customer instead of creating
      const updatedCustomer = await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          email: email || existingCustomer.email,
          firstName: firstName || existingCustomer.firstName,
          lastName: lastName || existingCustomer.lastName,
          phone: phone || existingCustomer.phone,
          address: address || existingCustomer.address,
          city: city || existingCustomer.city,
          state: state || existingCustomer.state,
          zipCode: postalCode || existingCustomer.zipCode,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existingCustomer.dateOfBirth,
          marketingOptIn: marketingOptIn ?? existingCustomer.marketingOptIn,
          loyaltyPoints: loyaltyPoints ?? existingCustomer.loyaltyPoints,
          loyaltyTier: loyaltyTier || existingCustomer.loyaltyTier,
          totalSpent: totalSpent ?? existingCustomer.totalSpent,
          visitCount: visitCount ?? existingCustomer.visitCount,
          externalId: customerId,  // Store CRM ID
          syncState: 'SYNCED',
          lastSyncedAt: new Date()
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Customer already exists, updated with CRM data',
        customer: formatCustomerResponse(updatedCustomer)
      });
    }

    // Create new customer using customerService
    const customerData = {
      businessId: business.id,
      externalId: customerId,  // Store CRM customer ID
      email: email || null,
      firstName,
      lastName,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      postalCode: postalCode || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      marketingOptIn: marketingOptIn || false,
      loyaltyPoints: loyaltyPoints || 0,
      loyaltyTier: loyaltyTier || 'BRONZE',
      totalSpent: totalSpent || 0,
      visitCount: visitCount || 0
    };

    const newCustomer = await createFromWebhook(customerData);

    console.log(`[WEBHOOK] Customer created successfully: ${newCustomer.id}`);
    console.log(`[WEBHOOK] CRM ID: ${customerId} -> POS ID: ${newCustomer.id}`);

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer: formatCustomerResponse(newCustomer)
    });

  } catch (error) {
    console.error('[WEBHOOK] Error creating customer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create customer',
      details: error.message
    });
  }
}

/**
 * Handle customer update from CRM
 */
async function handleCustomerUpdate(req, res) {
  const {
    customerId,      // CRM customer ID
    externalId,      // POS customer ID
    email,
    firstName,
    lastName,
    phone,
    loyaltyPoints,
    loyaltyTier,
    totalSpent,
    visitCount,
    marketingOptIn,
    address,
    city,
    state,
    postalCode,
    dateOfBirth
  } = req.body;

  // Validate required fields
  if (!externalId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: externalId (POS customer ID)'
    });
  }

  try {
    // Find customer in POS by their ID (externalId from CRM is POS customer ID)
    const customer = await prisma.customer.findUnique({
      where: { id: externalId }
    });

    if (!customer) {
      console.log(`[WEBHOOK] Customer not found in POS: ${externalId}`);
      return res.status(404).json({
        success: false,
        error: 'Customer not found in POS'
      });
    }

    // Update customer with CRM data
    const updatedCustomer = await prisma.customer.update({
      where: { id: externalId },
      data: {
        // Update basic info (CRM is master for profile data)
        email: email || customer.email,
        firstName: firstName || customer.firstName,
        lastName: lastName || customer.lastName,
        phone: phone || customer.phone,
        address: address || customer.address,
        city: city || customer.city,
        state: state || customer.state,
        zipCode: postalCode || customer.zipCode,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : customer.dateOfBirth,
        marketingOptIn: marketingOptIn ?? customer.marketingOptIn,
        
        // Update loyalty data (calculated by CRM)
        loyaltyPoints: loyaltyPoints ?? customer.loyaltyPoints,
        loyaltyTier: loyaltyTier || customer.loyaltyTier,
        totalSpent: totalSpent ?? customer.totalSpent,
        visitCount: visitCount ?? customer.visitCount,
        
        // Store CRM customer ID for reference
        externalId: customerId,  // Store CRM ID in externalId field
        
        // Mark as synced
        syncState: 'SYNCED',
        lastSyncedAt: new Date()
      }
    });

    console.log(`[WEBHOOK] Customer updated successfully: ${externalId}`);
    console.log(`[WEBHOOK] Loyalty: ${updatedCustomer.loyaltyPoints} pts (${updatedCustomer.loyaltyTier})`);
    console.log(`[WEBHOOK] Total Spent: $${updatedCustomer.totalSpent}`);

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      customer: formatCustomerResponse(updatedCustomer)
    });

  } catch (error) {
    console.error('[WEBHOOK] Error updating customer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update customer',
      details: error.message
    });
  }
}

/**
 * Handle customer deletion from CRM
 */
async function handleCustomerDeletion(req, res) {
  const { customerId, externalId } = req.body;

  if (!externalId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: externalId (POS customer ID)'
    });
  }

  try {
    // Find customer in POS
    const customer = await prisma.customer.findUnique({
      where: { id: externalId }
    });

    if (!customer) {
      console.log(`[WEBHOOK] Customer not found in POS: ${externalId}`);
      return res.status(404).json({
        success: false,
        error: 'Customer not found in POS'
      });
    }

    // Soft delete - deactivate customer
    const deletedCustomer = await prisma.customer.update({
      where: { id: externalId },
      data: {
        isActive: false,
        syncState: 'SYNCED',
        lastSyncedAt: new Date()
      }
    });

    console.log(`[WEBHOOK] Customer deactivated: ${externalId}`);

    return res.status(200).json({
      success: true,
      message: 'Customer deactivated successfully',
      customer: {
        id: deletedCustomer.id,
        isActive: deletedCustomer.isActive
      }
    });

  } catch (error) {
    console.error('[WEBHOOK] Error deleting customer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete customer',
      details: error.message
    });
  }
}

/**
 * Format customer response
 */
function formatCustomerResponse(customer) {
  return {
    id: customer.id,
    externalId: customer.externalId,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    loyaltyPoints: customer.loyaltyPoints,
    loyaltyTier: customer.loyaltyTier,
    totalSpent: parseFloat(customer.totalSpent || 0),
    visitCount: customer.visitCount,
    syncState: customer.syncState,
    lastSyncedAt: customer.lastSyncedAt
  };
}

/**
 * GET /api/v1/webhooks/health
 * Health check endpoint for webhook system
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is healthy',
    webhookUrl: `${req.protocol}://${req.get('host')}/api/v1/webhooks`,
    timestamp: new Date().toISOString()
  });
});

export default router;