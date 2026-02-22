import prisma from '../config/database.js';
import crypto from 'crypto';
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
import { sendPasswordResetEmail } from '../services/emailService.js';

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public (but should be restricted in production)
 */
export const register = asyncHandler(async (req, res) => {
  const { email, username, password, firstName, lastName, role, businessId } = req.body;

  // businessId is required for multi-tenant
  if (!businessId) {
    return errorResponse(res, 'Business ID is required', 400);
  }

  // Verify business exists and is active
  const business = await prisma.business.findUnique({
    where: { id: businessId }
  });

  if (!business || !business.isActive) {
    return errorResponse(res, 'Invalid or inactive business', 400);
  }

  // Check if user exists in this business
  const existingUser = await prisma.user.findFirst({
    where: {
      businessId,
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    return errorResponse(
      res,
      'User with this email or username already exists in this business',
      400
    );
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      businessId,
      email,
      username,
      passwordHash,
      firstName,
      lastName,
      role: role || 'CASHIER',
    },
    select: {
      id: true,
      businessId: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const payload = {
    ...generateUserPayload(user),
    businessId: user.businessId
  };
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
 * @desc    Login user (REQUIRES format: "username.subdomain")
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return errorResponse(res, 'Username and password are required', 400);
  }

  // ENFORCE username.subdomain format
  if (!username.includes('.')) {
    return errorResponse(
      res, 
      'Invalid login format. Please use: username.subdomain (e.g., admin.bashevents)', 
      400
    );
  }

  // Parse username.subdomain format
  const dotIndex = username.indexOf('.');
  const actualUsername = username.substring(0, dotIndex);
  const subdomain = username.substring(dotIndex + 1);

  // Validate parsed values
  if (!actualUsername || !subdomain) {
    return errorResponse(
      res,
      'Invalid login format. Please use: username.subdomain (e.g., admin.bashevents)',
      400
    );
  }

  console.log('[LOGIN] Attempting:', { username: actualUsername, subdomain });

  // Find business by subdomain
  const business = await prisma.business.findUnique({
    where: { subdomain: subdomain.toLowerCase() }
  });

  if (!business) {
    console.log('[LOGIN FAILED] Business not found for subdomain:', subdomain);
    return errorResponse(res, 'Invalid credentials', 401);
  }

  if (!business.isActive) {
    console.log('[LOGIN FAILED] Business inactive:', subdomain);
    return errorResponse(res, 'Business account is inactive. Please contact support.', 401);
  }

  console.log('[LOGIN] Business found:', business.businessName);

  // Find user in this specific business
  const user = await prisma.user.findFirst({
    where: {
      username: actualUsername,
      businessId: business.id,
      isActive: true
    },
    include: {
      business: true
    }
  });

  if (!user) {
    console.log('[LOGIN FAILED] User not found:', actualUsername, 'in business:', business.businessName);
    return errorResponse(res, 'Invalid credentials', 401);
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    console.log('[LOGIN FAILED] Invalid password for:', actualUsername);
    return errorResponse(res, 'Invalid credentials', 401);
  }

  console.log('[LOGIN SUCCESS]', `${user.username} logged into ${user.business.businessName}`);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Generate tokens with businessId
  const payload = {
    ...generateUserPayload(user),
    businessId: user.businessId
  };
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
      businessId: user.businessId,
    },
    business: {
      id: user.business.id,
      name: user.business.businessName,
      subdomain: user.business.subdomain,
      // Currency settings
      currency: user.business.currency,
      currencyCode: user.business.currencyCode,
      currencyPosition: user.business.currencyPosition || 'before',
      decimalSeparator: user.business.decimalSeparator || '.',
      thousandsSeparator: user.business.thousandsSeparator || ',',
      decimalPlaces: user.business.decimalPlaces ?? 2,
      // Tax settings
      taxRate: user.business.taxRate,
      taxLabel: user.business.taxLabel,
      taxEnabled: user.business.taxEnabled,
      // Theme settings
      primaryColor: user.business.primaryColor,
      secondaryColor: user.business.secondaryColor,
      logoUrl: user.business.logoUrl,
      // Feature flags
      rentalEnabled: user.business.rentalEnabled,
      loyaltyEnabled: user.business.loyaltyEnabled,
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

  // Get user with business
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    include: {
      business: true
    }
  });

  if (!user || !user.isActive) {
    return errorResponse(res, 'Invalid refresh token', 401);
  }

  // Generate new tokens
  const payload = {
    ...generateUserPayload(user),
    businessId: user.businessId
  };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  return successResponse(res, {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    // Include updated business settings on token refresh
    business: {
      id: user.business.id,
      name: user.business.businessName,
      subdomain: user.business.subdomain,
      currency: user.business.currency,
      currencyCode: user.business.currencyCode,
      currencyPosition: user.business.currencyPosition || 'before',
      decimalSeparator: user.business.decimalSeparator || '.',
      thousandsSeparator: user.business.thousandsSeparator || ',',
      decimalPlaces: user.business.decimalPlaces ?? 2,
      taxRate: user.business.taxRate,
      taxLabel: user.business.taxLabel,
      taxEnabled: user.business.taxEnabled,
      primaryColor: user.business.primaryColor,
      secondaryColor: user.business.secondaryColor,
      logoUrl: user.business.logoUrl,
      rentalEnabled: user.business.rentalEnabled,
      loyaltyEnabled: user.business.loyaltyEnabled,
    },
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
      businessId: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      business: {
        select: {
          id: true,
          businessName: true,
          subdomain: true,
          currency: true,
          currencyCode: true,
          currencyPosition: true,
          decimalSeparator: true,
          thousandsSeparator: true,
          decimalPlaces: true,
          taxRate: true,
          taxLabel: true,
          taxEnabled: true,
          timezone: true,
          primaryColor: true,
          secondaryColor: true,
          logoUrl: true,
          rentalEnabled: true,
          loyaltyEnabled: true,
        }
      }
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

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email, subdomain } = req.body;

  if (!email) {
    return errorResponse(res, 'Email is required', 400);
  }

  // Build query - if subdomain provided, find user in that business
  let whereClause = { email };
  
  if (subdomain) {
    const business = await prisma.business.findUnique({
      where: { subdomain }
    });

    if (!business) {
      // Don't reveal if business exists or not for security
      return successResponse(res, null, 'If an account exists with this email, a password reset link has been sent.');
    }

    whereClause = {
      email,
      businessId: business.id
    };
  }

  // Find user
  const user = await prisma.user.findFirst({
    where: whereClause,
    include: {
      business: true
    }
  });

  // Always return success to prevent email enumeration
  if (!user) {
    console.log('[PASSWORD RESET] User not found:', email);
    return successResponse(res, null, 'If an account exists with this email, a password reset link has been sent.');
  }

  if (!user.isActive) {
    console.log('[PASSWORD RESET] User inactive:', email);
    return successResponse(res, null, 'If an account exists with this email, a password reset link has been sent.');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Save token to database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: resetExpires,
    },
  });

  // Build reset URL
  const frontendUrl = process.env.FRONTEND_URL || 'https://pos-app.ayendecx.com';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  // Send email
  try {
    await sendPasswordResetEmail({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      businessName: user.business.businessName,
      resetUrl,
      expiresIn: '1 hour',
    });

    console.log('[PASSWORD RESET] Email sent to:', email);
  } catch (error) {
    console.error('[PASSWORD RESET] Failed to send email:', error);
    // Clear token if email fails
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
    return errorResponse(res, 'Failed to send password reset email. Please try again.', 500);
  }

  return successResponse(res, null, 'If an account exists with this email, a password reset link has been sent.');
});

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, email, newPassword } = req.body;

  if (!token || !email || !newPassword) {
    return errorResponse(res, 'Token, email, and new password are required', 400);
  }

  if (newPassword.length < 6) {
    return errorResponse(res, 'Password must be at least 6 characters', 400);
  }

  // Hash the token to compare with database
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid token
  const user = await prisma.user.findFirst({
    where: {
      email,
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        gt: new Date(), // Token not expired
      },
    },
  });

  if (!user) {
    console.log('[PASSWORD RESET] Invalid or expired token for:', email);
    return errorResponse(res, 'Invalid or expired reset token', 400);
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'UPDATE',
      entityType: 'User',
      entityId: user.id,
      changes: JSON.stringify({ action: 'Password reset' }),
    },
  });

  console.log('[PASSWORD RESET] Password updated for:', email);

  return successResponse(res, null, 'Password reset successful. You can now login with your new password.');
});

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password (when logged in)
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return errorResponse(res, 'Current password and new password are required', 400);
  }

  if (newPassword.length < 6) {
    return errorResponse(res, 'New password must be at least 6 characters', 400);
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);

  if (!isPasswordValid) {
    return errorResponse(res, 'Current password is incorrect', 401);
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'UPDATE',
      entityType: 'User',
      entityId: user.id,
      changes: JSON.stringify({ action: 'Password changed' }),
    },
  });

  console.log('[PASSWORD CHANGE] Password changed for user:', user.email);

  return successResponse(res, null, 'Password changed successfully');
});