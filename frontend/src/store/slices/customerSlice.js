import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  customers: [],
  selectedCustomer: null,
  loading: false,
  error: null,
};

const customerSlice = createSlice({
  name: 'customer',
  initialState,
  reducers: {
    setCustomers: (state, action) => {
      state.customers = action.payload;
    },
    setSelectedCustomer: (state, action) => {
      state.selectedCustomer = action.payload;
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setCustomers,
  setSelectedCustomer,
  clearSelectedCustomer,
  setLoading,
  setError,
} = customerSlice.actions;

export default customerSlice.reducer;
