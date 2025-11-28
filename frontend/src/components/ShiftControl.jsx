import { useState, useEffect } from 'react';
import { useCurrency } from '../hooks/useCurrency';
import { useSelector } from 'react-redux';
import { 
  DollarSign, 
  Clock, 
  LogIn, 
  LogOut, 
  X, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import shiftService from '../services/shiftService';

const ShiftControl = () => {
  const { formatCurrency } = useCurrency();
  const { user } = useSelector((state) => state.auth);
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Fetch current shift on mount
  useEffect(() => {
    fetchCurrentShift();
  }, []);

  const fetchCurrentShift = async () => {
    try {
      setLoading(true);
      const response = await shiftService.getCurrentShift();
      if (response.success && response.data) {
        setCurrentShift(response.data);
      } else {
        setCurrentShift(null);
      }
    } catch (error) {
      console.error('Error fetching current shift:', error);
      setCurrentShift(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async () => {
    if (!openingCash || parseFloat(openingCash) < 0) {
      toast.error('Please enter a valid opening cash amount');
      return;
    }

    setProcessing(true);
    try {
      const response = await shiftService.openShift({
        openingCash: parseFloat(openingCash),
        notes: notes || null,
      });

      if (response.success) {
        setCurrentShift(response.data);
        toast.success('Shift opened successfully!');
        setShowOpenModal(false);
        setOpeningCash('');
        setNotes('');
      }
    } catch (error) {
      console.error('Error opening shift:', error);
      toast.error(error.response?.data?.message || 'Failed to open shift');
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseShift = async () => {
    if (!closingCash || parseFloat(closingCash) < 0) {
      toast.error('Please enter a valid closing cash amount');
      return;
    }

    setProcessing(true);
    try {
      const response = await shiftService.closeShift(currentShift.id, {
        closingCash: parseFloat(closingCash),
        notes: notes || null,
      });

      if (response.success) {
        const variance = response.data.variance;
        if (variance === 0) {
          toast.success('Shift closed successfully! Cash balanced perfectly.');
        } else if (variance > 0) {
          toast.success(`Shift closed! Cash over by ${formatCurrency(Math.abs(variance))}`);
        } else {
          toast.error(`Shift closed! Cash short by ${formatCurrency(Math.abs(variance))}`);
        }
        
        setCurrentShift(null);
        setShowCloseModal(false);
        setClosingCash('');
        setNotes('');
      }
    } catch (error) {
      console.error('Error closing shift:', error);
      toast.error(error.response?.data?.message || 'Failed to close shift');
    } finally {
      setProcessing(false);
    }
  };

  // Only show for CASHIER, ADMIN, SUPER_ADMIN
  if (!user || user.role === 'INVENTORY_MANAGER') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow">
        {currentShift ? (
          // Shift is open
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Shift Active
                </p>
                <p className="text-xs text-gray-600">
                  {currentShift.shiftNumber} • Started {new Date(currentShift.openedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCloseModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Close Shift
            </button>
          </div>
        ) : (
          // No shift open
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  No Active Shift
                </p>
                <p className="text-xs text-gray-600">
                  Open a shift to start processing transactions
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowOpenModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <LogIn className="w-4 h-4" />
              Open Shift
            </button>
          </div>
        )}
      </div>

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <LogIn className="w-6 h-6 text-green-600" />
                Open Shift
              </h3>
              <button
                onClick={() => setShowOpenModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opening Cash Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={openingCash}
                    onChange={(e) => setOpeningCash(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="input-field pl-10"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Count the cash in the drawer before starting
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes about this shift..."
                  rows="3"
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowOpenModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleOpenShift}
                  disabled={processing || !openingCash}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Opening...' : 'Open Shift'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && currentShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <LogOut className="w-6 h-6 text-red-600" />
                Close Shift
              </h3>
              <button
                onClick={() => setShowCloseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Shift Information</p>
                  <p>Shift: {currentShift.shiftNumber}</p>
                  <p>Opening Cash: {formatCurrency(parseFloat(currentShift.openingCash))}</p>
                  <p>Transactions: {currentShift._count?.transactions || 0}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closing Cash Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="input-field pl-10"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Count all cash in the drawer
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closing Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes about closing..."
                  rows="3"
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseShift}
                  disabled={processing || !closingCash}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Closing...' : 'Close Shift'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShiftControl;
