import express from 'express';
import {
  getBusinessSettings,
  updateBusinessTheme,
  updateBusinessInfo,
  updateTaxSettings,
} from '../controllers/businessSettingsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get business settings (all authenticated users can view)
router.get('/', getBusinessSettings);

// Update business theme (Admin only)
router.patch('/theme', authorize('ADMIN', 'SUPER_ADMIN'), updateBusinessTheme);

// Update business information (Admin only)
router.patch('/info', authorize('ADMIN', 'SUPER_ADMIN'), updateBusinessInfo);

// Update tax settings (Admin only)
router.patch('/tax', authorize('ADMIN', 'SUPER_ADMIN'), updateTaxSettings);

export default router;