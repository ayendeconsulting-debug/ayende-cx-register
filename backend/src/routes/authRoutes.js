import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  refreshAccessToken,
  getCurrentUser,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
];

const loginValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const refreshValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

// Public Routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/refresh', refreshValidation, validate, refreshAccessToken);

// Password Reset Routes (Public)
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);

// Protected Routes
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);
router.post('/change-password', authenticate, changePasswordValidation, validate, changePassword);

export default router;
