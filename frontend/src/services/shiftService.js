import apiClient from '../config/apiClient';

/**
 * Shift Service - API calls for shift management
 */

/**
 * Open a new shift
 */
export const openShift = async (data) => {
  const response = await apiClient.post('/shifts/open', data);
  return response.data;
};

/**
 * Close a shift
 */
export const closeShift = async (shiftId, data) => {
  const response = await apiClient.post(`/shifts/${shiftId}/close`, data);
  return response.data;
};

/**
 * Get all shifts
 */
export const getAllShifts = async (params = {}) => {
  const response = await apiClient.get('/shifts', { params });
  return response.data;
};

/**
 * Get current open shift
 */
export const getCurrentShift = async () => {
  try {
    const response = await apiClient.get('/shifts/current');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: false, data: null };
    }
    throw error;
  }
};

/**
 * Get shift by ID
 */
export const getShiftById = async (shiftId) => {
  const response = await apiClient.get(`/shifts/${shiftId}`);
  return response.data;
};

/**
 * Get shift report
 */
export const getShiftReport = async (shiftId) => {
  const response = await apiClient.get(`/shifts/${shiftId}/report`);
  return response.data;
};

const shiftService = {
  openShift,
  closeShift,
  getAllShifts,
  getCurrentShift,
  getShiftById,
  getShiftReport,
};

export default shiftService;
