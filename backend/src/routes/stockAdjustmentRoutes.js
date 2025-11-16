import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as stockAdjustmentController from '../controllers/stockAdjustmentController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/stock-adjustments/pending
 * @desc    Get pending approvals count (for notification badge)
 * @access  SUPER_ADMIN, ADMIN
 * 
 * IMPORTANT: This route MUST come before /:id to avoid route conflicts
 */
router.get(
  '/pending',
  authorize('SUPER_ADMIN', 'ADMIN'),
  stockAdjustmentController.getPendingApprovals
);

/**
 * @route   GET /api/v1/stock-adjustments/product/:productId/history
 * @desc    Get stock movement history for a product
 * @access  INVENTORY_MANAGER, ADMIN, SUPER_ADMIN
 */
router.get(
  '/product/:productId/history',
  authorize('INVENTORY_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  stockAdjustmentController.getStockMovementHistory
);

/**
 * @route   GET /api/v1/stock-adjustments
 * @desc    Get all stock adjustments with filters
 * @access  INVENTORY_MANAGER, ADMIN, SUPER_ADMIN
 */
router.get(
  '/',
  authorize('INVENTORY_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  stockAdjustmentController.getStockAdjustments
);

/**
 * @route   POST /api/v1/stock-adjustments
 * @desc    Create a new stock adjustment
 * @access  INVENTORY_MANAGER, ADMIN, SUPER_ADMIN
 */
router.post(
  '/',
  authorize('INVENTORY_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  stockAdjustmentController.createStockAdjustment
);

/**
 * @route   GET /api/v1/stock-adjustments/:id
 * @desc    Get stock adjustment by ID
 * @access  INVENTORY_MANAGER (own only), ADMIN, SUPER_ADMIN
 */
router.get(
  '/:id',
  authorize('INVENTORY_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  stockAdjustmentController.getStockAdjustment
);

/**
 * @route   POST /api/v1/stock-adjustments/:id/approve
 * @desc    Approve a stock adjustment
 * @access  SUPER_ADMIN only
 */
router.post(
  '/:id/approve',
  authorize('SUPER_ADMIN'),
  stockAdjustmentController.approveStockAdjustment
);

/**
 * @route   POST /api/v1/stock-adjustments/:id/reject
 * @desc    Reject a stock adjustment
 * @access  SUPER_ADMIN only
 */
router.post(
  '/:id/reject',
  authorize('SUPER_ADMIN'),
  stockAdjustmentController.rejectStockAdjustment
);

/**
 * @route   POST /api/v1/stock-adjustments/:id/cancel
 * @desc    Cancel a pending stock adjustment
 * @access  Creator only (checked in controller)
 */
router.post(
  '/:id/cancel',
  authorize('INVENTORY_MANAGER', 'ADMIN', 'SUPER_ADMIN'),
  stockAdjustmentController.cancelStockAdjustment
);

export default router;