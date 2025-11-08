import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse, createdResponse } from '../utils/response.js';
import { hashPassword, generateAccessToken } from '../utils/auth.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import crypto from 'crypto';

/**
 * User Invitation Controller
 * Handles user invitation system for adding staff to business
 */

/**
 * @route   POST /api/v1/users/invite
 * @desc    Invite user to join business
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
export const inviteUser = asyncHandler(async (req, res) => {
  const {
    email,
    firstName,
    lastName,
    role,
    message = '',
  } = req.body;

  const inviterId = req.user.id;
  const businessId = req.user.businessId;

  // Validation
  if (!email || !firstName || !lastName || !role) {
    throw new AppError('Please provide all required fields', 400);
  }

  // Validate role
  const validRoles = ['SUPER_ADMIN', 'ADMIN', 'CASHIER', 'INVENTORY_MANAGER'];
  if (!validRoles.includes(role)) {
    throw new AppError('Invalid role specified', 400);
  }

  // Check if email already exists in this business
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      businessId,
    },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists in your business', 400);
  }

  // Check if invitation already exists
  const existingInvitation = await prisma.userInvitation.findFirst({
    where: {
      email,
      businessId,
      status: 'PENDING',
    },
  });

  if (existingInvitation) {
    throw new AppError('An invitation has already been sent to this email', 400);
  }

  // Generate invitation token (valid for 7 days)
  const invitationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Get business info for invitation email
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      businessName: true,
      businessEmail: true,
    },
  });

  // Get inviter info
  const inviter = await prisma.user.findUnique({
    where: { id: inviterId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  // Create invitation
  const invitation = await prisma.userInvitation.create({
    data: {
      businessId,
      email,
      firstName,
      lastName,
      role,
      invitationToken,
      expiresAt,
      invitedBy: inviterId,
      message: message || null,
      status: 'PENDING',
      updatedAt: new Date(), // FIXED: Added updatedAt field
    },
    include: {
      business: {
        select: {
          businessName: true,
        },
      },
      inviter: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // TODO: Send invitation email
  // For now, we'll return the invitation link
  const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invitation/${invitationToken}`;

  return createdResponse(
    res,
    {
      invitation: {
        id: invitation.id,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        invitationLink, // In production, this would be sent via email
      },
    },
    'Invitation sent successfully'
  );
});

/**
 * @route   POST /api/v1/users/accept-invitation
 * @desc    Accept invitation and create account
 * @access  Public
 */
export const acceptInvitation = asyncHandler(async (req, res) => {
  const { invitationToken, username, password } = req.body;

  // Validation
  if (!invitationToken || !username || !password) {
    throw new AppError('Please provide all required fields', 400);
  }

  // Find invitation
  const invitation = await prisma.userInvitation.findFirst({
    where: {
      invitationToken,
      status: 'PENDING',
    },
    include: {
      business: true,
    },
  });

  if (!invitation) {
    throw new AppError('Invalid or expired invitation', 400);
  }

  // Check if invitation has expired
  if (new Date() > new Date(invitation.expiresAt)) {
    await prisma.userInvitation.update({
      where: { id: invitation.id },
      data: { 
        status: 'EXPIRED',
        updatedAt: new Date() // FIXED: Added updatedAt
      },
    });
    throw new AppError('This invitation has expired', 400);
  }

  // Check if username is available
  const existingUser = await prisma.user.findFirst({
    where: { username },
  });

  if (existingUser) {
    throw new AppError('Username already taken', 400);
  }

  // Check if email is already registered
  const existingEmail = await prisma.user.findFirst({
    where: {
      email: invitation.email,
      businessId: invitation.businessId,
    },
  });

  if (existingEmail) {
    throw new AppError('This email is already registered', 400);
  }

  // Create user account in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await tx.user.create({
      data: {
        businessId: invitation.businessId,
        email: invitation.email,
        username,
        passwordHash: hashedPassword,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: invitation.role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        businessId: true,
      },
    });

    // Mark invitation as accepted
    await tx.userInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        updatedAt: new Date(), // FIXED: Added updatedAt
      },
    });

    return { user, business: invitation.business };
  });

  // Generate tokens for automatic login
  const accessToken = generateAccessToken({
    id: result.user.id,
    businessId: result.user.businessId,
    email: result.user.email,
    username: result.user.username,
    role: result.user.role,
  });

  return successResponse(
    res,
    {
      user: result.user,
      business: {
        id: result.business.id,
        name: result.business.businessName,
        businessName: result.business.businessName,
        currency: result.business.currency,
        currencyCode: result.business.currencyCode,
      },
      accessToken,
      message: 'Account created successfully! You are now logged in.',
    },
    'Invitation accepted successfully'
  );
});

/**
 * @route   GET /api/v1/users/invitation/:token
 * @desc    Get invitation details
 * @access  Public
 */
export const getInvitationDetails = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const invitation = await prisma.userInvitation.findFirst({
    where: {
      invitationToken: token,
      status: 'PENDING',
    },
    include: {
      business: {
        select: {
          businessName: true,
          businessEmail: true,
        },
      },
      inviter: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!invitation) {
    throw new AppError('Invalid or expired invitation', 400);
  }

  // Check if expired
  if (new Date() > new Date(invitation.expiresAt)) {
    await prisma.userInvitation.update({
      where: { id: invitation.id },
      data: { 
        status: 'EXPIRED',
        updatedAt: new Date() // FIXED: Added updatedAt
      },
    });
    throw new AppError('This invitation has expired', 400);
  }

  return successResponse(
    res,
    {
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      role: invitation.role,
      businessName: invitation.business.businessName,
      inviterName: `${invitation.inviter.firstName} ${invitation.inviter.lastName}`,
      message: invitation.message,
      expiresAt: invitation.expiresAt,
    },
    'Invitation details retrieved successfully'
  );
});

/**
 * @route   GET /api/v1/users/invitations
 * @desc    Get all invitations for current business
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
export const getInvitations = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId;
  const { status } = req.query;

  const where = { businessId };
  if (status) {
    where.status = status;
  }

  const invitations = await prisma.userInvitation.findMany({
    where,
    include: {
      inviter: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return successResponse(
    res,
    invitations,
    'Invitations retrieved successfully'
  );
});

/**
 * @route   DELETE /api/v1/users/invitation/:id
 * @desc    Cancel/revoke invitation
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
export const revokeInvitation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const businessId = req.user.businessId;

  const invitation = await prisma.userInvitation.findFirst({
    where: {
      id,
      businessId,
    },
  });

  if (!invitation) {
    throw new AppError('Invitation not found', 404);
  }

  if (invitation.status !== 'PENDING') {
    throw new AppError('Can only revoke pending invitations', 400);
  }

  await prisma.userInvitation.update({
    where: { id },
    data: { 
      status: 'REVOKED',
      updatedAt: new Date() // FIXED: Added updatedAt
    },
  });

  return successResponse(res, null, 'Invitation revoked successfully');
});

/**
 * @route   POST /api/v1/users/invitation/:id/resend
 * @desc    Resend invitation email
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
export const resendInvitation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const businessId = req.user.businessId;

  const invitation = await prisma.userInvitation.findFirst({
    where: {
      id,
      businessId,
      status: 'PENDING',
    },
    include: {
      business: true,
    },
  });

  if (!invitation) {
    throw new AppError('Invitation not found or already accepted', 404);
  }

  // Extend expiration by 7 days
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.userInvitation.update({
    where: { id },
    data: { 
      expiresAt: newExpiresAt,
      updatedAt: new Date() // FIXED: Added updatedAt
    },
  });

  // TODO: Resend invitation email
  const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invitation/${invitation.invitationToken}`;

  return successResponse(
    res,
    {
      invitationLink,
      expiresAt: newExpiresAt,
    },
    'Invitation resent successfully'
  );
});