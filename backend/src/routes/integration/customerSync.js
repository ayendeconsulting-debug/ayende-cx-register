// src/routes/integration/customerSync.js
/**
 * Customer Sync Webhook Routes
 * Receives real-time customer updates from CRM system
 */

import express from 'express';
import { 
  handleCustomerCreated, 
  handleCustomerUpdated, 
  handleCustomerDeleted 
} from '../../controllers/integration/customerSyncController.js';

const router = express.Router();

/**
 * POST /api/integration/webhook/customer-created
 * Receive notification when customer is created in CRM
 */
router.post('/webhook/customer-created', handleCustomerCreated);

/**
 * POST /api/integration/webhook/customer-updated
 * Receive notification when customer is updated in CRM
 */
router.post('/webhook/customer-updated', handleCustomerUpdated);

/**
 * POST /api/integration/webhook/customer-deleted
 * Receive notification when customer is deleted in CRM
 */
router.post('/webhook/customer-deleted', handleCustomerDeleted);

export default router;
