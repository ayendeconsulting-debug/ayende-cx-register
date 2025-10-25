import apiClient from '../config/apiClient';

/**
 * Stock Adjustment Service - API calls for stock adjustment management
 */

/**
 * Create a stock adjustment
 */
export const createStockAdjustment = async (data) => {
  const response = await apiClient.post('/stock-adjustments', data);
  return response.data;
};

/**
 * Get all stock adjustments with filters
 */
export const getAllStockAdjustments = async (params = {}) => {
  const response = await apiClient.get('/stock-adjustments', { params });
  return response.data;
};

/**
 * Get stock adjustment by ID
 */
export const getStockAdjustmentById = async (adjustmentId) => {
  const response = await apiClient.get(`/stock-adjustments/${adjustmentId}`);
  return response.data;
};

/**
 * Get pending approvals (SUPER_ADMIN only)
 */
export const getPendingApprovals = async () => {
  const response = await apiClient.get('/stock-adjustments/pending');
  return response.data;
};

/**
 * Approve a stock adjustment (SUPER_ADMIN only)
 */
export const approveStockAdjustment = async (adjustmentId, approvalNotes) => {
  const response = await apiClient.post(`/stock-adjustments/${adjustmentId}/approve`, {
    approvalNotes,
  });
  return response.data;
};

/**
 * Reject a stock adjustment (SUPER_ADMIN only)
 */
export const rejectStockAdjustment = async (adjustmentId, rejectionReason) => {
  const response = await apiClient.post(`/stock-adjustments/${adjustmentId}/reject`, {
    rejectionReason,
  });
  return response.data;
};

/**
 * Cancel a pending stock adjustment
 */
export const cancelStockAdjustment = async (adjustmentId) => {
  const response = await apiClient.post(`/stock-adjustments/${adjustmentId}/cancel`);
  return response.data;
};

/**
 * Get stock movement history for a product
 */
export const getStockMovementHistory = async (productId, params = {}) => {
  const response = await apiClient.get(
    `/stock-adjustments/product/${productId}/history`,
    { params }
  );
  return response.data;
};

const stockAdjustmentService = {
  createStockAdjustment,
  getAllStockAdjustments,
  getStockAdjustmentById,
  getPendingApprovals,
  approveStockAdjustment,
  rejectStockAdjustment,
  cancelStockAdjustment,
  getStockMovementHistory,
};

export default stockAdjustmentService;
