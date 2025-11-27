import apiClient from '../config/apiClient';

const rentalService = {
  // Get all rentals with optional filters
  getAllRentals: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.customerId) queryParams.append('customerId', params.customerId);
    if (params.search) queryParams.append('search', params.search);
    if (params.startDateFrom) queryParams.append('startDateFrom', params.startDateFrom);
    if (params.startDateTo) queryParams.append('startDateTo', params.startDateTo);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const query = queryParams.toString();
    const response = await apiClient.get(`/rentals${query ? `?${query}` : ''}`);
    return response.data;
  },

  // Get single rental by ID
  getRentalById: async (id) => {
    const response = await apiClient.get(`/rentals/${id}`);
    return response.data;
  },

  // Create new rental contract
  createRental: async (data) => {
    const response = await apiClient.post('/rentals', data);
    return response.data;
  },

  // Process rental return
  processReturn: async (id, data) => {
    const response = await apiClient.post(`/rentals/${id}/return`, data);
    return response.data;
  },

  // Close rental contract
  closeRental: async (id, notes = '') => {
    const response = await apiClient.post(`/rentals/${id}/close`, { notes });
    return response.data;
  },

  // Cancel rental contract
  cancelRental: async (id, reason) => {
    const response = await apiClient.post(`/rentals/${id}/cancel`, { reason });
    return response.data;
  },

  // Get overdue rentals
  getOverdueRentals: async () => {
    const response = await apiClient.get('/rentals/overdue');
    return response.data;
  },

  // Get rental summary/reports
  getRentalSummary: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString();
    const response = await apiClient.get(`/rentals/reports/summary${query ? `?${query}` : ''}`);
    return response.data;
  },

  // Update overdue status manually
  updateOverdueStatus: async () => {
    const response = await apiClient.post('/rentals/update-overdue');
    return response.data;
  }
};

export default rentalService;

