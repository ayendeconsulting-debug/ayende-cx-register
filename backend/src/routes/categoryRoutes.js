import express from 'express';
import { body } from 'express-validator';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '../controllers/categoryController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createCategoryValidation = [
  body('name').notEmpty().withMessage('Category name is required'),
  body('description').optional().isString(),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Valid sort order required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

const updateCategoryValidation = [
  body('name').optional().notEmpty().withMessage('Category name cannot be empty'),
  body('description').optional().isString(),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Valid sort order required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

const reorderValidation = [
  body().isArray().withMessage('Request body must be an array'),
  body('*.id').notEmpty().withMessage('Category ID is required'),
  body('*.sortOrder').isInt({ min: 0 }).withMessage('Valid sort order is required'),
];

// Routes

// Get all categories
router.get('/', getCategories);

// Get single category
router.get('/:id', getCategory);

// Create category (ADMIN only)
router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createCategoryValidation, validate, createCategory);

// Update category (ADMIN only)
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateCategoryValidation, validate, updateCategory);

// Delete category (ADMIN only)
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteCategory);

// Reorder categories (ADMIN only)
router.post('/reorder', authorize('SUPER_ADMIN', 'ADMIN'), reorderValidation, validate, reorderCategories);

export default router;
