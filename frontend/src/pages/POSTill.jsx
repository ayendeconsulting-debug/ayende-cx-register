import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addItem,
  removeItem,
  updateQuantity,
  setCustomer,
  removeCustomer,
  setDiscount,
  setLoyaltyPointsToRedeem,
  clearCart,
} from '../store/slices/cartSlice';
import productService from '../services/productService';
import customerService from '../services/customerService';
import transactionService from '../services/transactionService';
import toast from 'react-hot-toast';
import {
  Search,
  Scan,
  User,
  X,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Smartphone,
  Building2,
  Receipt,
  ShoppingCart,
} from 'lucide-react';

const POSTill = () => {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [discountAmount, setDiscountAmount] = useState('');
  const [loyaltyPointsInput, setLoyaltyPointsInput] = useState('');

  const barcodeInputRef = useRef(null);

  // Load products and categories on mount
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Focus barcode input on mount
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productService.getAllProducts();
      if (response.success) {
        console.log('Loaded products:', response.data); // Debug log
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await productService.getAllCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const handleBarcodeSearch = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      const response = await productService.getProductByBarcode(barcodeInput);
      if (response.success) {
        const productWithPrice = {
          ...response.data,
          price: parseFloat(response.data.price || 0)
        };
        dispatch(addItem(productWithPrice));
        toast.success(`Added ${response.data.name}`);
        setBarcodeInput('');
      }
    } catch (error) {
      toast.error('Product not found');
      setBarcodeInput('');
    }
  };

  const handleAddProduct = (product) => {
    console.log('Adding product:', product); // Debug log
    // Ensure price is a number
    const productWithPrice = {
      ...product,
      id: product.id || product.productId, // Handle different id field names
      price: parseFloat(product.price || 0)
    };
    dispatch(addItem(productWithPrice));
    toast.success(`Added ${product.name}`);
  };

  const handleCustomerLookup = async () => {
    if (!customerPhone.trim()) {
      toast.error('Please enter phone number');
      return;
    }

    try {
      const response = await customerService.searchCustomerByPhone(customerPhone);
      console.log('Customer search response:', response); // Debug log
      
      if (response.success) {
        // Backend returns an array of customers, take the first one
        const customers = response.data;
        
        if (!customers || customers.length === 0) {
          toast.error('Customer not found');
          return;
        }
        
        const customerData = customers[0]; // Take first matching customer
        console.log('Selected customer:', customerData); // Debug log
        
        // Ensure customer has a name property
        const customer = {
          ...customerData,
          name: customerData.name || `${customerData.firstName} ${customerData.lastName}`.trim(),
        };
        
        dispatch(setCustomer(customer));
        toast.success(`Customer: ${customer.name}`);
        setShowCustomerModal(false);
        setCustomerPhone('');
      }
    } catch (error) {
      console.error('Customer lookup error:', error);
      toast.error(error.response?.data?.message || 'Customer not found');
    }
  };

  const handleRemoveCustomer = () => {
    dispatch(removeCustomer());
    toast.success('Customer removed');
  };

  const handleApplyDiscount = () => {
    const discount = parseFloat(discountAmount) || 0;
    if (discount < 0) {
      toast.error('Discount cannot be negative');
      return;
    }
    dispatch(setDiscount(discount));
    toast.success(`Discount applied: $${discount.toFixed(2)}`);
  };

  const handleApplyLoyaltyPoints = () => {
    const points = parseInt(loyaltyPointsInput) || 0;
    if (points < 0) {
      toast.error('Points cannot be negative');
      return;
    }
    if (!cart.customer) {
      toast.error('Please add a customer first');
      return;
    }
    if (points > cart.customer.loyaltyPoints) {
      toast.error('Not enough loyalty points');
      return;
    }
    dispatch(setLoyaltyPointsToRedeem(points));
    toast.success(`Redeeming ${points} points`);
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
   // if (!cart.customer) {
     // toast.error('Please add a customer first');
     // setShowCustomerModal(true);
     // return;
    //}
    setShowPaymentModal(true);
  };

  const handleCompletePayment = async () => {
    const paid = parseFloat(amountPaid) || 0;

    if (paid < cart.total) {
      toast.error('Insufficient payment amount');
      return;
    }

    setProcessing(true);

    try {
      // Backend only needs productId and quantity - it fetches price from database
      const transactionData = {
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod: paymentMethod,
        amountPaid: parseFloat(paid),
      };

      // Only add customerId if customer exists (support walk-in)
      if (cart.customer?.id) {
        transactionData.customerId = cart.customer.id;
      }

      // Only add optional fields if they have values
      if (cart.discount && cart.discount > 0) {
        transactionData.discountAmount = cart.discount;
      }
      
      // Only redeem points if customer exists
      if (cart.customer && cart.loyaltyPointsToRedeem && cart.loyaltyPointsToRedeem > 0) {
        transactionData.loyaltyPointsRedeemed = cart.loyaltyPointsToRedeem;
      }

      console.log('Sending transaction:', JSON.stringify(transactionData, null, 2));

      const response = await transactionService.createTransaction(transactionData);

      if (response.success) {
        setLastTransaction(response.data);
        toast.success('Transaction completed!');
        dispatch(clearCart());
        setShowPaymentModal(false);
        setShowReceiptModal(true);
        setAmountPaid('');
        setDiscountAmount('');
        setLoyaltyPointsInput('');

        // Reload products to update stock
        loadProducts();
      }
    } catch (error) {
      console.error('Full transaction error:', error);
      console.error('Error response:', error.response);
      const errorMsg = error.response?.data?.message || error.message || 'Transaction failed';
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const handleNewSale = () => {
    setShowReceiptModal(false);
    setLastTransaction(null);
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && product.stockQuantity > 0;
  });

  const change = parseFloat(amountPaid || 0) - cart.total;

  return (
    <div className="h-screen flex gap-4 bg-gray-100 p-6">
      {/* Left Side - Products */}
      <div className="flex-1 flex flex-col">
        {/* Search and Barcode */}
        <div className="card mb-4">
            <div className="grid grid-cols-2 gap-4">
              <form onSubmit={handleBarcodeSearch} className="flex gap-2">
                <div className="flex-1 relative">
                  <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan or enter barcode"
                    className="input-field pl-10"
                  />
                </div>
                <button type="submit" className="btn-primary">
                  Add
                </button>
              </form>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products"
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                !selectedCategory
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product)}
                  className="card hover:shadow-lg transition-shadow text-left"
                >
                  <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{product.sku}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-primary-600">
                      ${parseFloat(product.price || 0).toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">Stock: {product.stockQuantity}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Cart */}
        <div className="w-96 flex flex-col">
          <div className="card flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                Cart ({cart.items.length})
              </h2>
              {cart.items.length > 0 && (
                <button
                  onClick={() => dispatch(clearCart())}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Customer Info */}
            {cart.customer ? (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <User className="w-4 h-4 text-primary-600" />
                      <span className="text-xs font-medium text-primary-600">CUSTOMER</span>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {cart.customer.name || `${cart.customer.firstName || ''} ${cart.customer.lastName || ''}`.trim() || 'Customer'}
                    </p>
                    <p className="text-sm text-gray-600">{cart.customer.phone}</p>
                    <p className="text-sm text-primary-600 font-medium">
                      Points: {cart.customer.loyaltyPoints || 0}
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveCustomer}
                    className="text-red-600 hover:text-red-700"
                    title="Remove customer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-1 mb-1">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-500">CUSTOMER</span>
                </div>
                <p className="font-medium text-gray-700 mb-1">Walk-in Customer</p>
                <p className="text-xs text-gray-500 mb-2">No loyalty points</p>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="w-full bg-blue-600 text-white text-sm py-2 px-3 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Customer
                </button>
              </div>
            )}

            {/* Cart Items */}
            <div className="flex-1 overflow-auto mb-4 space-y-2">
              {cart.items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Cart is empty</p>
              ) : (
                cart.items.map((item) => (
                  <div key={item.productId} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-600">${parseFloat(item.price || 0).toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => dispatch(removeItem(item.productId))}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId: item.productId,
                                quantity: item.quantity - 1,
                              })
                            )
                          }
                          className="bg-white border border-gray-300 rounded p-1 hover:bg-gray-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId: item.productId,
                                quantity: item.quantity + 1,
                              })
                            )
                          }
                          className="bg-white border border-gray-300 rounded p-1 hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-bold text-gray-800">
                        ${(parseFloat(item.price || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Discounts and Points */}
            {cart.items.length > 0 && (
              <div className="space-y-2 mb-4 pb-4 border-t pt-4">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="Discount ($)"
                    className="input-field flex-1"
                    step="0.01"
                  />
                  <button onClick={handleApplyDiscount} className="btn-secondary">
                    Apply
                  </button>
                </div>
                {cart.customer && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={loyaltyPointsInput}
                      onChange={(e) => setLoyaltyPointsInput(e.target.value)}
                      placeholder="Loyalty Points"
                      className="input-field flex-1"
                      max={cart.customer.loyaltyPoints}
                    />
                    <button onClick={handleApplyLoyaltyPoints} className="btn-secondary">
                      Redeem
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (15%):</span>
                <span>${cart.tax.toFixed(2)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-${cart.discount.toFixed(2)}</span>
                </div>
              )}
              {cart.loyaltyPointsToRedeem > 0 && (
                <div className="flex justify-between text-primary-600">
                  <span>Points ({cart.loyaltyPointsToRedeem}):</span>
                  <span>-${(cart.loyaltyPointsToRedeem / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t">
                <span>Total:</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
              {cart.customer && (
                <div className="flex justify-between text-sm text-primary-600">
                  <span>Points to Earn:</span>
                  <span>{cart.loyaltyPointsToEarn} pts</span>
                </div>
              )}
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.items.length === 0}
              className="btn-primary w-full mt-4 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Checkout
            </button>
          </div>
        </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Add Customer</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter phone number"
                className="input-field"
                autoFocus
              />
              <button onClick={handleCustomerLookup} className="btn-primary w-full">
                Search Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-800 text-center">
                ${cart.total.toFixed(2)}
              </p>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                  paymentMethod === 'CASH'
                    ? 'border-primary-600 bg-primary-50 text-primary-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Cash</span>
              </button>
              <button
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                  paymentMethod === 'CARD'
                    ? 'border-primary-600 bg-primary-50 text-primary-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Card</span>
              </button>
              <button
                onClick={() => setPaymentMethod('MOBILE_MONEY')}
                className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                  paymentMethod === 'MOBILE_MONEY'
                    ? 'border-primary-600 bg-primary-50 text-primary-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span>Mobile</span>
              </button>
              <button
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-primary-600 bg-primary-50 text-primary-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span>Transfer</span>
              </button>
            </div>

            {/* Amount Paid */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Paid
                </label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  className="input-field text-2xl"
                  step="0.01"
                  autoFocus
                />
              </div>

              {amountPaid && parseFloat(amountPaid) >= cart.total && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-gray-600">Change:</p>
                  <p className="text-2xl font-bold text-green-600">${change.toFixed(2)}</p>
                </div>
              )}

              <button
                onClick={handleCompletePayment}
                disabled={processing || !amountPaid || parseFloat(amountPaid) < cart.total}
                className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Complete Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && lastTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Receipt className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
              <p className="text-gray-600">Transaction #{lastTransaction.transactionNumber}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold">${parseFloat(lastTransaction.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid:</span>
                <span className="font-bold">${parseFloat(lastTransaction.amountPaid || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Change:</span>
                <span className="font-bold">${parseFloat(lastTransaction.changeGiven || 0).toFixed(2)}</span>
              </div>
              {lastTransaction.loyaltyPointsEarned > 0 && (
                <div className="flex justify-between text-primary-600 pt-2 border-t">
                  <span>Points Earned:</span>
                  <span className="font-bold">{lastTransaction.loyaltyPointsEarned}</span>
                </div>
              )}
            </div>

            <button onClick={handleNewSale} className="btn-primary w-full py-3">
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSTill;