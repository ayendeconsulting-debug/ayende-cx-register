import express from 'express';
import { body } from 'express-validator';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
} from '../controllers/customerController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createCustomerValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date is required'),
  body('marketingOptIn').optional().isBoolean(),
];

const updateCustomerValidation = [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date is required'),
  body('marketingOptIn').optional().isBoolean(),
];

// Routes

// Search customers (before :id to avoid conflict)
router.get('/search/:term', searchCustomers);

// Get all customers
router.get('/', getCustomers);

// Get single customer
router.get('/:id', getCustomer);

// Create customer
router.post('/', createCustomerValidation, validate, createCustomer);

// Update customer
router.put('/:id', updateCustomerValidation, validate, updateCustomer);

// Delete customer (ADMIN only)
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteCustomer);

export default router;
