/**
 * Loyalty Reconciliation Controller
 * PHASE 2E: API endpoints for manual reconciliation and reporting
 * 
 * Location: src/controllers/reconciliationController.js
 */

import {
  reconcileCustomerLoyalty,
  reconcileAllCustomers,
  getCustomerReconciliationHistory,
  getReconciliationSummary,
  getItemsNeedingReview,
} from '../services/loyaltyReconciliationService.js';
import { triggerReconciliation } from '../cron/reconciliationJob.js';

/**
 * Manually trigger reconciliation for a business
 * POST /api/v1/reconciliation/trigger
 */
export const triggerManualReconciliation = async (req, res) => {
  try {
    const { businessId } = req.body;
    const userBusinessId = req.user.businessId;

    // Validate business access
    if (businessId && businessId !== userBusinessId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this business',
      });
    }

    console.log(`[RECONCILIATION API] Manual trigger by user ${req.user.id}`);

    // Use authenticated user's business if not specified
    const targetBusinessId = businessId || userBusinessId;

    // Trigger reconciliation
    const results = await reconcileAllCustomers(targetBusinessId);

    res.status(200).json({
      success: true,
      message: 'Reconciliation completed',
      results: {
        totalCustomers: results.totalCustomers,
        processed: results.processed,
        matched: results.matched,
        autoSynced: results.autoSynced,
        manualReview: results.manualReview,
        failed: results.failed,
        errors: results.errors.length > 0 ? results.errors : undefined,
      },
    });
  } catch (error) {
    console.error('[RECONCILIATION API] Error in manual trigger:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger reconciliation',
      details: error.message,
    });
  }
};

/**
 * Reconcile a specific customer
 * POST /api/v1/reconciliation/customer/:customerId
 */
export const reconcileSpecificCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const businessId = req.user.businessId;

    console.log(`[RECONCILIATION API] Reconciling customer ${customerId}`);

    const result = await reconcileCustomerLoyalty(businessId, customerId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found or not eligible for reconciliation',
      });
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Reconciliation failed',
        details: result.error,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer reconciliation completed',
      result: {
        action: result.action,
        discrepancy: result.discrepancy,
        reconciliationId: result.reconciliation.id,
      },
    });
  } catch (error) {
    console.error('[RECONCILIATION API] Error reconciling customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reconcile customer',
      details: error.message,
    });
  }
};

/**
 * Get reconciliation history for a customer
 * GET /api/v1/reconciliation/customer/:customerId/history
 */
export const getCustomerHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    console.log(`[RECONCILIATION API] Fetching history for customer ${customerId}`);

    const history = await getCustomerReconciliationHistory(customerId, limit);

    res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error('[RECONCILIATION API] Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reconciliation history',
      details: error.message,
    });
  }
};

/**
 * Get reconciliation summary for business
 * GET /api/v1/reconciliation/summary
 */
export const getSummary = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    console.log(`[RECONCILIATION API] Fetching summary for business ${businessId}`);

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const summary = await getReconciliationSummary(businessId, start, end);

    res.status(200).json({
      success: true,
      summary,
      dateRange: {
        startDate: start?.toISOString(),
        endDate: end?.toISOString(),
      },
    });
  } catch (error) {
    console.error('[RECONCILIATION API] Error fetching summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reconciliation summary',
      details: error.message,
    });
  }
};

/**
 * Get items needing manual review
 * GET /api/v1/reconciliation/review-needed
 */
export const getReviewNeeded = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    console.log(`[RECONCILIATION API] Fetching items needing review for business ${businessId}`);

    const items = await getItemsNeedingReview(businessId);

    res.status(200).json({
      success: true,
      count: items.length,
      items: items.map(item => ({
        reconciliationId: item.id,
        customerId: item.customerId,
        customerEmail: item.customer.email,
        customerName: `${item.customer.firstName} ${item.customer.lastName}`,
        posPoints: item.posPoints,
        crmPoints: item.crmPoints,
        discrepancy: item.discrepancy,
        reconciliationDate: item.reconciliationDate,
        notes: item.notes,
      })),
    });
  } catch (error) {
    console.error('[RECONCILIATION API] Error fetching review items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch items needing review',
      details: error.message,
    });
  }
};

/**
 * Resolve a reconciliation item manually
 * PUT /api/v1/reconciliation/:reconciliationId/resolve
 */
export const resolveReconciliation = async (req, res) => {
  try {
    const { reconciliationId } = req.params;
    const { action, notes } = req.body;
    const userId = req.user.id;

    console.log(`[RECONCILIATION API] Resolving reconciliation ${reconciliationId}`);

    // Validate action
    const validActions = ['ACCEPT_POS', 'ACCEPT_CRM', 'MANUAL_ADJUST', 'IGNORE'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        validActions,
      });
    }

    // Get reconciliation record
    const reconciliation = await prisma.loyaltyReconciliation.findUnique({
      where: { id: reconciliationId },
      include: {
        customer: true,
      },
    });

    if (!reconciliation) {
      return res.status(404).json({
        success: false,
        error: 'Reconciliation record not found',
      });
    }

    // Update based on action
    let updateData = {
      resolutionStatus: 'RESOLVED',
      resolvedBy: userId,
      resolvedAt: new Date(),
      notes: notes || reconciliation.notes,
    };

    if (action === 'ACCEPT_CRM') {
      // Update POS to match CRM
      await prisma.customer.update({
        where: { id: reconciliation.customerId },
        data: {
          loyaltyPoints: reconciliation.crmPoints,
          loyaltyPointsCRM: reconciliation.crmPoints,
          loyaltyLastSyncedAt: new Date(),
        },
      });
      updateData.resolutionAction = 'MANUAL_SYNC_TO_CRM';
    } else if (action === 'ACCEPT_POS') {
      // Would need to update CRM - log for now
      updateData.resolutionAction = 'MANUAL_SYNC_TO_POS';
      updateData.notes = `${updateData.notes || ''} - Flagged to sync POS value to CRM`;
    } else if (action === 'IGNORE') {
      updateData.resolutionAction = 'IGNORED';
      updateData.resolutionStatus = 'RESOLVED';
    }

    // Update reconciliation record
    const updated = await prisma.loyaltyReconciliation.update({
      where: { id: reconciliationId },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Reconciliation resolved',
      reconciliation: updated,
    });
  } catch (error) {
    console.error('[RECONCILIATION API] Error resolving reconciliation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve reconciliation',
      details: error.message,
    });
  }
};

export default {
  triggerManualReconciliation,
  reconcileSpecificCustomer,
  getCustomerHistory,
  getSummary,
  getReviewNeeded,
  resolveReconciliation,
};
