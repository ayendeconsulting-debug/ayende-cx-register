import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Stock Adjustment Service - Business logic for stock adjustments with approval workflow
 * MULTI-TENANT VERSION - All operations filtered by businessId
 */

// Approval Thresholds
const APPROVAL_THRESHOLDS = {
  QUANTITY: 100,    // Adjustments over 100 units require approval
  VALUE: 10000,     // Adjustments over $10,000 require approval
};

/**
 * Generate unique adjustment number
 * Format: ADJ-YYYYMMDD-XXX
 */
const generateAdjustmentNumber = async (businessId) => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

  const lastAdjustment = await prisma.stockAdjustment.findFirst({
    where: {
      businessId,
      adjustmentNumber: {
        startsWith: `ADJ-${dateStr}`,
      },
    },
    orderBy: {
      adjustmentNumber: 'desc',
    },
  });
  
  let sequence = 1;
  if (lastAdjustment) {
    const lastSequence = parseInt(lastAdjustment.adjustmentNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  const sequenceStr = String(sequence).padStart(3, '0');
  return `ADJ-${dateStr}-${sequenceStr}`;
};

/**
 * Check if adjustment requires approval based on thresholds
 */
const requiresApproval = (quantityChange, totalValue) => {
  const absQuantity = Math.abs(quantityChange);
  const absValue = Math.abs(parseFloat(totalValue));

  return absQuantity > APPROVAL_THRESHOLDS.QUANTITY || absValue > APPROVAL_THRESHOLDS.VALUE;
};

/**
 * Create a stock adjustment
 */
export const createStockAdjustment = async (businessId, userId, adjustmentData) => {
  const {
    productId,
    adjustmentType,
    quantityChange,
    reason,
    customReason,
    notes,
  } = adjustmentData;

  // Validate quantity change
  if (!quantityChange || quantityChange === 0) {
    throw new AppError('Quantity change must be non-zero', 400);
  }

  // Get product details - must belong to this business
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      businessId
    },
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      costPrice: true,
      price: true,
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Calculate quantities
  const quantityBefore = product.stockQuantity;
  const quantityAfter = quantityBefore + quantityChange;

  // Prevent negative stock
  if (quantityAfter < 0) {
    throw new AppError(
      `Cannot adjust stock below zero. Current stock: ${quantityBefore}, Requested change: ${quantityChange}`,
      400
    );
  }

  // Calculate financial impact
  const unitCost = parseFloat(product.costPrice || product.price);
  const totalValue = Math.abs(quantityChange) * unitCost;

  // Check if approval required
  const needsApproval = requiresApproval(quantityChange, totalValue);

  // Generate adjustment number
  const adjustmentNumber = await generateAdjustmentNumber(businessId);

  // Create adjustment
  const adjustment = await prisma.stockAdjustment.create({
    data: {
      businessId,
      adjustmentNumber,
      productId,
      adjustmentType,
      quantityBefore,
      quantityChange,
      quantityAfter,
      unitCost,
      totalValue,
      reason,
      customReason: reason === 'OTHER' ? customReason : null,
      notes,
      status: needsApproval ? 'PENDING' : 'AUTO_APPROVED',
      requiresApproval: needsApproval,
      createdBy: userId,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
        },
      },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          role: true,
        },
      },
    },
  });

  // If needs approval, create approval record
  if (needsApproval) {
    await prisma.stockAdjustmentApproval.create({
      data: {
        adjustmentId: adjustment.id,
        status: 'PENDING',
      },
    });
  } else {
    // Auto-approved - apply immediately
    await applyStockAdjustment(adjustment.id);
  }

  return adjustment;
};

/**
 * Apply stock adjustment to product inventory
 */
const applyStockAdjustment = async (adjustmentId) => {
  const adjustment = await prisma.stockAdjustment.findUnique({
    where: { id: adjustmentId },
    include: {
      product: true,
    },
  });

  if (!adjustment) {
    throw new AppError('Adjustment not found', 404);
  }

  // Update product stock quantity
  await prisma.product.update({
    where: { id: adjustment.productId },
    data: {
      stockQuantity: adjustment.quantityAfter,
    },
  });

  // Create movement history record
  await prisma.stockMovementHistory.create({
    data: {
      movementType: 'ADJUSTMENT',
      referenceId: adjustment.id,
      referenceType: 'STOCK_ADJUSTMENT',
      productId: adjustment.productId,
      adjustmentId: adjustment.id,
      quantityBefore: adjustment.quantityBefore,
      quantityChange: adjustment.quantityChange,
      quantityAfter: adjustment.quantityAfter,
      unitCost: adjustment.unitCost,
      totalValue: adjustment.totalValue,
      reason: adjustment.reason,
      notes: adjustment.notes,
      performedBy: adjustment.createdBy,
    },
  });

  // Update adjustment processed timestamp
  await prisma.stockAdjustment.update({
    where: { id: adjustmentId },
    data: {
      processedAt: new Date(),
    },
  });
};

/**
 * Approve a stock adjustment (SUPER_ADMIN only)
 */
export const approveStockAdjustment = async (businessId, adjustmentId, userId, approvalNotes) => {
  // Verify user is SUPER_ADMIN
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user.role !== 'SUPER_ADMIN') {
    throw new AppError('Only SUPER_ADMIN can approve stock adjustments', 403);
  }

  // Get adjustment - must belong to this business
  const adjustment = await prisma.stockAdjustment.findFirst({
    where: {
      id: adjustmentId,
      businessId
    },
    include: {
      approval: true,
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
        },
      },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
    },
  });

  if (!adjustment) {
    throw new AppError('Adjustment not found', 404);
  }

  if (adjustment.status !== 'PENDING') {
    throw new AppError(`Adjustment is already ${adjustment.status}`, 400);
  }

  // Update adjustment status
  const updatedAdjustment = await prisma.stockAdjustment.update({
    where: { id: adjustmentId },
    data: {
      status: 'APPROVED',
      approvedBy: userId,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
        },
      },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
      approver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
    },
  });

  // Update approval record
  await prisma.stockAdjustmentApproval.update({
    where: { adjustmentId },
    data: {
      status: 'APPROVED',
      decision: 'APPROVED',
      approvedBy: userId,
      approvalNotes,
      reviewedAt: new Date(),
    },
  });

  // Apply the adjustment
  await applyStockAdjustment(adjustmentId);

  return updatedAdjustment;
};

/**
 * Reject a stock adjustment (SUPER_ADMIN only)
 */
export const rejectStockAdjustment = async (businessId, adjustmentId, userId, rejectionReason) => {
  // Verify user is SUPER_ADMIN
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user.role !== 'SUPER_ADMIN') {
    throw new AppError('Only SUPER_ADMIN can reject stock adjustments', 403);
  }

  if (!rejectionReason) {
    throw new AppError('Rejection reason is required', 400);
  }

  // Get adjustment - must belong to this business
  const adjustment = await prisma.stockAdjustment.findFirst({
    where: {
      id: adjustmentId,
      businessId
    },
    include: {
      approval: true,
    },
  });

  if (!adjustment) {
    throw new AppError('Adjustment not found', 404);
  }

  if (adjustment.status !== 'PENDING') {
    throw new AppError(`Adjustment is already ${adjustment.status}`, 400);
  }

  // Update adjustment status
  const updatedAdjustment = await prisma.stockAdjustment.update({
    where: { id: adjustmentId },
    data: {
      status: 'REJECTED',
      approvedBy: userId,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
        },
      },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
      approver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
    },
  });

  // Update approval record
  await prisma.stockAdjustmentApproval.update({
    where: { adjustmentId },
    data: {
      status: 'REJECTED',
      decision: 'REJECTED',
      approvedBy: userId,
      rejectionReason,
      reviewedAt: new Date(),
    },
  });

  return updatedAdjustment;
};

/**
 * Get all stock adjustments with filters
 */
export const getAllStockAdjustments = async (businessId, filters = {}) => {
  const {
    page = 1,
    limit = 20,
    productId,
    status,
    createdBy,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { businessId };

  if (productId) {
    where.productId = productId;
  }

  if (status) {
    where.status = status;
  }

  if (createdBy) {
    where.createdBy = createdBy;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  const [adjustments, total] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    }),
    prisma.stockAdjustment.count({ where }),
  ]);

  return {
    adjustments,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  };
};

/**
 * Get pending approvals (for SUPER_ADMIN)
 */
export const getPendingApprovals = async (businessId) => {
  const pendingAdjustments = await prisma.stockAdjustment.findMany({
    where: {
      businessId,
      status: 'PENDING',
      requiresApproval: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
        },
      },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          role: true,
        },
      },
      approval: true,
    },
  });

  return pendingAdjustments;
};

/**
 * Get count of pending approvals (for notification badge)
 */
export const getPendingApprovalsCount = async (businessId) => {
  const count = await prisma.stockAdjustment.count({
    where: {
      businessId,
      status: 'PENDING',
      requiresApproval: true,
    },
  });

  return count;
};

/**
 * Get stock adjustment by ID
 */
export const getStockAdjustmentById = async (businessId, adjustmentId) => {
  const adjustment = await prisma.stockAdjustment.findFirst({
    where: { 
      id: adjustmentId,
      businessId
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          price: true,
          costPrice: true,
        },
      },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          role: true,
        },
      },
      approver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
      approval: true,
      movementHistory: true,
    },
  });

  if (!adjustment) {
    throw new AppError('Adjustment not found', 404);
  }

  return adjustment;
};

/**
 * Get stock movement history for a product
 */
export const getStockMovementHistory = async (businessId, productId, filters = {}) => {
  const {
    page = 1,
    limit = 50,
    startDate,
    endDate,
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Verify product belongs to this business
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      businessId
    }
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const where = { productId };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovementHistory.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        performer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        adjustment: {
          select: {
            id: true,
            adjustmentNumber: true,
            status: true,
          },
        },
      },
    }),
    prisma.stockMovementHistory.count({ where }),
  ]);

  return {
    movements,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  };
};

/**
 * Cancel a pending adjustment (creator only)
 */
export const cancelStockAdjustment = async (businessId, adjustmentId, userId) => {
  const adjustment = await prisma.stockAdjustment.findFirst({
    where: {
      id: adjustmentId,
      businessId
    },
  });

  if (!adjustment) {
    throw new AppError('Adjustment not found', 404);
  }

  if (adjustment.createdBy !== userId) {
    throw new AppError('You can only cancel your own adjustments', 403);
  }

  if (adjustment.status !== 'PENDING') {
    throw new AppError('Only pending adjustments can be cancelled', 400);
  }

  const updatedAdjustment = await prisma.stockAdjustment.update({
    where: { id: adjustmentId },
    data: {
      status: 'CANCELLED',
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
        },
      },
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
    },
  });

  return updatedAdjustment;
};