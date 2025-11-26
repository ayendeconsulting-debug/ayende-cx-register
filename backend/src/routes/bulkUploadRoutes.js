/**
 * Bulk Upload Routes
 * Handles CSV/Excel imports for products and customers
 */

import express from 'express';
import upload from '../middleware/uploadConfig.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  previewProductUpload,
  importProducts,
  previewCustomerUpload,
  importCustomers,
  getProductTemplate,
  getCustomerTemplate,
} from '../controllers/bulkUploadController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// PRODUCT BULK UPLOAD
// ============================================

// Preview product import (validate without saving)
router.post(
  '/products/preview',
  authorize('ADMIN', 'SUPER_ADMIN', 'INVENTORY_MANAGER'),
  upload.single('file'),
  previewProductUpload
);

// Import products
router.post(
  '/products/import',
  authorize('ADMIN', 'SUPER_ADMIN', 'INVENTORY_MANAGER'),
  upload.single('file'),
  importProducts
);

// Download product template
router.get(
  '/templates/products',
  getProductTemplate
);

// ============================================
// CUSTOMER BULK UPLOAD
// ============================================

// Preview customer import (validate without saving)
router.post(
  '/customers/preview',
  authorize('ADMIN', 'SUPER_ADMIN'),
  upload.single('file'),
  previewCustomerUpload
);

// Import customers
router.post(
  '/customers/import',
  authorize('ADMIN', 'SUPER_ADMIN'),
  upload.single('file'),
  importCustomers
);

// Download customer template
router.get(
  '/templates/customers',
  getCustomerTemplate
);

export default router;
