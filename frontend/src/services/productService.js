import apiClient from '../config/apiClient';

export const productService = {
  // Get all products
  getAllProducts: async (params = {}) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  // Get product by ID
  getProductById: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  // Get product by barcode
  getProductByBarcode: async (barcode) => {
    const response = await apiClient.get(`/products/barcode/${barcode}`);
    return response.data;
  },

  // Search products
  searchProducts: async (query) => {
    const response = await apiClient.get(`/products/search`, {
      params: { query },
    });
    return response.data;
  },

  // Create product
  createProduct: async (productData) => {
    const response = await apiClient.post('/products', productData);
    return response.data;
  },

  // Update product
  updateProduct: async (id, productData) => {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  },

  // Delete product
  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  // Get low stock products
  getLowStockProducts: async () => {
    const response = await apiClient.get('/products/low-stock');
    return response.data;
  },

  // Adjust stock
  adjustStock: async (id, adjustment) => {
    const response = await apiClient.post(`/products/${id}/adjust-stock`, adjustment);
    return response.data;
  },

  // Get all categories
  getAllCategories: async () => {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  // Get category by ID
  getCategoryById: async (id) => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  // Create category
  createCategory: async (categoryData) => {
    const response = await apiClient.post('/categories', categoryData);
    return response.data;
  },

  // Update category
  updateCategory: async (id, categoryData) => {
    const response = await apiClient.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id) => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  },
};

export default productService;