import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse, createdResponse } from '../utils/response.js';
import { hashPassword } from '../utils/auth.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendWelcomeEmail } from '../services/emailService.js';

/**
 * Business Registration Controller
 * Handles new business registration with owner account creation
 */

/**
 * Generate a URL-friendly subdomain from business name
 * @param {string} businessName - The business name
 * @returns {string} URL-friendly subdomain
 */
const generateSubdomain = (businessName) => {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .substring(0, 20); // Limit length
};

/**
 * @route   POST /api/v1/registration/business
 * @desc    Register new business with owner account
 * @access  Public
 */
export const registerBusiness = asyncHandler(async (req, res) => {
  const {
    // Business Information
    businessName,
    businessEmail,
    businessPhone,
    businessAddress,
    businessCity,
    businessState,
    businessZipCode,
    businessCountry,

    // Owner Information
    ownerFirstName,
    ownerLastName,
    ownerEmail,
    ownerUsername,
    ownerPassword,

    // CRM Integration
    externalTenantId,

    // Optional Settings
    currency = '$',
    currencyCode = 'USD',
    timezone = 'America/New_York',
    taxRate = 0,
    taxEnabled = false,
  } = req.body;

  // Validation
  if (!businessName || !businessEmail || !ownerEmail || !ownerUsername || !ownerPassword) {
    throw new AppError('Please provide all required fields', 400);
  }

  // Validate password length
  if (ownerPassword.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  // Check if business email already exists
  const existingBusiness = await prisma.business.findFirst({
    where: { businessEmail }
  });

  if (existingBusiness) {
    throw new AppError('A business with this email already exists', 400);
  }

  // Check if owner username already exists
  const existingUser = await prisma.user.findFirst({
    where: { username: ownerUsername }
  });

  if (existingUser) {
    throw new AppError('Username already taken', 400);
  }

  // Check if owner email already exists
  const existingUserEmail = await prisma.user.findFirst({
    where: { email: ownerEmail }
  });

  if (existingUserEmail) {
    throw new AppError('Email already registered', 400);
  }

  // Generate subdomain from business name
  let subdomain = generateSubdomain(businessName);
  
  // Check if subdomain exists and make it unique if needed
  let subdomainExists = await prisma.business.findUnique({
    where: { subdomain }
  });

  let counter = 1;
  while (subdomainExists) {
    subdomain = `${generateSubdomain(businessName)}${counter}`;
    subdomainExists = await prisma.business.findUnique({
      where: { subdomain }
    });
    counter++;
  }

  // Create business and owner account in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Business
    const business = await tx.business.create({
      data: {
        businessName,
        businessEmail,
        businessPhone: businessPhone || null,
        businessAddress: businessAddress || null,
        businessCity: businessCity || null,
        businessState: businessState || null,
        businessZipCode: businessZipCode || null,
        businessCountry: businessCountry || 'US',
        subdomain, // Auto-generated subdomain
        externalTenantId: externalTenantId || null,
        currency,
        currencyCode,
        timezone,
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        taxEnabled,
        taxRate: parseFloat(taxRate),
        taxLabel: 'Tax',
        loyaltyEnabled: true,
        isActive: true,
        receiptHeader: businessName,
        receiptFooter: 'Thank you for your business!',
      },
    });

    // 2. Create Owner Account (SUPER_ADMIN)
    const hashedPassword = await hashPassword(ownerPassword);

    const owner = await tx.user.create({
      data: {
        businessId: business.id,
        email: ownerEmail,
        username: ownerUsername,
        passwordHash: hashedPassword,
        firstName: ownerFirstName,
        lastName: ownerLastName,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // 3. Create Default Categories
    const defaultCategories = [
      { name: 'General', description: 'General products', sortOrder: 1 },
      { name: 'Food & Beverage', description: 'Food and drinks', sortOrder: 2 },
      { name: 'Retail', description: 'Retail products', sortOrder: 3 },
      { name: 'Services', description: 'Service items', sortOrder: 4 },
    ];

    for (const category of defaultCategories) {
      await tx.category.create({
        data: {
          businessId: business.id,
          ...category,
          isActive: true,
        },
      });
    }

    // 4. Create Audit Log for registration
    await tx.auditLog.create({
      data: {
        userId: owner.id,
        action: 'CREATE',
        entityType: 'Business',
        entityId: business.id,
        changes: JSON.stringify({
          action: 'Business Registration',
          businessName: business.businessName,
          subdomain: business.subdomain,
        }),
      },
    });

    return { business, owner };
  });

  // Send welcome email (don't block registration if email fails)
  const frontendUrl = process.env.FRONTEND_URL || 'https://pos-app.ayendecx.com';
  const loginUrl = `${frontendUrl}/login`;

  try {
    await sendWelcomeEmail({
      email: result.owner.email,
      firstName: result.owner.firstName,
      lastName: result.owner.lastName,
      businessName: result.business.businessName,
      username: result.owner.username,
      temporaryPassword: null, // User set their own password
      loginUrl,
      subdomain: result.business.subdomain,
    });
    console.log(`[REGISTRATION] Welcome email sent to ${result.owner.email}`);
  } catch (emailError) {
    console.error('[REGISTRATION] Failed to send welcome email:', emailError.message);
    // Don't throw - registration should still succeed
  }

  // Send success response
  return createdResponse(
    res,
    {
      business: {
        id: result.business.id,
        name: result.business.businessName,
        email: result.business.businessEmail,
        subdomain: result.business.subdomain,
        externalTenantId: result.business.externalTenantId,
      },
      owner: result.owner,
      loginInfo: {
        username: `${result.owner.username}.${result.business.subdomain}`,
        loginUrl,
      },
    },
    'Business registered successfully! A welcome email has been sent with your login details.'
  );
});

/**
 * @route   POST /api/v1/registration/check-availability
 * @desc    Check if username, email, or subdomain is available
 * @access  Public
 */
export const checkAvailability = asyncHandler(async (req, res) => {
  const { username, email, businessEmail, subdomain } = req.body;

  const checks = {};

  if (username) {
    const userExists = await prisma.user.findFirst({
      where: { username },
    });
    checks.username = {
      available: !userExists,
      message: userExists ? 'Username already taken' : 'Username available',
    };
  }

  if (email) {
    const emailExists = await prisma.user.findFirst({
      where: { email },
    });
    checks.email = {
      available: !emailExists,
      message: emailExists ? 'Email already registered' : 'Email available',
    };
  }

  if (businessEmail) {
    const businessExists = await prisma.business.findFirst({
      where: { businessEmail },
    });
    checks.businessEmail = {
      available: !businessExists,
      message: businessExists ? 'Business email already registered' : 'Business email available',
    };
  }

  if (subdomain) {
    const subdomainExists = await prisma.business.findUnique({
      where: { subdomain: subdomain.toLowerCase() },
    });
    checks.subdomain = {
      available: !subdomainExists,
      message: subdomainExists ? 'Subdomain already taken' : 'Subdomain available',
    };
  }

  return successResponse(res, checks, 'Availability check completed');
});

/**
 * @route   GET /api/v1/registration/verify-email/:token
 * @desc    Verify email address (future enhancement)
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  // TODO: Implement email verification
  // For now, return success
  return successResponse(res, null, 'Email verification feature coming soon');
});
