import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  business: JSON.parse(localStorage.getItem('business')) || null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.business = action.payload.business;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.error = null;

      // Persist to localStorage
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('business', JSON.stringify(action.payload.business));
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.business = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;

      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('business');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
    clearError: (state) => {
      state.error = null;
    },
    // New action to update business settings (e.g., after changing currency)
    updateBusiness: (state, action) => {
      state.business = {
        ...state.business,
        ...action.payload,
      };
      // Persist updated business to localStorage
      localStorage.setItem('business', JSON.stringify(state.business));
    },
    // Update tokens on refresh
    updateTokens: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      
      // Also update business if provided
      if (action.payload.business) {
        state.business = action.payload.business;
        localStorage.setItem('business', JSON.stringify(action.payload.business));
      }
    },
  },
});

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  clearError,
  updateBusiness,
  updateTokens,
} = authSlice.actions;

export default authSlice.reducer;