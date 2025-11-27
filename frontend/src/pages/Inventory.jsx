import React, { useState, useEffect } from 'react';
import StockAdjustmentForm from '../components/StockAdjustmentForm';
import StockMovementHistory from '../components/StockMovementHistory';
import toast from 'react-hot-toast';

// Note: You'll need to create a productService if you don't have one already
// For now, I'm assuming you have an API endpoint to fetch products
// Replace this with your actual product service import
const mockProductService = {
  getAllProducts: async (params) => {
    // This should be replaced with your actual API call
    // Example: return axios.get('/api/v1/products', { params });
    throw new Error('Please implement product service API call');
  },
};

const Inventory = () => {
  const { formatCurrency } = useCurrency();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20,
  });

  // Load products
  const loadProducts = async (page = 1) => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: pagination.limit,
        search: searchTerm,
        sortBy,
        sortOrder,
      };

      // Add filters
      if (categoryFilter) params.category = categoryFilter;
      if (stockStatusFilter) {
        if (stockStatusFilter === 'low') params.lowStock = true;
        if (stockStatusFilter === 'out') params.outOfStock = true;
      }

      // Replace with your actual product service call
      const response = await mockProductService.getAllProducts(params);
      
      if (response.success) {
        setProducts(response.data.products || []);
        setPagination({
          currentPage: response.data.currentPage || 1,
          totalPages: response.data.totalPages || 1,
          totalRecords: response.data.totalRecords || 0,
          limit: response.data.limit || 20,
        });
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products. Please implement product service.');
      
      // For demo purposes, using mock data
      setProducts([
        {
          id: '1',
          name: 'Sample Product A',
          sku: 'SKU001',
          stockQuantity: 150,
          stockAlertLevel: 20,
          unitCost: 25.00,
          lastAdjustment: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          category: 'Electronics',
        },
        {
          id: '2',
          name: 'Sample Product B',
          sku: 'SKU002',
          stockQuantity: 5,
          stockAlertLevel: 10,
          unitCost: 15.00,
          lastAdjustment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          category: 'Accessories',
        },
        {
          id: '3',
          name: 'Sample Product C',
          sku: 'SKU003',
          stockQuantity: 0,
          stockAlertLevel: 15,
          unitCost: 45.00,
          lastAdjustment: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          category: 'Electronics',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadProducts(1);
  }, [searchTerm, categoryFilter, stockStatusFilter, sortBy, sortOrder]);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle adjustment button click
  const handleAdjustStock = (product) => {
    setSelectedProduct(product);
    setShowAdjustmentForm(true);
  };

  // Handle view history button click
  const handleViewHistory = (product) => {
    setSelectedProduct(product);
    setShowHistory(true);
  };

  // Handle adjustment success
  const handleAdjustmentSuccess = () => {
    setShowAdjustmentForm(false);
    setSelectedProduct(null);
    loadProducts(pagination.currentPage);
    toast.success('Stock adjustment created successfully');
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadProducts(newPage);
    }
  };

  // Get stock status
  const getStockStatus = (product) => {
    if (product.stockQuantity === 0) {
      return { status: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-100' };
    }
    if (product.stockQuantity <= product.stockAlertLevel) {
      return { status: 'Low Stock', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    }
    return { status: 'In Stock', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your product stock and track inventory movements
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedProduct(null);
                setShowAdjustmentForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Adjustment
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Accessories">Accessories</option>
                <option value="Clothing">Clothing</option>
                <option value="Food">Food</option>
              </select>
            </div>
            <div>
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Adjustment
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => {
                      const stockStatus = getStockStatus(product);
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            {product.category && (
                              <div className="text-xs text-gray-500">{product.category}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                            {product.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-lg font-semibold text-gray-900">
                              {product.stockQuantity}
                            </span>
                            {product.stockAlertLevel && (
                              <div className="text-xs text-gray-500">
                                Alert: {product.stockAlertLevel}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color}`}>
                              {stockStatus.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {formatCurrency(product.unitCost)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(product.lastAdjustment)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleAdjustStock(product)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Adjust
                              </button>
                              <button
                                onClick={() => handleViewHistory(product)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                              >
                                History
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Showing page {pagination.currentPage} of {pagination.totalPages}
                    {' '}({pagination.totalRecords} total products)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stock Adjustment Form Modal */}
      {showAdjustmentForm && (
        <StockAdjustmentForm
          product={selectedProduct}
          onClose={() => {
            setShowAdjustmentForm(false);
            setSelectedProduct(null);
          }}
          onSuccess={handleAdjustmentSuccess}
        />
      )}

      {/* Stock Movement History Modal */}
      {showHistory && selectedProduct && (
        <StockMovementHistory
          isOpen={showHistory}
          onClose={() => {
            setShowHistory(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
        />
      )}
    </div>
  );
};

export default Inventory;
