import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';
import * as customerService from '../services/customerService.js';

/**
 * @route   GET /api/v1/customers
 * @desc    Get all customers
 * @access  Private
 */
export const getCustomers = asyncHandler(async (req, res) => {
  const filters = {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    loyaltyTier: req.query.loyaltyTier,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
  };

  const result = await customerService.getAllCustomers(filters);

  return paginatedResponse(
    res,
    result.customers,
    result.page,
    result.limit,
    result.total,
    'Customers retrieved successfully'
  );
});

/**
 * @route   GET /api/v1/customers/:id
 * @desc    Get single customer
 * @access  Private
 */
export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  return successResponse(res, customer, 'Customer retrieved successfully');
});

/**
 * @route   POST /api/v1/customers
 * @desc    Create customer
 * @access  Private
 */
export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body, req.user.id);
  return createdResponse(res, customer, 'Customer created successfully');
});

/**
 * @route   PUT /api/v1/customers/:id
 * @desc    Update customer
 * @access  Private
 */
export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body, req.user.id);
  return successResponse(res, customer, 'Customer updated successfully');
});

/**
 * @route   DELETE /api/v1/customers/:id
 * @desc    Delete customer
 * @access  Private (ADMIN only)
 */
export const deleteCustomer = asyncHandler(async (req, res) => {
  await customerService.deleteCustomer(req.params.id, req.user.id);
  return successResponse(res, null, 'Customer deleted successfully');
});

/**
 * @route   GET /api/v1/customers/search/:term
 * @desc    Search customers
 * @access  Private
 */
export const searchCustomers = asyncHandler(async (req, res) => {
  const customers = await customerService.searchCustomer(req.params.term);
  return successResponse(res, customers, 'Search results retrieved successfully');
});
