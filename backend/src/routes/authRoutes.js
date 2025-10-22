import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  refreshAccessToken,
  getCurrentUser,
  logout,
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

// Routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/refresh', refreshValidation, validate, refreshAccessToken);
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

export default router;
