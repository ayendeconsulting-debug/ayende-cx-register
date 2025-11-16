import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';
import * as stockAdjustmentService from '../services/stockAdjustmentService.js';

/**
 * @route   POST /api/v1/stock-adjustments
 * @desc    Create a new stock adjustment
 * @access  Private (INVENTORY_MANAGER, ADMIN, SUPER_ADMIN)
 */
export const createStockAdjustment = asyncHandler(async (req, res) => {
  const {
    productId,
    adjustmentType,
    quantityChange,
    reason,
    customReason,
    notes,
  } = req.body;

  // Validation
  if (!productId || !adjustmentType || !quantityChange || !reason) {
    return res.status(400).json({
      success: false,
      message: 'Product ID, adjustment type, quantity change, and reason are required',
    });
  }

  if (reason === 'OTHER' && !customReason) {
    return res.status(400).json({
      success: false,
      message: 'Custom reason is required when reason is OTHER',
    });
  }

  const adjustment = await stockAdjustmentService.createStockAdjustment(req.user.businessId, req.user.id, {
    productId,
    adjustmentType,
    quantityChange: parseInt(quantityChange),
    reason,
    customReason,
    notes,
  });

  return createdResponse(res, adjustment, 'Stock adjustment created successfully');
});

/**
 * @route   POST /api/v1/stock-adjustments/:id/approve
 * @desc    Approve a stock adjustment
 * @access  Private (SUPER_ADMIN only)
 */
export const approveStockAdjustment = asyncHandler(async (req, res) => {
  const { approvalNotes } = req.body;

  const adjustment = await stockAdjustmentService.approveStockAdjustment(
    req.user.businessId,
    req.params.id,
    req.user.id,
    approvalNotes
  );

  return successResponse(res, adjustment, 'Stock adjustment approved successfully');
});

/**
 * @route   POST /api/v1/stock-adjustments/:id/reject
 * @desc    Reject a stock adjustment
 * @access  Private (SUPER_ADMIN only)
 */
export const rejectStockAdjustment = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  if (!rejectionReason) {
    return res.status(400).json({
      success: false,
      message: 'Rejection reason is required',
    });
  }

  const adjustment = await stockAdjustmentService.rejectStockAdjustment(
    req.user.businessId,
    req.params.id,
    req.user.id,
    rejectionReason
  );

  return successResponse(res, adjustment, 'Stock adjustment rejected');
});

/**
 * @route   POST /api/v1/stock-adjustments/:id/cancel
 * @desc    Cancel a pending stock adjustment
 * @access  Private (Creator only)
 */
export const cancelStockAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await stockAdjustmentService.cancelStockAdjustment(
    req.user.businessId,
    req.params.id,
    req.user.id
  );

  return successResponse(res, adjustment, 'Stock adjustment cancelled');
});

/**
 * @route   GET /api/v1/stock-adjustments
 * @desc    Get all stock adjustments with filters
 * @access  Private (INVENTORY_MANAGER sees own, ADMIN/SUPER_ADMIN see all)
 */
export const getStockAdjustments = asyncHandler(async (req, res) => {
  const filters = {
    page: req.query.page,
    limit: req.query.limit,
    productId: req.query.productId,
    status: req.query.status,
    createdBy:
      req.user.role === 'INVENTORY_MANAGER' ? req.user.id : req.query.createdBy,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
  };

  const result = await stockAdjustmentService.getAllStockAdjustments(req.user.businessId, filters);

  return paginatedResponse(
    res,
    result.adjustments,
    result.page,
    result.limit,
    result.total,
    'Stock adjustments retrieved successfully'
  );
});

/**
 * @route   GET /api/v1/stock-adjustments/pending
 * @desc    Get pending approvals count (for notification badge)
 * @access  Private (SUPER_ADMIN only)
 * 
 * FIXED: Returns count in format expected by frontend
 */
export const getPendingApprovals = asyncHandler(async (req, res) => {
  // Only admins can see pending approvals count
  if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return successResponse(res, { count: 0 }, 'No permissions to view pending approvals');
  }

  try {
    const count = await stockAdjustmentService.getPendingApprovalsCount(req.user.businessId);
    
    return successResponse(
      res,
      { count },
      'Pending approvals count retrieved successfully'
    );
  } catch (error) {
    console.error('Error getting pending approvals count:', error);
    // Return 0 count on error instead of failing
    return successResponse(res, { count: 0 }, 'Unable to retrieve pending count');
  }
});

/**
 * @route   GET /api/v1/stock-adjustments/:id
 * @desc    Get stock adjustment by ID
 * @access  Private
 */
export const getStockAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await stockAdjustmentService.getStockAdjustmentById(req.user.businessId, req.params.id);

  // INVENTORY_MANAGER can only view their own adjustments
  if (
    req.user.role === 'INVENTORY_MANAGER' &&
    adjustment.createdBy !== req.user.id
  ) {
    return res.status(403).json({
      success: false,
      message: 'You can only view your own stock adjustments',
    });
  }

  return successResponse(res, adjustment, 'Stock adjustment retrieved successfully');
});

/**
 * @route   GET /api/v1/stock-adjustments/product/:productId/history
 * @desc    Get stock movement history for a product
 * @access  Private
 */
export const getStockMovementHistory = asyncHandler(async (req, res) => {
  const filters = {
    page: req.query.page,
    limit: req.query.limit,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
  };

  const result = await stockAdjustmentService.getStockMovementHistory(
    req.user.businessId,
    req.params.productId,
    filters
  );

  return paginatedResponse(
    res,
    result.movements,
    result.page,
    result.limit,
    result.total,
    'Stock movement history retrieved successfully'
  );
});