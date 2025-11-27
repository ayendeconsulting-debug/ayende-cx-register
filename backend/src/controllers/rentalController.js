import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';
import * as rentalService from '../services/rentalService.js';

/**
 * @route   POST /api/v1/rentals
 * @desc    Create new rental contract
 * @access  Private (CASHIER, ADMIN)
 */
export const createRentalContract = asyncHandler(async (req, res) => {
  const contract = await rentalService.createRentalContract(
    req.user.businessId,
    req.body,
    req.user.id
  );

  return createdResponse(res, contract, 'Rental contract created successfully');
});

/**
 * @route   GET /api/v1/rentals
 * @desc    Get all rental contracts with filters
 * @access  Private
 */
export const getRentalContracts = asyncHandler(async (req, res) => {
  const filters = {
    page: req.query.page,
    limit: req.query.limit,
    status: req.query.status,
    customerId: req.query.customerId,
    startDateFrom: req.query.startDateFrom,
    startDateTo: req.query.startDateTo,
    expectedReturnFrom: req.query.expectedReturnFrom,
    expectedReturnTo: req.query.expectedReturnTo,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
    search: req.query.search
  };

  const result = await rentalService.getAllRentalContracts(req.user.businessId, filters);

  return paginatedResponse(
    res,
    result.contracts,
    result.page,
    result.limit,
    result.total,
    'Rental contracts retrieved successfully'
  );
});

/**
 * @route   GET /api/v1/rentals/overdue
 * @desc    Get overdue rental contracts
 * @access  Private (ADMIN)
 */
export const getOverdueRentals = asyncHandler(async (req, res) => {
  const overdueContracts = await rentalService.getOverdueRentals(req.user.businessId);

  return successResponse(res, {
    count: overdueContracts.length,
    contracts: overdueContracts
  }, 'Overdue rentals retrieved successfully');
});

/**
 * @route   GET /api/v1/rentals/reports/summary
 * @desc    Get rental reports summary
 * @access  Private (ADMIN)
 */
export const getRentalSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const summary = await rentalService.getRentalSummary(
    req.user.businessId,
    startDate,
    endDate
  );

  return successResponse(res, summary, 'Rental summary retrieved successfully');
});

/**
 * @route   GET /api/v1/rentals/:id
 * @desc    Get single rental contract by ID
 * @access  Private
 */
export const getRentalContract = asyncHandler(async (req, res) => {
  const contract = await rentalService.getRentalContractById(
    req.user.businessId,
    req.params.id
  );

  return successResponse(res, contract, 'Rental contract retrieved successfully');
});

/**
 * @route   POST /api/v1/rentals/:id/return
 * @desc    Process rental return
 * @access  Private (CASHIER, ADMIN)
 */
export const processReturn = asyncHandler(async (req, res) => {
  const { items, returnNotes, damageNotes, depositReturned, additionalCharges } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Return items are required'
    });
  }

  const contract = await rentalService.processRentalReturn(
    req.user.businessId,
    req.params.id,
    { items, returnNotes, damageNotes, depositReturned, additionalCharges },
    req.user.id
  );

  return successResponse(res, contract, 'Rental return processed successfully');
});

/**
 * @route   POST /api/v1/rentals/:id/close
 * @desc    Close rental contract
 * @access  Private (ADMIN)
 */
export const closeContract = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const contract = await rentalService.closeRentalContract(
    req.user.businessId,
    req.params.id,
    req.user.id,
    notes
  );

  return successResponse(res, contract, 'Rental contract closed successfully');
});

/**
 * @route   POST /api/v1/rentals/:id/cancel
 * @desc    Cancel rental contract
 * @access  Private (ADMIN)
 */
export const cancelContract = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Cancellation reason is required'
    });
  }

  const contract = await rentalService.cancelRentalContract(
    req.user.businessId,
    req.params.id,
    req.user.id,
    reason
  );

  return successResponse(res, contract, 'Rental contract cancelled successfully');
});

/**
 * @route   POST /api/v1/rentals/update-overdue
 * @desc    Update overdue status for all contracts
 * @access  Private (ADMIN) - Also called by cron job
 */
export const updateOverdueStatus = asyncHandler(async (req, res) => {
  const count = await rentalService.updateOverdueStatus(req.user.businessId);

  return successResponse(res, { updatedCount: count }, `${count} contracts marked as overdue`);
});
