import { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Eye, 
  X,
  XCircle,
  Printer,
  Download,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  Package,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import transactionService from '../services/transactionService';
import QuickActions from '../components/QuickActions';


const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [voidingTransaction, setVoidingTransaction] = useState(false);

  const statusOptions = ['ALL', 'COMPLETED', 'VOIDED'];
  const paymentMethods = ['ALL', 'CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER'];
  
  const statusColors = {
    COMPLETED: 'bg-green-100 text-green-800',
    VOIDED: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    COMPLETED: <CheckCircle className="w-4 h-4" />,
    VOIDED: <XCircle className="w-4 h-4" />
  };

  const paymentMethodLabels = {
    CASH: 'Cash',
    CARD: 'Card',
    MOBILE_MONEY: 'Mobile Money',
    BANK_TRANSFER: 'Bank Transfer'
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactionsList();
  }, [searchTerm, filterStatus, filterPaymentMethod, dateFrom, dateTo, transactions]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getAllTransactions();
      setTransactions(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch transactions');
      console.error('Fetch transactions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactionsList = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(txn => 
        txn.transactionNumber?.toLowerCase().includes(term) ||
        txn.customer?.firstName?.toLowerCase().includes(term) ||
        txn.customer?.lastName?.toLowerCase().includes(term) ||
        txn.cashier?.username?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(txn => txn.status === filterStatus);
    }

    // Payment method filter
    if (filterPaymentMethod !== 'ALL') {
      filtered = filtered.filter(txn => {
        // Check if any payment detail matches the selected method
        return txn.paymentDetails?.some(pd => pd.paymentMethod === filterPaymentMethod);
      });
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(txn => new Date(txn.createdAt) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(txn => new Date(txn.createdAt) <= toDate);
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredTransactions(filtered);
  };

  const openDetailsModal = async (transaction) => {
    try {
      // Fetch full transaction details
      const response = await transactionService.getTransactionById(transaction.id);
      setSelectedTransaction(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to fetch transaction details');
      console.error('Fetch transaction details error:', error);
    }
  };

  const handleVoidTransaction = async (transactionId, transactionNumber) => {
    if (!window.confirm(`Are you sure you want to void transaction ${transactionNumber}? This action cannot be undone and will restore inventory.`)) {
      return;
    }

    try {
      setVoidingTransaction(true);
      await transactionService.voidTransaction(transactionId);
      toast.success('Transaction voided successfully');
      setShowDetailsModal(false);
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to void transaction');
      console.error('Void transaction error:', error);
    } finally {
      setVoidingTransaction(false);
    }
  };

  const handlePrintReceipt = (transaction) => {
    // Create a printable receipt
    const printWindow = window.open('', '_blank');
    const receiptHTML = generateReceiptHTML(transaction);
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const generateReceiptHTML = (transaction) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${transaction.transactionNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            max-width: 300px;
            margin: 20px auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            font-size: 20px;
          }
          .info {
            margin: 10px 0;
            font-size: 12px;
          }
          .items {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 10px 0;
            margin: 10px 0;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .totals {
            margin: 10px 0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          .total-row.grand {
            font-weight: bold;
            font-size: 14px;
            border-top: 2px solid #000;
            padding-top: 5px;
            margin-top: 5px;
          }
          .footer {
            text-align: center;
            border-top: 2px dashed #000;
            padding-top: 10px;
            margin-top: 10px;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>AYENDE-CX</h1>
          <p>Payment Register Receipt</p>
        </div>
        
        <div class="info">
          <div>Transaction: ${transaction.transactionNumber}</div>
          <div>Date: ${formatDateTime(transaction.createdAt)}</div>
          <div>Cashier: ${transaction.cashier?.username || 'N/A'}</div>
          ${transaction.customer ? `<div>Customer: ${transaction.customer.firstName} ${transaction.customer.lastName}</div>` : ''}
          ${transaction.customer?.phone ? `<div>Phone: ${transaction.customer.phone}</div>` : ''}
        </div>
        
        <div class="items">
          ${transaction.items?.map(item => `
            <div class="item">
              <span>${item.quantity}x ${item.product?.name || 'Unknown'}</span>
              <span>$${formatCurrency(item.price * item.quantity)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>$${formatCurrency(transaction.subtotal)}</span>
          </div>
          ${transaction.discount > 0 ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-$${formatCurrency(transaction.discount)}</span>
            </div>
          ` : ''}
          ${transaction.loyaltyPointsRedeemed > 0 ? `
            <div class="total-row">
              <span>Points Redeemed (${transaction.loyaltyPointsRedeemed}):</span>
              <span>-$${formatCurrency(transaction.loyaltyPointsRedeemed / 100)}</span>
            </div>
          ` : ''}
          <div class="total-row">
            <span>Tax:</span>
            <span>$${formatCurrency(transaction.tax)}</span>
          </div>
          <div class="total-row grand">
            <span>TOTAL:</span>
            <span>$${formatCurrency(transaction.total)}</span>
          </div>
        </div>
        
        <div class="info">
          <div>Payment: ${transaction.paymentDetails?.[0]?.paymentMethod || 'N/A'}</div>
          <div>Amount Paid: $${formatCurrency(transaction.amountPaid)}</div>
          ${transaction.changeGiven > 0 ? `<div>Change: $${formatCurrency(transaction.changeGiven)}</div>` : ''}
          ${transaction.loyaltyPointsEarned > 0 ? `<div>Points Earned: ${transaction.loyaltyPointsEarned}</div>` : ''}
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Visit us again soon</p>
        </div>
      </body>
      </html>
    `;
  };

  const exportToCSV = () => {
    const headers = ['Transaction Number', 'Date', 'Customer', 'Cashier', 'Items', 'Total', 'Payment Method', 'Status'];
    
    const csvData = filteredTransactions.map(txn => [
      txn.transactionNumber,
      formatDateTime(txn.createdAt),
      txn.customer ? `${txn.customer.firstName} ${txn.customer.lastName}` : 'Walk-in',
      txn.cashier?.username || 'N/A',
      txn.items?.length || 0,
      formatCurrency(txn.total),
      txn.paymentDetails?.[0]?.paymentMethod || 'N/A',
      txn.status
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Transactions exported successfully');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(parseFloat(amount) || 0);
  };

  const getTransactionStats = () => {
    const completed = transactions.filter(t => t.status === 'COMPLETED');
    const voided = transactions.filter(t => t.status === 'VOIDED');
    
    return {
      total: transactions.length,
      completed: completed.length,
      voided: voided.length,
      totalRevenue: completed.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0),
      averageTransaction: completed.length > 0 
        ? completed.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0) / completed.length 
        : 0
    };
  };

  const stats = getTransactionStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Receipt className="w-8 h-8" />
          Transaction History
        </h1>
        <p className="text-gray-600 mt-1">View and manage all sales transactions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <Receipt className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Voided</p>
              <p className="text-2xl font-bold text-red-600">{stats.voided}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">${formatCurrency(stats.totalRevenue)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Transaction</p>
              <p className="text-2xl font-bold text-gray-800">${formatCurrency(stats.averageTransaction)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by transaction number, customer, or cashier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All Status' : status}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {paymentMethods.map(method => (
                <option key={method} value={method}>
                  {method === 'ALL' ? 'All Methods' : paymentMethodLabels[method]}
                </option>
              ))}
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cashier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || filterStatus !== 'ALL' || filterPaymentMethod !== 'ALL' || dateFrom || dateTo
                      ? 'No transactions found matching your filters' 
                      : 'No transactions yet. Complete a sale in POS to see it here!'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-gray-400" />
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.transactionNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDateTime(transaction.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {transaction.customer 
                            ? `${transaction.customer.firstName} ${transaction.customer.lastName}`
                            : 'Walk-in'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.cashier?.username || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {transaction.items?.length || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${formatCurrency(transaction.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {transaction.paymentDetails?.[0]?.paymentMethod 
                            ? paymentMethodLabels[transaction.paymentDetails[0].paymentMethod]
                            : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${statusColors[transaction.status]}`}>
                        {statusIcons[transaction.status]}
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetailsModal(transaction)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(transaction)}
                          className="text-green-600 hover:text-green-900"
                          title="Print Receipt"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                        {transaction.status === 'COMPLETED' && (
                          <button
                            onClick={() => handleVoidTransaction(transaction.id, transaction.transactionNumber)}
                            className="text-red-600 hover:text-red-900"
                            title="Void Transaction"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Transaction Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Transaction Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">
                      {selectedTransaction.transactionNumber}
                    </h3>
                    <div className="text-blue-100">
                      {formatDateTime(selectedTransaction.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedTransaction.status === 'COMPLETED' 
                        ? 'bg-green-500' 
                        : 'bg-red-500'
                    } text-white`}>
                      {selectedTransaction.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer and Cashier Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">Customer</span>
                  </div>
                  {selectedTransaction.customer ? (
                    <>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedTransaction.customer.firstName} {selectedTransaction.customer.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{selectedTransaction.customer.phone}</p>
                    </>
                  ) : (
                    <p className="text-lg font-bold text-gray-900">Walk-in Customer</p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">Cashier</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedTransaction.cashier?.username || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedTransaction.cashier?.role || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Items ({selectedTransaction.items?.length || 0})
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Product</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Quantity</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Price</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedTransaction.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.product?.name || 'Unknown Product'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">${formatCurrency(item.price)}</td>
                          <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                            ${formatCurrency(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Transaction Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">${formatCurrency(selectedTransaction.subtotal)}</span>
                  </div>
                  {selectedTransaction.discount > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Discount:</span>
                      <span className="font-medium">-${formatCurrency(selectedTransaction.discount)}</span>
                    </div>
                  )}
                  {selectedTransaction.loyaltyPointsRedeemed > 0 && (
                    <div className="flex justify-between text-sm text-purple-600">
                      <span>Points Redeemed ({selectedTransaction.loyaltyPointsRedeemed}):</span>
                      <span className="font-medium">-${formatCurrency(selectedTransaction.loyaltyPointsRedeemed / 100)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium text-gray-900">${formatCurrency(selectedTransaction.tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span>${formatCurrency(selectedTransaction.total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium text-gray-900">
                      {selectedTransaction.paymentDetails?.[0]?.paymentMethod 
                        ? paymentMethodLabels[selectedTransaction.paymentDetails[0].paymentMethod]
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium text-gray-900">${formatCurrency(selectedTransaction.amountPaid)}</span>
                  </div>
                  {selectedTransaction.changeGiven > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Change Given:</span>
                      <span className="font-medium text-gray-900">${formatCurrency(selectedTransaction.changeGiven)}</span>
                    </div>
                  )}
                  {selectedTransaction.loyaltyPointsEarned > 0 && (
                    <div className="flex justify-between text-sm text-purple-600">
                      <span>Loyalty Points Earned:</span>
                      <span className="font-medium">{selectedTransaction.loyaltyPointsEarned}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => handlePrintReceipt(selectedTransaction)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                {selectedTransaction.status === 'COMPLETED' && (
                  <button
                    onClick={() => handleVoidTransaction(selectedTransaction.id, selectedTransaction.transactionNumber)}
                    disabled={voidingTransaction}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    {voidingTransaction ? 'Voiding...' : 'Void Transaction'}
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

      <QuickActions />
      
    </div>
  );
};

export default Transactions;