import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import toast from 'react-hot-toast';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  AlertCircle,
  X,
  Scan,
  TrendingUp,
  History,
} from 'lucide-react';
import QuickActions from '../components/QuickActions';
import StockAdjustmentForm from '../components/StockAdjustmentForm';
import StockMovementHistory from '../components/StockMovementHistory';

const Products = () => {
  const { user } = useSelector((state) => state.auth);

  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Stock adjustment state
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Category creation state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  });
  const [categoryErrors, setCategoryErrors] = useState({});
  
  // Category management state
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    price: '',
    costPrice: '',
    stockQuantity: '',
    lowStockAlert: '10',
    unit: 'unit',
    description: '',
    isTaxable: true,
    isActive: true,
  });

  // Load data
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAllProducts();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAllCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  // Category creation handlers
  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (categoryErrors[name]) {
      setCategoryErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    // Validate
    const errors = {};
    if (!categoryFormData.name.trim()) {
      errors.name = 'Category name is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setCategoryErrors(errors);
      return;
    }
    
    try {
      const response = await categoryService.createCategory(categoryFormData);
      if (response.success) {
        toast.success('Category created successfully');
        await loadCategories();
        
        // Select the newly created category
        setFormData(prev => ({ ...prev, categoryId: response.data.id }));
        
        // Close category form
        setShowCategoryForm(false);
        setCategoryFormData({ name: '', description: '' });
        setCategoryErrors({});
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.errors) {
        const serverErrors = {};
        const errorData = error.response.data.errors;
        
        if (Array.isArray(errorData)) {
          errorData.forEach(err => {
            serverErrors[err.field] = err.message;
          });
        } else if (typeof errorData === 'object') {
          Object.assign(serverErrors, errorData);
        }
        
        setCategoryErrors(serverErrors);
        toast.error(error.response.data.message || 'Failed to create category');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create category');
      }
    }
  };

  const cancelCategoryCreation = () => {
    setShowCategoryForm(false);
    setCategoryFormData({ name: '', description: '' });
    setCategoryErrors({});
  };

  // Category delete handler
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This cannot be undone if the category has no products.')) {
      return;
    }

    try {
      setDeletingCategory(categoryId);
      const response = await categoryService.deleteCategory(categoryId);
      
      if (response.success) {
        toast.success('Category deleted successfully');
        
        // Reload categories
        await loadCategories();
        
        // Clear selected category if it was deleted
        if (selectedCategory === categoryId) {
          setSelectedCategory('');
        }
        
        // Close category manager
        setShowCategoryManager(false);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Cannot delete category with existing products');
      } else {
        toast.error('Failed to delete category');
      }
    } finally {
      setDeletingCategory(null);
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Handle form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.name || !formData.sku || !formData.categoryId || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        lowStockAlert: parseInt(formData.lowStockAlert) || 10,
      };

      let response;
      if (editingProduct) {
        response = await productService.updateProduct(editingProduct.id, productData);
        toast.success('Product updated successfully');
      } else {
        response = await productService.createProduct(productData);
        toast.success('Product created successfully');
      }

      if (response.success) {
        loadProducts();
        closeModal();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      categoryId: product.categoryId,
      price: product.price.toString(),
      costPrice: product.costPrice?.toString() || '',
      stockQuantity: product.stockQuantity.toString(),
      lowStockAlert: product.lowStockAlert.toString(),
      unit: product.unit || 'unit',
      description: product.description || '',
      isTaxable: product.isTaxable,
      isActive: product.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await productService.deleteProduct(productId);
      if (response.success) {
        toast.success('Product deleted successfully');
        loadProducts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      categoryId: '',
      price: '',
      costPrice: '',
      stockQuantity: '',
      lowStockAlert: '10',
      unit: 'unit',
      description: '',
      isTaxable: true,
      isActive: true,
    });
  };

  const getLowStockProducts = () => {
    return products.filter((p) => p.stockQuantity <= p.lowStockAlert && p.isActive);
  };

  // Stock adjustment handlers
  const handleAdjustStock = (product) => {
    setSelectedProduct(product);
    setShowAdjustmentForm(true);
  };

  const handleViewHistory = (product) => {
    setSelectedProduct(product);
    setShowHistory(true);
  };

  const handleAdjustmentSuccess = () => {
    setShowAdjustmentForm(false);
    setSelectedProduct(null);
    loadProducts();
    toast.success('Stock adjustment created successfully');
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Products</h1>
            <p className="text-gray-600">Manage your product catalog and inventory</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCategoryManager(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <Filter className="w-5 h-5 mr-2" />
              Manage Categories
            </button>
            <button 
              onClick={() => {
                console.log('Opening modal');
                setShowModal(true);
              }} 
              className="btn-primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Product
            </button>
          </div>
        </div>

        {/* Low Stock Alert */}
        {getLowStockProducts().length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800">Low Stock Alert</p>
              <p className="text-yellow-700 text-sm">
                {getLowStockProducts().length} product(s) are running low on stock
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, SKU, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input pl-10 w-full"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end">
              <span className="text-gray-600">
                {filteredProducts.length} product(s)
              </span>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary-600"></div>
              <p className="mt-2 text-gray-600">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No products found</p>
              <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">Product</th>
                    <th className="text-left p-4 font-semibold text-gray-700">SKU / Barcode</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Category</th>
                    <th className="text-right p-4 font-semibold text-gray-700">Price</th>
                    <th className="text-center p-4 font-semibold text-gray-700">Stock</th>
                    <th className="text-center p-4 font-semibold text-gray-700">Status</th>
                    <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-800">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-gray-600 truncate max-w-xs">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-gray-800">{product.sku}</p>
                        {product.barcode && (
                          <p className="text-sm text-gray-600">{product.barcode}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-gray-800">
                          {categories.find((c) => c.id === product.categoryId)?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <p className="font-semibold text-gray-800">
                          ${parseFloat(product.price).toFixed(2)}
                        </p>
                        {product.costPrice && (
                          <p className="text-sm text-gray-600">
                            Cost: ${parseFloat(product.costPrice).toFixed(2)}
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            product.stockQuantity <= product.lowStockAlert
                              ? 'bg-red-100 text-red-800'
                              : product.stockQuantity <= product.lowStockAlert * 2
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {product.stockQuantity} {product.unit}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            product.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAdjustStock(product)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Adjust Stock"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewHistory(product)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="View History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {user?.role === 'SUPER_ADMIN' && (
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {console.log('Modal is rendering', { showModal, editingProduct })}
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  
                  {!showCategoryForm ? (
                    <div className="space-y-2">
                      <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        className="input w-full"
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowCategoryForm(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Create New Category
                      </button>
                    </div>
                  ) : (
                    <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 space-y-3">
                      <div>
                        <input
                          type="text"
                          name="name"
                          value={categoryFormData.name}
                          onChange={handleCategoryInputChange}
                          placeholder="Category name"
                          className={`input w-full text-sm ${
                            categoryErrors.name ? 'border-red-500' : ''
                          }`}
                        />
                        {categoryErrors.name && (
                          <p className="mt-1 text-xs text-red-500">{categoryErrors.name}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          name="description"
                          value={categoryFormData.description}
                          onChange={handleCategoryInputChange}
                          placeholder="Description (optional)"
                          className="input w-full text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={cancelCategoryCreation}
                          className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      className="input w-full"
                      placeholder="Scan or enter barcode"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => document.querySelector('input[name="barcode"]').focus()}
                      className="btn-secondary px-3"
                      title="Focus to scan"
                    >
                      <Scan className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Click scan icon, then use barcode scanner</p>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="input w-full"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Price
                  </label>
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    className="input w-full"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Inventory */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                    className="input w-full"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    name="lowStockAlert"
                    value={formData.lowStockAlert}
                    onChange={handleInputChange}
                    className="input w-full"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="input w-full"
                  >
                    <option value="unit">Unit</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="lb">Pound (lb)</option>
                    <option value="oz">Ounce (oz)</option>
                    <option value="l">Liter (l)</option>
                    <option value="ml">Milliliter (ml)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input w-full"
                  rows="3"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isTaxable"
                    checked={formData.isTaxable}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Taxable</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Manage Categories</h2>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {categories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Filter className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No categories yet</p>
                  <p className="text-sm">Create your first category to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => {
                    const productCount = products.filter(p => p.categoryId === category.id).length;
                    
                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {productCount} product{productCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={deletingCategory === category.id}
                          className={`ml-4 p-2 rounded-lg transition-colors ${
                            deletingCategory === category.id
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                          }`}
                          title={productCount > 0 ? 'Cannot delete category with products' : 'Delete category'}
                        >
                          {deletingCategory === category.id ? (
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowCategoryManager(false);
                  setShowCategoryForm(true);
                }}
                className="w-full btn-primary"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Category
              </button>
            </div>
          </div>
        </div>
      )}

      <QuickActions />
      
      </div>
  );
};

export default Products;