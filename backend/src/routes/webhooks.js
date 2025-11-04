/**
 * Webhook Routes
 * Receives webhook notifications from CRM when customer data changes
 * 
 * This implements the CRM → POS direction of bidirectional sync
 * 
 * Endpoints:
 * - POST /api/v1/webhooks/customer - Receive customer updates from CRM
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

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
 * Receive customer update from CRM
 * 
 * Expected payload:
 * {
 *   "customerId": "crm-customer-uuid",
 *   "externalId": "pos-customer-uuid",  // POS customer ID
 *   "email": "customer@example.com",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "phone": "1234567890",
 *   "loyaltyPoints": 150,
 *   "loyaltyTier": "SILVER",
 *   "totalSpent": 250.00,
 *   "visitCount": 5,
 *   "marketingOptIn": true
 * }
 */
router.post('/customer', verifyWebhookToken, async (req, res) => {
  try {
    console.log('[WEBHOOK] Received customer update from CRM');
    
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
      customer: {
        id: updatedCustomer.id,
        externalId: updatedCustomer.externalId,
        email: updatedCustomer.email,
        firstName: updatedCustomer.firstName,
        lastName: updatedCustomer.lastName,
        loyaltyPoints: updatedCustomer.loyaltyPoints,
        loyaltyTier: updatedCustomer.loyaltyTier,
        totalSpent: parseFloat(updatedCustomer.totalSpent || 0),
        visitCount: updatedCustomer.visitCount
      }
    });

  } catch (error) {
    console.error('[WEBHOOK] Error processing customer update:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

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
