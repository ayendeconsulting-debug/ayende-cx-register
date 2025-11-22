import express from 'express';
import {
  getUsers,
  getUserById,
  toggleUserStatus,
  updateUserRole,
  deleteUser,
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all users (Admin only)
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), getUsers);

// Get single user (Admin only)
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN'), getUserById);

// Toggle user active status (Admin only)
router.patch('/:id/status', authorize('ADMIN', 'SUPER_ADMIN'), toggleUserStatus);

// Update user role (Admin only)
router.patch('/:id/role', authorize('ADMIN', 'SUPER_ADMIN'), updateUserRole);

// Delete (deactivate) user (Admin only)
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), deleteUser);

export default router;
