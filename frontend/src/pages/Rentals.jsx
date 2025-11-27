import { useState, useEffect } from 'react';
import { useCurrency } from '../hooks/useCurrency';
import { 
  Package, 
  Search, 
  Plus, 
  Eye, 
  RotateCcw,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Filter,
  X,
  User,
  Phone,
  FileText,
  Truck,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import rentalService from '../services/rentalService';
import customerService from '../services/customerService';
import productService from '../services/productService';

const Rentals = () => {
  const { formatCurrency } = useCurrency();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [summary, setSummary] = useState(null);
  
  // Modal states
  const [showNewRentalModal, setShowNewRentalModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  
  // Form data for new rental
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [rentalForm, setRentalForm] = useState({
    customerId: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    depositAmount: 0,
    contactPhone: '',
    contactEmail: '',
    deliveryAddress: '',
    items: []
  });
  
  // Return form data
  const [returnForm, setReturnForm] = useState({
    items: [],
    returnNotes: '',
    damageNotes: '',
    depositReturned: 0
  });

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-blue-100 text-blue-800',
    OVERDUE: 'bg-red-100 text-red-800',
    PARTIALLY_RETURNED: 'bg-yellow-100 text-yellow-800',
    RETURNED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-purple-100 text-purple-800',
    CANCELLED: 'bg-gray-100 text-gray-600'
  };

  const statusIcons = {
    DRAFT: FileText,
    ACTIVE: Clock,
    OVERDUE: AlertTriangle,
    PARTIALLY_RETURNED: RotateCcw,
    RETURNED: CheckCircle,
    CLOSED: CheckCircle,
    CANCELLED: XCircle
  };

  useEffect(() => {
    fetchRentals();
    fetchSummary();
  }, [filterStatus]);

  useEffect(() => {
    fetchCustomers();
    fetchRentalProducts();
  }, []);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'ALL') {
        params.status = filterStatus;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = await rentalService.getAllRentals(params);
      setRentals(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch rentals');
      console.error('Fetch rentals error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await rentalService.getRentalSummary();
      setSummary(response.data);
    } catch (error) {
      console.error('Fetch summary error:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAllCustomers();
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Fetch customers error:', error);
    }
  };

  const fetchRentalProducts = async () => {
    try {
      const response = await productService.getAllProducts();
      // Filter only rental products
      const rentalProducts = (response.data || []).filter(p => p.isRental);
      setProducts(rentalProducts);
    } catch (error) {
      console.error('Fetch products error:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRentals();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = (expectedReturnDate) => {
    const today = new Date();
    const dueDate = new Date(expectedReturnDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // New Rental Modal Functions
  const openNewRentalModal = () => {
    setRentalForm({
      customerId: '',
      startDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: '',
      depositAmount: 0,
      contactPhone: '',
      contactEmail: '',
      deliveryAddress: '',
      items: []
    });
    setShowNewRentalModal(true);
  };

  const addItemToRental = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = rentalForm.items.find(i => i.productId === productId);
    if (existingItem) {
      toast.error('Product already added');
      return;
    }

    setRentalForm(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: product.id,
        productName: product.name,
        dailyRate: product.dailyRate || product.price,
        quantity: 1,
        maxQuantity: product.stockQuantity
      }]
    }));
  };

  const updateItemQuantity = (productId, quantity) => {
    setRentalForm(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.productId === productId 
          ? { ...item, quantity: Math.min(Math.max(1, quantity), item.maxQuantity) }
          : item
      )
    }));
  };

  const removeItemFromRental = (productId) => {
    setRentalForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }));
  };

  const calculateRentalTotal = () => {
    if (!rentalForm.startDate || !rentalForm.expectedReturnDate) return 0;
    
    const start = new Date(rentalForm.startDate);
    const end = new Date(rentalForm.expectedReturnDate);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    
    return rentalForm.items.reduce((total, item) => {
      return total + (Number(item.dailyRate) * item.quantity * days);
    }, 0);
  };

  const handleCreateRental = async (e) => {
    e.preventDefault();
    
    if (!rentalForm.customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (rentalForm.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    if (!rentalForm.expectedReturnDate) {
      toast.error('Please select expected return date');
      return;
    }

    try {
      const payload = {
        customerId: rentalForm.customerId,
        startDate: rentalForm.startDate,
        expectedReturnDate: rentalForm.expectedReturnDate,
        depositAmount: Number(rentalForm.depositAmount) || 0,
        contactPhone: rentalForm.contactPhone,
        contactEmail: rentalForm.contactEmail,
        deliveryAddress: rentalForm.deliveryAddress,
        items: rentalForm.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      await rentalService.createRental(payload);
      toast.success('Rental contract created successfully');
      setShowNewRentalModal(false);
      fetchRentals();
      fetchSummary();
      fetchRentalProducts(); // Refresh stock
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create rental');
    }
  };

  // Details Modal
  const openDetailsModal = async (rental) => {
    try {
      const response = await rentalService.getRentalById(rental.id);
      setSelectedRental(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to load rental details');
    }
  };

  // Return Modal Functions
  const openReturnModal = (rental) => {
    setSelectedRental(rental);
    setReturnForm({
      items: rental.items.map(item => ({
        itemId: item.id,
        productName: item.productName,
        quantity: item.quantity,
        returnedQuantity: item.quantity - item.returnedQuantity,
        damagedQuantity: 0,
        missingQuantity: 0,
        damageDescription: '',
        damageCharge: 0
      })),
      returnNotes: '',
      damageNotes: '',
      depositReturned: Number(rental.depositAmount) || 0
    });
    setShowReturnModal(true);
  };

  const updateReturnItem = (itemId, field, value) => {
    setReturnForm(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.itemId === itemId ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        items: returnForm.items.map(item => ({
          itemId: item.itemId,
          returnedQuantity: Number(item.returnedQuantity) || 0,
          damagedQuantity: Number(item.damagedQuantity) || 0,
          missingQuantity: Number(item.missingQuantity) || 0,
          damageDescription: item.damageDescription,
          damageCharge: Number(item.damageCharge) || 0
        })),
        returnNotes: returnForm.returnNotes,
        damageNotes: returnForm.damageNotes,
        depositReturned: Number(returnForm.depositReturned) || 0
      };

      await rentalService.processReturn(selectedRental.id, payload);
      toast.success('Return processed successfully');
      setShowReturnModal(false);
      fetchRentals();
      fetchSummary();
      fetchRentalProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process return');
    }
  };

  const handleCloseContract = async (rentalId) => {
    if (!confirm('Are you sure you want to close this contract?')) return;
    
    try {
      await rentalService.closeRental(rentalId);
      toast.success('Contract closed successfully');
      fetchRentals();
      fetchSummary();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to close contract');
    }
  };

  const handleCancelContract = async (rentalId) => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;
    
    try {
      await rentalService.cancelRental(rentalId, reason);
      toast.success('Contract cancelled successfully');
      fetchRentals();
      fetchSummary();
      fetchRentalProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel contract');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rental Management</h1>
          <p className="text-gray-600">Manage equipment rentals and contracts</p>
        </div>
        <button
          onClick={openNewRentalModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Rental
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Rentals</p>
                <p className="text-2xl font-bold text-gray-800">{summary.activeRentals?.count || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{summary.overdueCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Value</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.activeRentals?.value)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Deposits Held</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.activeRentals?.depositsHeld)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by contract #, customer name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="OVERDUE">Overdue</option>
              <option value="PARTIALLY_RETURNED">Partially Returned</option>
              <option value="RETURNED">Returned</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <button
            onClick={() => { fetchRentals(); fetchSummary(); }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Rentals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading rentals...</p>
          </div>
        ) : rentals.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No rental contracts found</p>
            <button
              onClick={openNewRentalModal}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create First Rental
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Contract #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Items</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Period</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Total</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rentals.map((rental) => {
                const StatusIcon = statusIcons[rental.status] || FileText;
                const daysUntilDue = getDaysUntilDue(rental.expectedReturnDate);
                
                return (
                  <tr key={rental.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-blue-600">
                        {rental.contractNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">
                          {rental.customer?.firstName} {rental.customer?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{rental.customer?.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">
                        {rental.items?.length || 0} item(s)
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p>{formatDate(rental.startDate)}</p>
                        <p className="text-gray-500">to {formatDate(rental.expectedReturnDate)}</p>
                        {rental.status === 'ACTIVE' && daysUntilDue <= 1 && daysUntilDue >= 0 && (
                          <span className="text-orange-600 text-xs font-medium">Due soon!</span>
                        )}
                        {rental.status === 'ACTIVE' && daysUntilDue < 0 && (
                          <span className="text-red-600 text-xs font-medium">{Math.abs(daysUntilDue)} days overdue</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{formatCurrency(rental.totalDue)}</p>
                        {Number(rental.balanceDue) > 0 && (
                          <p className="text-sm text-red-600">
                            Balance: {formatCurrency(rental.balanceDue)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[rental.status]}`}>
                        <StatusIcon className="w-3 h-3" />
                        {rental.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailsModal(rental)}
                          className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(rental.status === 'ACTIVE' || rental.status === 'OVERDUE' || rental.status === 'PARTIALLY_RETURNED') && (
                          <button
                            onClick={() => openReturnModal(rental)}
                            className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                            title="Process Return"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        {rental.status === 'RETURNED' && (
                          <button
                            onClick={() => handleCloseContract(rental.id)}
                            className="p-1 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded"
                            title="Close Contract"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {(rental.status === 'ACTIVE' || rental.status === 'DRAFT') && (
                          <button
                            onClick={() => handleCancelContract(rental.id)}
                            className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Cancel"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* New Rental Modal */}
      {showNewRentalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Create New Rental</h2>
                <button onClick={() => setShowNewRentalModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateRental} className="space-y-6">
                {/* Customer Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer *
                  </label>
                  <select
                    value={rentalForm.customerId}
                    onChange={(e) => {
                      const customer = customers.find(c => c.id === e.target.value);
                      setRentalForm(prev => ({
                        ...prev,
                        customerId: e.target.value,
                        contactPhone: customer?.phone || '',
                        contactEmail: customer?.email || ''
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={rentalForm.startDate}
                      onChange={(e) => setRentalForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Return Date *
                    </label>
                    <input
                      type="date"
                      value={rentalForm.expectedReturnDate}
                      onChange={(e) => setRentalForm(prev => ({ ...prev, expectedReturnDate: e.target.value }))}
                      min={rentalForm.startDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={rentalForm.contactPhone}
                      onChange={(e) => setRentalForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={rentalForm.contactEmail}
                      onChange={(e) => setRentalForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    value={rentalForm.deliveryAddress}
                    onChange={(e) => setRentalForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter delivery address if applicable"
                  />
                </div>

                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Add Rental Items *
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addItemToRental(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a product to add</option>
                    {products.filter(p => p.stockQuantity > 0).map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(product.dailyRate || product.price)}/day (Stock: {product.stockQuantity})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Items */}
                {rentalForm.items.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Product</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Qty</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Daily Rate</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Subtotal</th>
                          <th className="px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {rentalForm.items.map(item => {
                          const days = rentalForm.startDate && rentalForm.expectedReturnDate
                            ? Math.max(1, Math.ceil((new Date(rentalForm.expectedReturnDate) - new Date(rentalForm.startDate)) / (1000 * 60 * 60 * 24)))
                            : 1;
                          return (
                            <tr key={item.productId}>
                              <td className="px-4 py-2 font-medium">{item.productName}</td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value))}
                                  min="1"
                                  max={item.maxQuantity}
                                  className="w-20 px-2 py-1 border rounded text-center"
                                />
                              </td>
                              <td className="px-4 py-2 text-right">{formatCurrency(item.dailyRate)}</td>
                              <td className="px-4 py-2 text-right font-medium">
                                {formatCurrency(Number(item.dailyRate) * item.quantity * days)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeItemFromRental(item.productId)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="3" className="px-4 py-2 text-right font-medium">Total:</td>
                          <td className="px-4 py-2 text-right font-bold text-lg">{formatCurrency(calculateRentalTotal())}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Deposit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deposit Amount
                  </label>
                  <input
                    type="number"
                    value={rentalForm.depositAmount}
                    onChange={(e) => setRentalForm(prev => ({ ...prev, depositAmount: e.target.value }))}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowNewRentalModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Rental Contract
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRental && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Contract Details</h2>
                  <p className="text-gray-600 font-mono">{selectedRental.contractNumber}</p>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mb-6">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedRental.status]}`}>
                  {selectedRental.status.replace('_', ' ')}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" /> Customer
                </h3>
                <p className="font-medium">{selectedRental.customer?.firstName} {selectedRental.customer?.lastName}</p>
                <p className="text-sm text-gray-600">{selectedRental.customer?.phone}</p>
                <p className="text-sm text-gray-600">{selectedRental.customer?.email}</p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Start Date</p>
                  <p className="font-medium">{formatDate(selectedRental.startDate)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Expected Return</p>
                  <p className="font-medium">{formatDate(selectedRental.expectedReturnDate)}</p>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-800 mb-2">Rental Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Item</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Qty</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Returned</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedRental.items?.map(item => (
                        <tr key={item.id}>
                          <td className="px-4 py-2">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-gray-500">{formatCurrency(item.dailyRate)}/day</p>
                          </td>
                          <td className="px-4 py-2 text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-center">
                            {item.returnedQuantity || 0}
                            {item.damagedQuantity > 0 && (
                              <span className="text-red-600 text-xs block">({item.damagedQuantity} damaged)</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financials */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(selectedRental.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span>{formatCurrency(selectedRental.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deposit</span>
                    <span>{formatCurrency(selectedRental.depositAmount)}</span>
                  </div>
                  {Number(selectedRental.penaltyAmount) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Late Penalty</span>
                      <span>{formatCurrency(selectedRental.penaltyAmount)}</span>
                    </div>
                  )}
                  {Number(selectedRental.damageCharges) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Damage Charges</span>
                      <span>{formatCurrency(selectedRental.damageCharges)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total Due</span>
                    <span>{formatCurrency(selectedRental.totalDue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Paid</span>
                    <span>{formatCurrency(selectedRental.totalPaid)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-red-600">
                    <span>Balance Due</span>
                    <span>{formatCurrency(selectedRental.balanceDue)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                {(selectedRental.status === 'ACTIVE' || selectedRental.status === 'OVERDUE') && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      openReturnModal(selectedRental);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Process Return
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && selectedRental && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Process Return</h2>
                  <p className="text-gray-600">{selectedRental.contractNumber}</p>
                </div>
                <button onClick={() => setShowReturnModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleProcessReturn} className="space-y-6">
                {/* Items */}
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Return Items</h3>
                  <div className="space-y-4">
                    {returnForm.items.map(item => (
                      <div key={item.itemId} className="border rounded-lg p-4">
                        <p className="font-medium mb-3">{item.productName}</p>
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Returned (Good)</label>
                            <input
                              type="number"
                              value={item.returnedQuantity}
                              onChange={(e) => updateReturnItem(item.itemId, 'returnedQuantity', parseInt(e.target.value) || 0)}
                              min="0"
                              max={item.quantity}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Damaged</label>
                            <input
                              type="number"
                              value={item.damagedQuantity}
                              onChange={(e) => updateReturnItem(item.itemId, 'damagedQuantity', parseInt(e.target.value) || 0)}
                              min="0"
                              className="w-full px-2 py-1 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Missing</label>
                            <input
                              type="number"
                              value={item.missingQuantity}
                              onChange={(e) => updateReturnItem(item.itemId, 'missingQuantity', parseInt(e.target.value) || 0)}
                              min="0"
                              className="w-full px-2 py-1 border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Damage Charge</label>
                            <input
                              type="number"
                              value={item.damageCharge}
                              onChange={(e) => updateReturnItem(item.itemId, 'damageCharge', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-full px-2 py-1 border rounded"
                            />
                          </div>
                        </div>
                        {(item.damagedQuantity > 0 || item.missingQuantity > 0) && (
                          <div className="mt-2">
                            <input
                              type="text"
                              value={item.damageDescription}
                              onChange={(e) => updateReturnItem(item.itemId, 'damageDescription', e.target.value)}
                              placeholder="Describe damage/issue..."
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Return Notes</label>
                    <textarea
                      value={returnForm.returnNotes}
                      onChange={(e) => setReturnForm(prev => ({ ...prev, returnNotes: e.target.value }))}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="General notes about the return..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Damage Notes</label>
                    <textarea
                      value={returnForm.damageNotes}
                      onChange={(e) => setReturnForm(prev => ({ ...prev, damageNotes: e.target.value }))}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Details about any damages..."
                    />
                  </div>
                </div>

                {/* Deposit Return */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deposit to Return (Original: {formatCurrency(selectedRental.depositAmount)})
                  </label>
                  <input
                    type="number"
                    value={returnForm.depositReturned}
                    onChange={(e) => setReturnForm(prev => ({ ...prev, depositReturned: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    max={Number(selectedRental.depositAmount)}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Process Return
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rentals;
