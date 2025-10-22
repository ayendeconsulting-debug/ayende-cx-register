import apiClient from '../config/apiClient';

export const authService = {
  // Login user
  login: async (username, password) => {
    const response = await apiClient.post('/auth/login', {
      username,
      password,
    });
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  // Change password
  changePassword: async (oldPassword, newPassword) => {
    const response = await apiClient.post('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },
};

export default authService;
