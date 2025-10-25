import React, { useState, useEffect } from 'react';
import stockAdjustmentService from '../services/stockAdjustmentService';
import toast from 'react-hot-toast';

const StockAdjustmentForm = ({ product, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    adjustmentType: 'ADD',
    quantityChange: '',
    reason: '',
    customReason: '',
    notes: '',
  });

  const [preview, setPreview] = useState({
    quantityBefore: product?.stockQuantity || 0,
    quantityAfter: 0,
    unitCost: product?.costPrice || 0,
    totalValue: 0,
    requiresApproval: false,
    willBeNegative: false,
  });

  // Predefined reasons by adjustment type
  const reasons = {
    ADD: [
      'NEW_STOCK_RECEIVED',
      'SUPPLIER_RETURN_CREDIT',
      'FOUND_RECOVERED_ITEMS',
      'OTHER',
    ],
    REMOVE: [
      'DAMAGED_GOODS',
      'THEFT_SHRINKAGE',
      'EXPIRED_ITEMS',
      'CUSTOMER_RETURN_DEFECTIVE',
      'OTHER',
    ],
    ADJUST: [
      'PHYSICAL_COUNT_CORRECTION',
      'SYSTEM_ERROR_CORRECTION',
      'TRANSFER_CORRECTION',
      'OTHER',
    ],
  };

  // Format reason for display
  const formatReason = (reason) => {
    return reason.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Calculate preview whenever form changes
  useEffect(() => {
    if (!product || !formData.quantityChange) {
      setPreview({
        quantityBefore: product?.stockQuantity || 0,
        quantityAfter: product?.stockQuantity || 0,
        unitCost: product?.costPrice || 0,
        totalValue: 0,
        requiresApproval: false,
        willBeNegative: false,
      });
      return;
    }

    const quantityBefore = product.stockQuantity;
    const quantityChange = parseInt(formData.quantityChange) || 0;
    const unitCost = parseFloat(product.costPrice) || 0;

    let actualChange = quantityChange;
    if (formData.adjustmentType === 'REMOVE') {
      actualChange = -Math.abs(quantityChange);
    } else if (formData.adjustmentType === 'ADJUST') {
      // For ADJUST, quantity change can be positive or negative
      actualChange = quantityChange;
    }

    const quantityAfter = quantityBefore + actualChange;
    const totalValue = Math.abs(actualChange) * unitCost;

    // Check approval thresholds
    const requiresApproval =
      Math.abs(actualChange) > 100 || totalValue > 10000;

    // Check if stock will go negative
    const willBeNegative = quantityAfter < 0;

    setPreview({
      quantityBefore,
      quantityAfter,
      unitCost,
      totalValue,
      requiresApproval,
      willBeNegative,
    });
  }, [formData.quantityChange, formData.adjustmentType, product]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.quantityChange || formData.quantityChange === '0') {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (!formData.reason) {
      toast.error('Please select a reason');
      return;
    }

    if (formData.reason === 'OTHER' && !formData.customReason.trim()) {
      toast.error('Please provide a custom reason');
      return;
    }

    if (preview.willBeNegative) {
      toast.error('Cannot adjust stock below zero');
      return;
    }

    try {
      setLoading(true);

      // Prepare adjustment data
      const adjustmentData = {
        productId: product.id,
        adjustmentType: formData.adjustmentType,
        quantityChange:
          formData.adjustmentType === 'REMOVE'
            ? -Math.abs(parseInt(formData.quantityChange))
            : parseInt(formData.quantityChange),
        reason: formData.reason,
        customReason: formData.reason === 'OTHER' ? formData.customReason : undefined,
        notes: formData.notes || undefined,
      };

      const response = await stockAdjustmentService.createStockAdjustment(
        adjustmentData
      );

      if (response.success) {
        if (response.data.requiresApproval) {
          toast.success('Adjustment submitted for approval');
        } else {
          toast.success('Stock adjusted successfully');
        }
        
        if (onSuccess) {
          onSuccess(response.data);
        }
        onClose();
      }
    } catch (error) {
      console.error('Error creating adjustment:', error);
      toast.error(
        error.response?.data?.message || 'Failed to create adjustment'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Stock Adjustment
            </h2>
            <p className="text-sm text-gray-600">
              {product.name} (SKU: {product.sku})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Stock Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Current Stock</p>
                <p className="text-lg font-semibold text-gray-900">
                  {product.stockQuantity} units
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unit Cost</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${parseFloat(product.costPrice || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Adjustment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjustment Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['ADD', 'REMOVE', 'ADJUST'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, adjustmentType: type, reason: '' })
                  }
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                    formData.adjustmentType === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Change */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity {formData.adjustmentType === 'ADJUST' ? 'Change' : ''}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantityChange"
              value={formData.quantityChange}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={
                formData.adjustmentType === 'ADJUST'
                  ? 'Enter change (+ or -)'
                  : 'Enter quantity'
              }
              required
            />
            {formData.adjustmentType === 'ADJUST' && (
              <p className="text-xs text-gray-500 mt-1">
                Use positive numbers to add, negative numbers to remove
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a reason</option>
              {reasons[formData.adjustmentType].map((reason) => (
                <option key={reason} value={reason}>
                  {formatReason(reason)}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason */}
          {formData.reason === 'OTHER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Reason <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customReason"
                value={formData.customReason}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Specify the reason"
                required
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Add any additional information..."
            />
          </div>

          {/* Preview */}
          {formData.quantityChange && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">Preview</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Before:</span>
                  <span className="font-semibold text-blue-900">
                    {preview.quantityBefore} units
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">After:</span>
                  <span
                    className={`font-semibold ${
                      preview.willBeNegative
                        ? 'text-red-600'
                        : 'text-blue-900'
                    }`}
                  >
                    {preview.quantityAfter} units
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Total Value:</span>
                  <span className="font-semibold text-blue-900">
                    ${preview.totalValue.toFixed(2)}
                  </span>
                </div>
                {preview.requiresApproval && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-orange-800">
                          Approval Required
                        </p>
                        <p className="text-xs text-orange-700">
                          This adjustment exceeds thresholds and will require
                          SUPER_ADMIN approval before being applied.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {preview.willBeNegative && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-red-800">
                          Invalid Adjustment
                        </p>
                        <p className="text-xs text-red-700">
                          This adjustment would result in negative stock, which is
                          not allowed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || preview.willBeNegative || !formData.quantityChange}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Submit Adjustment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustmentForm;
