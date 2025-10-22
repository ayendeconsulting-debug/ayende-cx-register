import apiClient from '../config/apiClient';

export const customerService = {
  // Get all customers
  getAllCustomers: async (params = {}) => {
    const response = await apiClient.get('/customers', { params });
    return response.data;
  },

  // Get customer by ID
  getCustomerById: async (id) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  // Search customer by phone
  searchCustomerByPhone: async (phone) => {
    const response = await apiClient.get(`/customers/search/${phone}`);
    return response.data;
  },

  // Create customer
  createCustomer: async (customerData) => {
    const response = await apiClient.post('/customers', customerData);
    return response.data;
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    const response = await apiClient.put(`/customers/${id}`, customerData);
    return response.data;
  },

  // Delete customer
  deleteCustomer: async (id) => {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  },
};

export default customerService;
