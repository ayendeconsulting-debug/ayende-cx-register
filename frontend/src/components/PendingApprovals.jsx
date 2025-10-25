import React, { useState, useEffect } from 'react';
import stockAdjustmentService from '../services/stockAdjustmentService';
import toast from 'react-hot-toast';

const PendingApprovals = ({ isOpen, onClose, onApprovalComplete }) => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Load pending approvals
  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await stockAdjustmentService.getPendingApprovals();
      if (response.success) {
        setPendingApprovals(response.data);
      }
    } catch (error) {
      console.error('Error loading pending approvals:', error);
      toast.error(error.response?.data?.message || 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (isOpen) {
      loadPendingApprovals();
      const interval = setInterval(loadPendingApprovals, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Handle approve button click
  const handleApproveClick = (adjustment) => {
    setSelectedAdjustment(adjustment);
    setApprovalNotes('');
    setShowApproveModal(true);
  };

  // Handle reject button click
  const handleRejectClick = (adjustment) => {
    setSelectedAdjustment(adjustment);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  // Confirm approval
  const confirmApproval = async () => {
    if (!selectedAdjustment) return;

    try {
      setProcessing(true);
      const response = await stockAdjustmentService.approveStockAdjustment(
        selectedAdjustment.id,
        approvalNotes || undefined
      );

      if (response.success) {
        toast.success('Adjustment approved successfully');
        setShowApproveModal(false);
        setSelectedAdjustment(null);
        setApprovalNotes('');
        loadPendingApprovals();
        if (onApprovalComplete) onApprovalComplete();
      }
    } catch (error) {
      console.error('Error approving adjustment:', error);
      toast.error(error.response?.data?.message || 'Failed to approve adjustment');
    } finally {
      setProcessing(false);
    }
  };

  // Confirm rejection
  const confirmRejection = async () => {
    if (!selectedAdjustment || !rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      setProcessing(true);
      const response = await stockAdjustmentService.rejectStockAdjustment(
        selectedAdjustment.id,
        rejectionReason
      );

      if (response.success) {
        toast.success('Adjustment rejected successfully');
        setShowRejectModal(false);
        setSelectedAdjustment(null);
        setRejectionReason('');
        loadPendingApprovals();
        if (onApprovalComplete) onApprovalComplete();
      }
    } catch (error) {
      console.error('Error rejecting adjustment:', error);
      toast.error(error.response?.data?.message || 'Failed to reject adjustment');
    } finally {
      setProcessing(false);
    }
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

  // Get adjustment type badge color
  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'ADD':
        return 'bg-green-100 text-green-800';
      case 'REMOVE':
        return 'bg-red-100 text-red-800';
      case 'ADJUST':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Pending Approvals ({pendingApprovals.length})
            </h2>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
              </div>
            ) : pendingApprovals.length === 0 ? (
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
                <p className="mt-1 text-sm text-gray-500">
                  All stock adjustments have been processed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((adjustment) => (
                  <div
                    key={adjustment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Product Info */}
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {adjustment.product?.name || 'Unknown Product'}
                          </h3>
                          <span className="text-sm text-gray-500">
                            SKU: {adjustment.product?.sku || 'N/A'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(adjustment.adjustmentType)}`}>
                            {adjustment.adjustmentType}
                          </span>
                        </div>

                        {/* Adjustment Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500">Quantity Change</p>
                            <p className={`text-lg font-semibold ${adjustment.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {adjustment.quantityChange > 0 ? '+' : ''}{adjustment.quantityChange} units
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Before → After</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {adjustment.quantityBefore} → {adjustment.quantityAfter}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Value</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {formatCurrency(adjustment.totalValue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Unit Cost</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {formatCurrency(adjustment.unitCost)}
                            </p>
                          </div>
                        </div>

                        {/* Reason & Notes */}
                        <div className="mb-3">
                          <p className="text-xs text-gray-500">Reason</p>
                          <p className="text-sm text-gray-900">
                            {adjustment.reason.replace(/_/g, ' ')}
                            {adjustment.customReason && ` - ${adjustment.customReason}`}
                          </p>
                          {adjustment.notes && (
                            <p className="text-sm text-gray-600 mt-1 italic">
                              "{adjustment.notes}"
                            </p>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Created by: {adjustment.creator?.name || 'Unknown'}</span>
                          <span>•</span>
                          <span>{formatDate(adjustment.createdAt)}</span>
                          <span>•</span>
                          <span className="font-mono">{adjustment.adjustmentNumber}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApproveClick(adjustment)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectClick(adjustment)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedAdjustment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg">
              <h3 className="text-lg font-semibold">Approve Adjustment</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to approve this stock adjustment?
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm font-medium text-gray-900">
                  {selectedAdjustment.product?.name}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedAdjustment.adjustmentType} {Math.abs(selectedAdjustment.quantityChange)} units
                </p>
                <p className="text-sm text-gray-600">
                  Value: {formatCurrency(selectedAdjustment.totalValue)}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Notes (Optional)
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={confirmApproval}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Confirm Approval'}
                </button>
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedAdjustment(null);
                    setApprovalNotes('');
                  }}
                  disabled={processing}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedAdjustment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="bg-red-600 text-white px-6 py-4 rounded-t-lg">
              <h3 className="text-lg font-semibold">Reject Adjustment</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Please provide a reason for rejecting this stock adjustment.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm font-medium text-gray-900">
                  {selectedAdjustment.product?.name}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedAdjustment.adjustmentType} {Math.abs(selectedAdjustment.quantityChange)} units
                </p>
                <p className="text-sm text-gray-600">
                  Value: {formatCurrency(selectedAdjustment.totalValue)}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this adjustment is being rejected..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={confirmRejection}
                  disabled={processing || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedAdjustment(null);
                    setRejectionReason('');
                  }}
                  disabled={processing}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PendingApprovals;
