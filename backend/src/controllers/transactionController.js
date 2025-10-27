import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';
import * as transactionService from '../services/transactionService.js';

/**
 * @route   POST /api/v1/transactions
 * @desc    Create new transaction (sale)
 * @access  Private (CASHIER, ADMIN)
 */
export const createTransaction = asyncHandler(async (req, res) => {
  // FIXED: Pass parameters in correct order (businessId, transactionData, userId)
  const transaction = await transactionService.createTransaction(
    req.user.businessId,
    req.body,
    req.user.id
  );
  return createdResponse(res, transaction, 'Transaction completed successfully');
});

/**
 * @route   GET /api/v1/transactions
 * @desc    Get all transactions with filters
 * @access  Private (ADMIN, CASHIER can see only their own)
 */
export const getTransactions = asyncHandler(async (req, res) => {
  const filters = {
    page: req.query.page,
    limit: req.query.limit,
    status: req.query.status,
    customerId: req.query.customerId,
    userId: req.user.role === 'CASHIER' ? req.user.id : req.query.userId,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    minAmount: req.query.minAmount,
    maxAmount: req.query.maxAmount,
    paymentMethod: req.query.paymentMethod,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
  };

  const result = await transactionService.getAllTransactions(req.user.businessId, filters);

  return paginatedResponse(
    res,
    result.transactions,
    result.page,
    result.limit,
    result.total,
    'Transactions retrieved successfully'
  );
});

/**
 * @route   GET /api/v1/transactions/:id
 * @desc    Get single transaction by ID
 * @access  Private
 */
export const getTransaction = asyncHandler(async (req, res) => {
  // FIXED: Pass businessId first
  const transaction = await transactionService.getTransactionById(req.user.businessId, req.params.id);
  
  // Cashiers can only view their own transactions
  if (req.user.role === 'CASHIER' && transaction.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only view your own transactions',
    });
  }

  return successResponse(res, transaction, 'Transaction retrieved successfully');
});

/**
 * @route   GET /api/v1/transactions/number/:transactionNumber
 * @desc    Get transaction by transaction number
 * @access  Private
 */
export const getTransactionByNumber = asyncHandler(async (req, res) => {
  const transaction = await transactionService.getTransactionByNumber(req.params.transactionNumber, req.user.businessId);
  
  // Cashiers can only view their own transactions
  if (req.user.role === 'CASHIER' && transaction.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only view your own transactions',
    });
  }

  return successResponse(res, transaction, 'Transaction retrieved successfully');
});

/**
 * @route   POST /api/v1/transactions/:id/void
 * @desc    Void a transaction
 * @access  Private (ADMIN only)
 */
export const voidTransaction = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Void reason is required',
    });
  }

  const transaction = await transactionService.voidTransaction(
    req.params.id,
    reason,
    req.user.id,
    req.user.businessId
  );

  return successResponse(res, transaction, 'Transaction voided successfully');
});

/**
 * @route   GET /api/v1/transactions/reports/sales-summary
 * @desc    Get sales summary
 * @access  Private (ADMIN only)
 */
export const getSalesSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const summary = await transactionService.getSalesSummary(req.user.businessId, startDate, endDate);
  
  return successResponse(res, summary, 'Sales summary retrieved successfully');
});