import apiClient from '../config/apiClient';

export const transactionService = {
  // Create transaction (process sale)
  createTransaction: async (transactionData) => {
    const response = await apiClient.post('/transactions', transactionData);
    return response.data;
  },

  // Get all transactions
  getAllTransactions: async (params = {}) => {
    const response = await apiClient.get('/transactions', { params });
    return response.data;
  },

  // Get transaction by ID
  getTransactionById: async (id) => {
    const response = await apiClient.get(`/transactions/${id}`);
    return response.data;
  },

  // Void transaction
  voidTransaction: async (id, reason) => {
    const response = await apiClient.post(`/transactions/${id}/void`, { reason });
    return response.data;
  },

  // Get sales summary
  getSalesSummary: async (startDate, endDate) => {
    const response = await apiClient.get('/transactions/reports/summary', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Get sales by payment method
  getSalesByPaymentMethod: async (startDate, endDate) => {
    const response = await apiClient.get('/transactions/reports/by-payment-method', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

export default transactionService;