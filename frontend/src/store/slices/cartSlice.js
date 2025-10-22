import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  customer: null,
  subtotal: 0,
  tax: 0,
  discount: 0,
  total: 0,
  loyaltyPointsToRedeem: 0,
  loyaltyPointsToEarn: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const product = action.payload;
      const existingItem = state.items.find(item => item.productId === product.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({
          productId: product.id,
          name: product.name,
          price: parseFloat(product.price || 0),
          quantity: 1,
          sku: product.sku,
          barcode: product.barcode,
          loyaltyPointsBonus: product.loyaltyPointsBonus || 0,
        });
      }

      // Recalculate totals
      cartSlice.caseReducers.calculateTotals(state);
    },
    removeItem: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(item => item.productId !== productId);
      cartSlice.caseReducers.calculateTotals(state);
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find(item => item.productId === productId);
      
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(item => item.productId !== productId);
        } else {
          item.quantity = quantity;
        }
      }
      
      cartSlice.caseReducers.calculateTotals(state);
    },
    setCustomer: (state, action) => {
      state.customer = action.payload;
      cartSlice.caseReducers.calculateTotals(state);
    },
    removeCustomer: (state) => {
      state.customer = null;
      state.loyaltyPointsToRedeem = 0;
      cartSlice.caseReducers.calculateTotals(state);
    },
    setDiscount: (state, action) => {
      state.discount = action.payload;
      cartSlice.caseReducers.calculateTotals(state);
    },
    setLoyaltyPointsToRedeem: (state, action) => {
      state.loyaltyPointsToRedeem = action.payload;
      cartSlice.caseReducers.calculateTotals(state);
    },
    calculateTotals: (state) => {
      // Calculate subtotal
      state.subtotal = state.items.reduce((sum, item) => {
        return sum + (parseFloat(item.price || 0) * item.quantity);
      }, 0);

      // Calculate tax (15% default)
      const taxRate = 0.15;
      state.tax = state.subtotal * taxRate;

      // Calculate loyalty points discount
      const loyaltyDiscount = state.loyaltyPointsToRedeem / 100; // 100 points = $1

      // Calculate total
      state.total = state.subtotal + state.tax - state.discount - loyaltyDiscount;
      
      // Ensure total is not negative
      if (state.total < 0) {
        state.total = 0;
      }

      // Calculate loyalty points to earn (10 points per dollar)
      state.loyaltyPointsToEarn = Math.floor(state.total * 10);

      // Add bonus points from products
      const bonusPoints = state.items.reduce((sum, item) => {
        return sum + ((item.loyaltyPointsBonus || 0) * item.quantity);
      }, 0);
      state.loyaltyPointsToEarn += bonusPoints;
    },
    clearCart: (state) => {
      state.items = [];
      state.customer = null;
      state.subtotal = 0;
      state.tax = 0;
      state.discount = 0;
      state.total = 0;
      state.loyaltyPointsToRedeem = 0;
      state.loyaltyPointsToEarn = 0;
    },
  },
});

export const {
  addItem,
  removeItem,
  updateQuantity,
  setCustomer,
  removeCustomer,
  setDiscount,
  setLoyaltyPointsToRedeem,
  calculateTotals,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;