/**
 * Loyalty Reconciliation Routes
 * PHASE 2E: API routes for reconciliation endpoints
 * 
 * Location: src/routes/reconciliationRoutes.js
 */

import express from 'express';
import {
  triggerManualReconciliation,
  reconcileSpecificCustomer,
  getCustomerHistory,
  getSummary,
  getReviewNeeded,
  resolveReconciliation,
} from '../controllers/reconciliationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/reconciliation/trigger
 * Manually trigger reconciliation for business
 */
router.post('/trigger', triggerManualReconciliation);

/**
 * POST /api/v1/reconciliation/customer/:customerId
 * Reconcile a specific customer
 */
router.post('/customer/:customerId', reconcileSpecificCustomer);

/**
 * GET /api/v1/reconciliation/customer/:customerId/history
 * Get reconciliation history for a customer
 */
router.get('/customer/:customerId/history', getCustomerHistory);

/**
 * GET /api/v1/reconciliation/summary
 * Get reconciliation summary for business
 * Query params: startDate, endDate (optional)
 */
router.get('/summary', getSummary);

/**
 * GET /api/v1/reconciliation/review-needed
 * Get items needing manual review
 */
router.get('/review-needed', getReviewNeeded);

/**
 * PUT /api/v1/reconciliation/:reconciliationId/resolve
 * Resolve a reconciliation item manually
 * Body: { action: 'ACCEPT_POS' | 'ACCEPT_CRM' | 'MANUAL_ADJUST' | 'IGNORE', notes: string }
 */
router.put('/:reconciliationId/resolve', resolveReconciliation);

export default router;
