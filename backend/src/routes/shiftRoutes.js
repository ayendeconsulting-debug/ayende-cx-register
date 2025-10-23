import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as shiftController from '../controllers/shiftController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/shifts/open
 * @desc    Open a new shift
 * @access  CASHIER, ADMIN, SUPER_ADMIN
 */
router.post(
  '/open',
  authorize('CASHIER', 'ADMIN', 'SUPER_ADMIN'),
  shiftController.openShift
);

/**
 * @route   GET /api/v1/shifts/current
 * @desc    Get current open shift for logged-in user
 * @access  CASHIER, ADMIN, SUPER_ADMIN
 */
router.get(
  '/current',
  authorize('CASHIER', 'ADMIN', 'SUPER_ADMIN'),
  shiftController.getCurrentShift
);

/**
 * @route   GET /api/v1/shifts
 * @desc    Get all shifts (ADMIN sees all, CASHIER sees own)
 * @access  CASHIER, ADMIN, SUPER_ADMIN
 */
router.get(
  '/',
  authorize('CASHIER', 'ADMIN', 'SUPER_ADMIN'),
  shiftController.getShifts
);

/**
 * @route   GET /api/v1/shifts/:id
 * @desc    Get shift by ID
 * @access  CASHIER (own only), ADMIN, SUPER_ADMIN
 */
router.get(
  '/:id',
  authorize('CASHIER', 'ADMIN', 'SUPER_ADMIN'),
  shiftController.getShift
);

/**
 * @route   POST /api/v1/shifts/:id/close
 * @desc    Close a shift
 * @access  CASHIER (own only), ADMIN, SUPER_ADMIN
 */
router.post(
  '/:id/close',
  authorize('CASHIER', 'ADMIN', 'SUPER_ADMIN'),
  shiftController.closeShift
);

/**
 * @route   GET /api/v1/shifts/:id/report
 * @desc    Get detailed shift report
 * @access  CASHIER (own only), ADMIN, SUPER_ADMIN
 */
router.get(
  '/:id/report',
  authorize('CASHIER', 'ADMIN', 'SUPER_ADMIN'),
  shiftController.getShiftReport
);

export default router;