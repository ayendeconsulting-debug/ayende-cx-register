import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createRentalContract,
  getRentalContracts,
  getRentalContract,
  getOverdueRentals,
  getRentalSummary,
  processReturn,
  closeContract,
  cancelContract,
  updateOverdueStatus
} from '../controllers/rentalController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// RENTAL CONTRACT ROUTES
// ============================================

/**
 * @route   GET /api/v1/rentals/overdue
 * @desc    Get overdue rental contracts
 * @access  Private (ADMIN)
 * @note    Must be before /:id route to avoid conflict
 */
router.get('/overdue', authorize('ADMIN', 'SUPER_ADMIN'), getOverdueRentals);

/**
 * @route   GET /api/v1/rentals/reports/summary
 * @desc    Get rental reports summary
 * @access  Private (ADMIN)
 */
router.get('/reports/summary', authorize('ADMIN', 'SUPER_ADMIN'), getRentalSummary);

/**
 * @route   POST /api/v1/rentals/update-overdue
 * @desc    Manually trigger overdue status update
 * @access  Private (ADMIN)
 */
router.post('/update-overdue', authorize('ADMIN', 'SUPER_ADMIN'), updateOverdueStatus);

/**
 * @route   POST /api/v1/rentals
 * @desc    Create new rental contract
 * @access  Private (CASHIER, ADMIN)
 */
router.post('/', authorize('CASHIER', 'ADMIN', 'SUPER_ADMIN'), createRentalContract);

/**
 * @route   GET /api/v1/rentals
 * @desc    Get all rental contracts
 * @access  Private
 */
router.get('/', getRentalContracts);

/**
 * @route   GET /api/v1/rentals/:id
 * @desc    Get single rental contract
 * @access  Private
 */
router.get('/:id', getRentalContract);

/**
 * @route   POST /api/v1/rentals/:id/return
 * @desc    Process rental return
 * @access  Private (CASHIER, ADMIN)
 */
router.post('/:id/return', authorize('CASHIER', 'ADMIN', 'SUPER_ADMIN'), processReturn);

/**
 * @route   POST /api/v1/rentals/:id/close
 * @desc    Close rental contract (after all items returned)
 * @access  Private (ADMIN)
 */
router.post('/:id/close', authorize('ADMIN', 'SUPER_ADMIN'), closeContract);

/**
 * @route   POST /api/v1/rentals/:id/cancel
 * @desc    Cancel rental contract
 * @access  Private (ADMIN)
 */
router.post('/:id/cancel', authorize('ADMIN', 'SUPER_ADMIN'), cancelContract);

export default router;
