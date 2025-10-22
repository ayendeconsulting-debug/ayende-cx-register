import express from 'express';
import { body, query } from 'express-validator';
import {
  getProducts,
  getProduct,
  getProductBySku,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getLowStockProducts,
  getStockHistory,
} from '../controllers/productController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createProductValidation = [
  body('sku').notEmpty().withMessage('SKU is required'),
  body('name').notEmpty().withMessage('Product name is required'),
  body('categoryId').notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('costPrice').optional().isFloat({ min: 0 }).withMessage('Valid cost price required'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Valid stock quantity required'),
  body('lowStockAlert').optional().isInt({ min: 0 }).withMessage('Valid low stock alert required'),
  body('isTaxable').optional().isBoolean().withMessage('isTaxable must be boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

const updateProductValidation = [
  body('sku').optional().notEmpty().withMessage('SKU cannot be empty'),
  body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('categoryId').optional().notEmpty().withMessage('Category cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('costPrice').optional().isFloat({ min: 0 }).withMessage('Valid cost price required'),
  body('lowStockAlert').optional().isInt({ min: 0 }).withMessage('Valid low stock alert required'),
  body('isTaxable').optional().isBoolean().withMessage('isTaxable must be boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
];

const adjustStockValidation = [
  body('quantity').isInt({ min: 1 }).withMessage('Valid quantity is required'),
  body('movementType')
    .isIn(['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'TRANSFER'])
    .withMessage('Valid movement type is required'),
  body('reference').optional().isString(),
  body('notes').optional().isString(),
];

// Routes

// Get low stock products (special route - before :id to avoid conflict)
router.get('/alerts/low-stock', authorize('SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'), getLowStockProducts);

// Get all products
router.get('/', getProducts);

// Get product by SKU
router.get('/sku/:sku', getProductBySku);

// Get product by barcode
router.get('/barcode/:barcode', getProductByBarcode);

// Get single product
router.get('/:id', getProduct);

// Get stock history
router.get('/:id/stock-history', authorize('SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'), getStockHistory);

// Create product (ADMIN, INVENTORY_MANAGER)
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'),
  createProductValidation,
  validate,
  createProduct
);

// Update product (ADMIN, INVENTORY_MANAGER)
router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'),
  updateProductValidation,
  validate,
  updateProduct
);

// Adjust stock (ADMIN, INVENTORY_MANAGER)
router.post(
  '/:id/adjust-stock',
  authorize('SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'),
  adjustStockValidation,
  validate,
  adjustStock
);

// Delete product (ADMIN only)
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteProduct);

export default router;
