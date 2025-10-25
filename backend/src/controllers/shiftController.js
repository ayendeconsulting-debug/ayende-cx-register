import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';
import * as shiftService from '../services/shiftService.js';

/**
 * @route   POST /api/v1/shifts/open
 * @desc    Open a new shift
 * @access  Private (CASHIER, ADMIN)
 */
export const openShift = asyncHandler(async (req, res) => {
  const { openingCash, notes } = req.body;

  if (!openingCash || parseFloat(openingCash) < 0) {
    return res.status(400).json({
      success: false,
      message: 'Opening cash amount is required and must be positive',
    });
  }

  const shift = await shiftService.openShift(req.user.businessId, req.user.id, openingCash, notes);
  return createdResponse(res, shift, 'Shift opened successfully');
});

/**
 * @route   POST /api/v1/shifts/:id/close
 * @desc    Close a shift
 * @access  Private (CASHIER, ADMIN)
 */
export const closeShift = asyncHandler(async (req, res) => {
  const { closingCash, notes } = req.body;

  if (!closingCash || parseFloat(closingCash) < 0) {
    return res.status(400).json({
      success: false,
      message: 'Closing cash amount is required and must be positive',
    });
  }

  const shift = await shiftService.closeShift(
    req.user.businessId,
    req.params.id,
    closingCash,
    notes,
    req.user.id
  );
  return successResponse(res, shift, 'Shift closed successfully');
});

/**
 * @route   GET /api/v1/shifts
 * @desc    Get all shifts with filters
 * @access  Private (ADMIN can see all, CASHIER sees own)
 */
export const getShifts = asyncHandler(async (req, res) => {
  const filters = {
    page: req.query.page,
    limit: req.query.limit,
    userId: req.user.role === 'CASHIER' ? req.user.id : req.query.userId,
    status: req.query.status,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
  };

  const result = await shiftService.getAllShifts(req.user.businessId, filters);

  return paginatedResponse(
    res,
    result.shifts,
    result.page,
    result.limit,
    result.total,
    'Shifts retrieved successfully'
  );
});

/**
 * @route   GET /api/v1/shifts/current
 * @desc    Get current open shift for logged-in user
 * @access  Private
 */
export const getCurrentShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.getCurrentShift(req.user.businessId, req.user.id);

  if (!shift) {
    return res.status(404).json({
      success: false,
      message: 'No open shift found',
      data: null,
    });
  }

  return successResponse(res, shift, 'Current shift retrieved successfully');
});

/**
 * @route   GET /api/v1/shifts/:id
 * @desc    Get shift by ID
 * @access  Private
 */
export const getShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.getShiftById(req.user.businessId, req.params.id);

  // Cashiers can only view their own shifts
  if (req.user.role === 'CASHIER' && shift.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only view your own shifts',
    });
  }

  return successResponse(res, shift, 'Shift retrieved successfully');
});

/**
 * @route   GET /api/v1/shifts/:id/report
 * @desc    Get detailed shift report
 * @access  Private
 */
export const getShiftReport = asyncHandler(async (req, res) => {
  const report = await shiftService.getShiftReport(req.user.businessId, req.params.id);

  // Cashiers can only view their own shift reports
  if (req.user.role === 'CASHIER' && report.shift.user.id !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only view your own shift reports',
    });
  }

  return successResponse(res, report, 'Shift report retrieved successfully');
});