import express from 'express';
import { body } from 'express-validator';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  getTransactionByNumber,
  voidTransaction,
  getSalesSummary,
} from '../controllers/transactionController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createTransactionValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Transaction must have at least one item'),
  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required for each item'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Valid quantity is required for each item'),
  body('items.*.discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a positive number'),
  body('paymentMethod')
    .isIn(['CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'LOYALTY_POINTS', 'SPLIT'])
    .withMessage('Valid payment method is required'),
  body('amountPaid')
    .isFloat({ min: 0 })
    .withMessage('Valid payment amount is required'),
  body('customerId')
    .optional()
    .isString()
    .withMessage('Valid customer ID required'),
  body('discountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a positive number'),
  body('loyaltyPointsRedeemed')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Loyalty points must be a positive number'),
  body('shiftId')
    .optional()
    .isString()
    .withMessage('Valid shift ID required'),
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string'),
];

const voidTransactionValidation = [
  body('reason')
    .notEmpty()
    .withMessage('Void reason is required')
    .isString()
    .withMessage('Reason must be a string'),
];

// Routes

// Get sales summary (special route before :id)
router.get(
  '/reports/sales-summary',
  authorize('SUPER_ADMIN', 'ADMIN'),
  getSalesSummary
);

// Get all transactions
router.get('/', getTransactions);

// Get transaction by transaction number
router.get('/number/:transactionNumber', getTransactionByNumber);

// Get single transaction
router.get('/:id', getTransaction);

// Create transaction (CASHIER and above)
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'CASHIER'),
  createTransactionValidation,
  validate,
  createTransaction
);

// Void transaction (ADMIN only)
router.post(
  '/:id/void',
  authorize('SUPER_ADMIN', 'ADMIN'),
  voidTransactionValidation,
  validate,
  voidTransaction
);

export default router;
