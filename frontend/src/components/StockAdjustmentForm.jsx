import { useState, useEffect } from 'react';
import { useCurrency } from '../hooks/useCurrency';
import { X, AlertCircle, Plus, Minus, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import stockAdjustmentService from '../services/stockAdjustmentService';

const StockAdjustmentForm = ({ product, onClose, onSuccess }) => {
  const { formatCurrency } = useCurrency();
  const [formData, setFormData] = useState({
    productId: product?.id || '',
    adjustmentType: 'ADD',
    quantityChange: '',
    reason: '',
    customReason: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const adjustmentTypes = [
    { value: 'ADD', label: 'Add Stock', icon: Plus, color: 'green' },
    { value: 'REMOVE', label: 'Remove Stock', icon: Minus, color: 'red' },
    { value: 'ADJUST', label: 'Adjust Stock', icon: Edit, color: 'blue' },
  ];

  const reasons = {
    ADD: [
      { value: 'NEW_STOCK_RECEIVED', label: 'New Stock Received' },
      { value: 'SUPPLIER_RETURN_CREDIT', label: 'Supplier Return Credit' },
      { value: 'FOUND_ITEMS', label: 'Found/Recovered Items' },
      { value: 'OTHER', label: 'Other (specify)' },
    ],
    REMOVE: [
      { value: 'DAMAGED_GOODS', label: 'Damaged Goods' },
      { value: 'THEFT_SHRINKAGE', label: 'Theft/Shrinkage' },
      { value: 'EXPIRED_ITEMS', label: 'Expired Items' },
      { value: 'CUSTOMER_RETURN_DEFECTIVE', label: 'Customer Return (Defective)' },
      { value: 'OTHER', label: 'Other (specify)' },
    ],
    ADJUST: [
      { value: 'PHYSICAL_COUNT_CORRECTION', label: 'Physical Count Correction' },
      { value: 'SYSTEM_ERROR_CORRECTION', label: 'System Error Correction' },
      { value: 'TRANSFER_CORRECTION', label: 'Transfer Correction' },
      { value: 'OTHER', label: 'Other (specify)' },
    ],
  };

  // Calculate preview
  useEffect(() => {
    if (product && formData.quantityChange) {
      const change = parseInt(formData.quantityChange);
      if (!isNaN(change)) {
        const quantityBefore = product.stockQuantity;
        const quantityAfter = quantityBefore + change;
        const unitCost = parseFloat(product.costPrice || product.price);
        const totalValue = Math.abs(change) * unitCost;

        setPreview({
          quantityBefore,
          quantityAfter,
          unitCost,
          totalValue,
          requiresApproval: Math.abs(change) > 100 || totalValue > 10000,
        });
      }
    } else {
      setPreview(null);
    }
  }, [formData.quantityChange, product]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      adjustmentType: type,
      reason: '', // Reset reason when type changes
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.quantityChange || parseInt(formData.quantityChange) === 0) {
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

    // Check for negative stock
    if (preview && preview.quantityAfter < 0) {
      toast.error('This adjustment would result in negative stock');
      return;
    }

    setLoading(true);
    try {
      const response = await stockAdjustmentService.createStockAdjustment({
        productId: formData.productId,
        adjustmentType: formData.adjustmentType,
        quantityChange: parseInt(formData.quantityChange),
        reason: formData.reason,
        customReason: formData.customReason || null,
        notes: formData.notes || null,
      });

      if (response.success) {
        if (response.data.status === 'AUTO_APPROVED') {
          toast.success('Stock adjustment applied successfully!');
        } else if (response.data.status === 'PENDING') {
          toast.success('Stock adjustment submitted for approval');
        }
        onSuccess && onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error creating stock adjustment:', error);
      toast.error(error.response?.data?.message || 'Failed to create stock adjustment');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = adjustmentTypes.find((t) => t.value === formData.adjustmentType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Stock Adjustment</h3>
            <p className="text-sm text-gray-600 mt-1">
              {product?.name} ({product?.sku})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Stock */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">Current Stock:</span>
              <span className="text-2xl font-bold text-blue-900">
                {product?.stockQuantity} {product?.unit}
              </span>
            </div>
          </div>

          {/* Adjustment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Adjustment Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {adjustmentTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.adjustmentType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeChange(type.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? `border-${type.color}-500 bg-${type.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 mx-auto mb-2 ${
                        isSelected ? `text-${type.color}-600` : 'text-gray-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? `text-${type.color}-700` : 'text-gray-600'
                      }`}
                    >
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Change */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity Change *
            </label>
            <input
              type="number"
              name="quantityChange"
              value={formData.quantityChange}
              onChange={handleInputChange}
              placeholder={
                formData.adjustmentType === 'REMOVE'
                  ? 'Enter negative number or positive to remove'
                  : 'Enter quantity'
              }
              className="input-field"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.adjustmentType === 'ADD' && 'Enter positive number to add stock'}
              {formData.adjustmentType === 'REMOVE' && 'Enter positive number (will be subtracted)'}
              {formData.adjustmentType === 'ADJUST' && 'Enter positive or negative number'}
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason *
            </label>
            <select
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              className="input-field"
              required
              disabled={loading}
            >
              <option value="">Select a reason</option>
              {reasons[formData.adjustmentType].map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason (if OTHER selected) */}
          {formData.reason === 'OTHER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Reason *
              </label>
              <input
                type="text"
                name="customReason"
                value={formData.customReason}
                onChange={handleInputChange}
                placeholder="Please specify the reason"
                className="input-field"
                required
                disabled={loading}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional notes about this adjustment..."
              rows="3"
              className="input-field"
              disabled={loading}
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-800 mb-3">Preview</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Before:</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {preview.quantityBefore} {product?.unit}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">After:</span>
                  <p
                    className={`text-lg font-semibold ${
                      preview.quantityAfter < 0
                        ? 'text-red-600'
                        : preview.quantityAfter > preview.quantityBefore
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {preview.quantityAfter} {product?.unit}
                  </p>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unit Cost:</span>
                  <span className="font-medium">{formatCurrency(preview.unitCost.toFixed(2))}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-medium">{formatCurrency(preview.totalValue.toFixed(2))}</span>
                </div>
              </div>

              {preview.requiresApproval && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Approval Required</p>
                    <p className="mt-1">
                      This adjustment exceeds thresholds (100 units or $10,000) and will
                      require SUPER_ADMIN approval before being applied.
                    </p>
                  </div>
                </div>
              )}

              {preview.quantityAfter < 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Warning: Negative Stock</p>
                    <p className="mt-1">
                      This adjustment cannot be processed as it would result in negative
                      stock.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (preview && preview.quantityAfter < 0)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustmentForm;
