import apiClient from '../config/apiClient';

export const categoryService = {
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

export default categoryService;