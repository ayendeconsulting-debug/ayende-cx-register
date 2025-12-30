import prisma from "../config/database.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * @route   GET /api/v1/terms/current
 * @desc    Get current active terms (for registration page)
 * @access  Public
 */
export const getCurrentTerms = asyncHandler(async (req, res) => {
  // Get the most recent active COMBINED terms (Terms + Privacy together)
  const terms = await prisma.termsVersion.findFirst({
    where: {
      documentType: "COMBINED",
      isActive: true,
    },
    orderBy: {
      effectiveDate: "desc",
    },
    select: {
      id: true,
      version: true,
      title: true,
      effectiveDate: true,
      contentUrl: true,
      changelog: true,
    },
  });

  if (!terms) {
    return errorResponse(res, "No active terms found", 404);
  }

  return successResponse(res, terms, "Current terms retrieved");
});

/**
 * @route   GET /api/v1/terms/all
 * @desc    Get all active terms documents (Terms, Privacy, etc.)
 * @access  Public
 */
export const getAllActiveTerms = asyncHandler(async (req, res) => {
  const terms = await prisma.termsVersion.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      effectiveDate: "desc",
    },
    select: {
      id: true,
      version: true,
      documentType: true,
      title: true,
      effectiveDate: true,
      contentUrl: true,
    },
  });

  return successResponse(res, terms, "Active terms retrieved");
});

/**
 * @route   GET /api/v1/terms/:id
 * @desc    Get specific terms version by ID
 * @access  Public
 */
export const getTermsById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const terms = await prisma.termsVersion.findUnique({
    where: { id },
    select: {
      id: true,
      version: true,
      documentType: true,
      title: true,
      effectiveDate: true,
      content: true,
      contentUrl: true,
      changelog: true,
      createdAt: true,
    },
  });

  if (!terms) {
    return errorResponse(res, "Terms not found", 404);
  }

  return successResponse(res, terms, "Terms retrieved");
});

/**
 * @route   GET /api/v1/terms/business/:businessId/acceptances
 * @desc    Get terms acceptances for a business
 * @access  Private (Admin only)
 */
export const getBusinessAcceptances = asyncHandler(async (req, res) => {
  const { businessId } = req.params;

  // Verify requester has access to this business
  if (req.user.businessId !== businessId && req.user.role !== "SUPER_ADMIN") {
    return errorResponse(res, "Unauthorized", 403);
  }

  const acceptances = await prisma.termsAcceptance.findMany({
    where: { businessId },
    include: {
      termsVersion: {
        select: {
          version: true,
          documentType: true,
          title: true,
          effectiveDate: true,
        },
      },
    },
    orderBy: {
      acceptedAt: "desc",
    },
  });

  return successResponse(res, acceptances, "Acceptances retrieved");
});

/**
 * @route   POST /api/v1/terms/accept
 * @desc    Record terms acceptance for a business (used during registration)
 * @access  Public (called during registration flow)
 */
export const recordAcceptance = asyncHandler(async (req, res) => {
  const {
    businessId,
    termsVersionId,
    acceptedByEmail,
    acceptedByName,
    acceptedBy, // optional user ID if already created
  } = req.body;

  // Get client IP and user agent
  const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];

  // Verify terms version exists and is active
  const termsVersion = await prisma.termsVersion.findUnique({
    where: { id: termsVersionId },
  });

  if (!termsVersion || !termsVersion.isActive) {
    return errorResponse(res, "Invalid or inactive terms version", 400);
  }

  // Check if already accepted
  const existingAcceptance = await prisma.termsAcceptance.findUnique({
    where: {
      businessId_termsVersionId: {
        businessId,
        termsVersionId,
      },
    },
  });

  if (existingAcceptance) {
    return successResponse(res, existingAcceptance, "Terms already accepted");
  }

  // Create acceptance record
  const acceptance = await prisma.termsAcceptance.create({
    data: {
      businessId,
      termsVersionId,
      acceptedBy,
      acceptedByEmail,
      acceptedByName,
      ipAddress,
      userAgent,
    },
    include: {
      termsVersion: {
        select: {
          version: true,
          title: true,
        },
      },
    },
  });

  console.log(
    `[TERMS] Acceptance recorded: Business ${businessId} accepted ${termsVersion.title} v${termsVersion.version}`
  );

  return successResponse(res, acceptance, "Terms acceptance recorded");
});

/**
 * @route   GET /api/v1/terms/check/:businessId
 * @desc    Check if business has accepted current terms
 * @access  Public
 */
export const checkTermsAcceptance = asyncHandler(async (req, res) => {
  const { businessId } = req.params;

  // Get current active terms
  const currentTerms = await prisma.termsVersion.findFirst({
    where: {
      documentType: "COMBINED",
      isActive: true,
    },
    orderBy: {
      effectiveDate: "desc",
    },
  });

  if (!currentTerms) {
    return errorResponse(res, "No active terms found", 404);
  }

  // Check if business has accepted
  const acceptance = await prisma.termsAcceptance.findUnique({
    where: {
      businessId_termsVersionId: {
        businessId,
        termsVersionId: currentTerms.id,
      },
    },
  });

  return successResponse(
    res,
    {
      hasAccepted: !!acceptance,
      currentTermsVersion: currentTerms.version,
      currentTermsId: currentTerms.id,
      acceptedAt: acceptance?.acceptedAt || null,
    },
    "Terms acceptance status"
  );
});
