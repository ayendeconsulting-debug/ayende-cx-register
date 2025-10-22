import prisma from '../config/database.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generateUserPayload,
  verifyRefreshToken,
} from '../utils/auth.js';
import { successResponse, errorResponse, createdResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public (but should be restricted in production)
 */
export const register = asyncHandler(async (req, res) => {
  const { email, username, password, firstName, lastName, role } = req.body;

  // Check if user exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    return errorResponse(
      res,
      'User with this email or username already exists',
      400
    );
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      firstName,
      lastName,
      role: role || 'CASHIER',
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const payload = generateUserPayload(user);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return createdResponse(res, {
    user,
    accessToken,
    refreshToken,
  }, 'User registered successfully');
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return errorResponse(res, 'Invalid credentials', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    return errorResponse(res, 'Account is inactive. Please contact administrator.', 401);
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    return errorResponse(res, 'Invalid credentials', 401);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Generate tokens
  const payload = generateUserPayload(user);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
    },
  });

  return successResponse(res, {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    accessToken,
    refreshToken,
  }, 'Login successful');
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return errorResponse(res, 'Refresh token required', 400);
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return errorResponse(res, 'Invalid refresh token', 401);
  }

  // Generate new tokens
  const payload = generateUserPayload(user);
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  return successResponse(res, {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  }, 'Token refreshed successfully');
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  return successResponse(res, user, 'User retrieved successfully');
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (client should delete tokens)
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'LOGOUT',
      entityType: 'User',
      entityId: req.user.id,
    },
  });

  return successResponse(res, null, 'Logged out successfully');
});
