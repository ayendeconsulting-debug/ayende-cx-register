import prisma from '../config/database.js';
import { hashPassword } from '../utils/auth.js';
import { successResponse, errorResponse, createdResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendBusinessRegistrationNotification } from '../utils/email.js';

/**
 * @route   GET /api/v1/businesses/check-subdomain/:subdomain
 * @desc    Check if subdomain is available
 * @access  Public
 */
export const checkSubdomainAvailability = asyncHandler(async (req, res) => {
  const { subdomain } = req.params;

  // Validate subdomain format (lowercase alphanumeric and hyphens only)
  const subdomainRegex = /^[a-z0-9-]+$/;
  if (!subdomainRegex.test(subdomain)) {
    return errorResponse(res, 'Subdomain must contain only lowercase letters, numbers, and hyphens', 400);
  }

  // Check if subdomain exists
  const existingBusiness = await prisma.business.findUnique({
    where: { subdomain }
  });

  return successResponse(res, {
    available: !existingBusiness,
    subdomain
  }, existingBusiness ? 'Subdomain is already taken' : 'Subdomain is available');
});

/**
 * @route   POST /api/v1/businesses/register
 * @desc    Register new business with owner account
 * @access  Public
 */
export const registerBusiness = asyncHandler(async (req, res) => {
  const {
    businessName,
    subdomain,
    businessEmail,
    businessPhone,
    ownerFirstName,
    ownerLastName,
    ownerEmail,
    ownerPassword,
    primaryColor,
    secondaryColor,
    // NEW: Terms acceptance fields
    termsAccepted,
    termsVersionId
  } = req.body;

  // Validate required fields
  if (!businessName || !subdomain || !ownerEmail || !ownerPassword) {
    return errorResponse(res, 'Missing required fields', 400);
  }

  // ==========================================
  // TERMS ACCEPTANCE VALIDATION
  // ==========================================
  if (!termsAccepted) {
    return errorResponse(res, 'You must accept the Terms of Service and Privacy Policy to register', 400);
  }

  // Verify terms version exists and is active
  let termsVersion;
  if (termsVersionId) {
    termsVersion = await prisma.termsVersion.findUnique({
      where: { id: termsVersionId }
    });
  } else {
    // Get current active terms if no specific version provided
    termsVersion = await prisma.termsVersion.findFirst({
      where: {
        documentType: 'COMBINED',
        isActive: true
      },
      orderBy: {
        effectiveDate: 'desc'
      }
    });
  }

  if (!termsVersion || !termsVersion.isActive) {
    return errorResponse(res, 'Invalid or inactive terms version. Please refresh and try again.', 400);
  }
  // ==========================================

  // Validate subdomain format
  const subdomainRegex = /^[a-z0-9-]+$/;
  if (!subdomainRegex.test(subdomain)) {
    return errorResponse(res, 'Invalid subdomain format', 400);
  }

  // Check if subdomain already exists
  const existingBusiness = await prisma.business.findUnique({
    where: { subdomain }
  });

  if (existingBusiness) {
    return errorResponse(res, 'Subdomain is already taken', 400);
  }

  // Check if email already exists
  const existingUser = await prisma.user.findFirst({
    where: { email: ownerEmail }
  });

  if (existingUser) {
    return errorResponse(res, 'Email is already registered', 400);
  }

  // Hash password
  const passwordHash = await hashPassword(ownerPassword);

  // Get client IP and user agent for terms acceptance record
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  // Create business, owner, and terms acceptance in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create business
    const business = await tx.business.create({
      data: {
        businessName,
        subdomain,
        businessEmail,
        businessPhone,
        primaryColor: primaryColor || '#667eea',
        secondaryColor: secondaryColor || '#764ba2',
        currency: 'CAD',
        currencyCode: 'CAD',
        timezone: 'America/Toronto',
        isActive: true
      }
    });

    // Create owner user
    const owner = await tx.user.create({
      data: {
        businessId: business.id,
        email: ownerEmail,
        username: 'admin',
        passwordHash,
        firstName: ownerFirstName,
        lastName: ownerLastName,
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });

    // Record terms acceptance
    const acceptance = await tx.termsAcceptance.create({
      data: {
        businessId: business.id,
        termsVersionId: termsVersion.id,
        acceptedBy: owner.id,
        acceptedByEmail: ownerEmail,
        acceptedByName: `${ownerFirstName} ${ownerLastName}`.trim() || ownerEmail,
        ipAddress,
        userAgent
      }
    });

    return { business, owner, acceptance };
  });

  console.log(`[REGISTRATION] Business created: ${businessName} (${subdomain})`);
  console.log(`[REGISTRATION] Terms accepted: ${termsVersion.title} v${termsVersion.version}`);

  // ==========================================
  // Send admin notification email
  // ==========================================
  try {
    await sendBusinessRegistrationNotification({
      businessId: result.business.id,
      businessName,
      subdomain,
      businessEmail,
      businessPhone,
      ownerFirstName,
      ownerLastName,
      ownerEmail,
      primaryColor,
      secondaryColor
    });
    console.log(`[REGISTRATION] Admin notification sent for business: ${businessName}`);
  } catch (emailError) {
    // Don't fail the registration if email fails
    console.error('[REGISTRATION] Failed to send admin notification:', emailError.message);
  }
  // ==========================================

  return createdResponse(res, {
    business: {
      id: result.business.id,
      name: result.business.businessName,
      subdomain: result.business.subdomain
    },
    owner: {
      id: result.owner.id,
      email: result.owner.email,
      username: result.owner.username
    },
    termsAcceptance: {
      acceptedAt: result.acceptance.acceptedAt,
      version: termsVersion.version
    }
  }, 'Business registered successfully');
});