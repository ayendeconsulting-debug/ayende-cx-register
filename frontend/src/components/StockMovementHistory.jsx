import React, { useState, useEffect } from 'react';
import stockAdjustmentService from '../services/stockAdjustmentService';
import toast from 'react-hot-toast';

const StockMovementHistory = ({ isOpen, onClose, product }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20,
  });

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    movementType: '',
    performedBy: '',
  });

  // Load history
  const loadHistory = async (page = 1) => {
    if (!product?.id) return;

    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
      };

      // Add filters if set
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.movementType) params.movementType = filters.movementType;

      const response = await stockAdjustmentService.getStockMovementHistory(
        product.id,
        params
      );

      if (response.success) {
        setHistory(response.data.movements || []);
        setPagination({
          currentPage: response.data.currentPage || 1,
          totalPages: response.data.totalPages || 1,
          totalRecords: response.data.totalRecords || 0,
          limit: response.data.limit || 20,
        });
      }
    } catch (error) {
      console.error('Error loading stock history:', error);
      toast.error(error.response?.data?.message || 'Failed to load stock history');
    } finally {
      setLoading(false);
    }
  };

  // Load on open or filter change
  useEffect(() => {
    if (isOpen && product) {
      loadHistory(1);
    }
  }, [isOpen, product, filters]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadHistory(newPage);
    }
  };

  // Apply filters
  const handleApplyFilters = () => {
    loadHistory(1);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      movementType: '',
      performedBy: '',
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (history.length === 0) {
      toast.warning('No data to export');
      return;
    }

    // Create CSV content
    const headers = [
      'Date',
      'Movement Type',
      'Quantity Change',
      'Before',
      'After',
      'Unit Cost',
      'Total Value',
      'Reason',
      'Performed By',
      'Reference',
    ];

    const rows = history.map((movement) => [
      formatDate(movement.createdAt),
      movement.movementType,
      movement.quantityChange > 0 ? `+${movement.quantityChange}` : movement.quantityChange,
      movement.quantityBefore,
      movement.quantityAfter,
      movement.unitCost,
      movement.totalValue,
      movement.reason,
      movement.performer?.name || 'Unknown',
      movement.referenceId || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stock_history_${product.sku}_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('History exported successfully');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get movement type badge color
  const getMovementTypeBadge = (type) => {
    const badges = {
      ADJUSTMENT: 'bg-blue-100 text-blue-800',
      SALE: 'bg-purple-100 text-purple-800',
      PURCHASE: 'bg-green-100 text-green-800',
      TRANSFER: 'bg-yellow-100 text-yellow-800',
      RETURN: 'bg-orange-100 text-orange-800',
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Stock Movement History</h2>
            {product && (
              <p className="text-sm text-gray-300 mt-1">
                {product.name} (SKU: {product.sku}) - Current Stock: {product.stockQuantity || 0}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Movement Type
              </label>
              <select
                value={filters.movementType}
                onChange={(e) => setFilters({ ...filters, movementType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="ADJUSTMENT">Adjustment</option>
                <option value="SALE">Sale</option>
                <option value="PURCHASE">Purchase</option>
                <option value="TRANSFER">Transfer</option>
                <option value="RETURN">Return</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Apply
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Reset
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleExportCSV}
                disabled={history.length === 0}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
            </div>
          ) : history.length === 0 ? (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No movement history</h3>
              <p className="mt-1 text-sm text-gray-500">
                No stock movements found for this product.
              </p>
            </div>
          ) : (
            <>
              {/* History Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Change
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Before → After
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performed By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.map((movement) => (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(movement.createdAt)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMovementTypeBadge(movement.movementType)}`}>
                            {movement.movementType}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className={`text-sm font-semibold ${movement.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          {movement.quantityBefore} → {movement.quantityAfter}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {formatCurrency(movement.totalValue)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {movement.reason}
                          {movement.notes && (
                            <p className="text-xs text-gray-500 truncate" title={movement.notes}>
                              {movement.notes}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movement.performer?.name || 'System'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-700">
                    Showing page {pagination.currentPage} of {pagination.totalPages} 
                    ({pagination.totalRecords} total records)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
};

export default StockMovementHistory;
