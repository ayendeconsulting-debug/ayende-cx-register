import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Shift Service - Business logic for shift management
 * MULTI-TENANT VERSION - All operations filtered by businessId
 */

/**
 * Generate unique shift number
 * Format: SHIFT-YYYYMMDD-XXX
 */
const generateShiftNumber = async (businessId) => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  
  const lastShift = await prisma.shift.findFirst({
    where: {
      businessId,
      shiftNumber: {
        startsWith: `SHIFT-${dateStr}`,
      },
    },
    orderBy: {
      shiftNumber: 'desc',
    },
  });
  
  let sequence = 1;
  if (lastShift) {
    const lastSequence = parseInt(lastShift.shiftNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }
  
  const sequenceStr = String(sequence).padStart(3, '0');
  return `SHIFT-${dateStr}-${sequenceStr}`;
};

/**
 * Open a new shift
 */
export const openShift = async (businessId, userId, openingCash, notes = null) => {
  // Check if user already has an open shift
  const existingOpenShift = await prisma.shift.findFirst({
    where: {
      businessId,
      userId,
      status: 'OPEN',
    },
  });

  if (existingOpenShift) {
    throw new AppError('You already have an open shift. Please close it before opening a new one.', 400);
  }

  // Generate shift number
  const shiftNumber = await generateShiftNumber(businessId);

  // Create new shift
  const shift = await prisma.shift.create({
    data: {
      businessId,
      userId,
      shiftNumber,
      openingCash: parseFloat(openingCash),
      status: 'OPEN',
      notes,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
    },
  });

  return shift;
};

/**
 * Close a shift
 */
export const closeShift = async (businessId, shiftId, closingCash, notes = null, userId) => {
  // Get shift
  const shift = await prisma.shift.findFirst({
    where: { 
      id: shiftId,
      businessId
    },
    include: {
      transactions: {
        where: {
          status: 'COMPLETED',
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
    },
  });

  if (!shift) {
    throw new AppError('Shift not found', 404);
  }

  if (shift.status === 'CLOSED') {
    throw new AppError('Shift is already closed', 400);
  }

  // Only the shift owner or admin can close
  if (shift.userId !== userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new AppError('You can only close your own shifts', 403);
    }
  }

  // Calculate expected cash
  const cashTransactions = shift.transactions.filter(
    (t) => t.paymentMethod === 'CASH'
  );

  const cashSales = cashTransactions.reduce(
    (sum, t) => sum + parseFloat(t.amountPaid),
    0
  );

  const cashReturns = cashTransactions.reduce(
    (sum, t) => sum + parseFloat(t.changeGiven),
    0
  );

  const expectedCash = parseFloat(shift.openingCash) + cashSales - cashReturns;
  const actualClosingCash = parseFloat(closingCash);
  const variance = actualClosingCash - expectedCash;

  // Update shift
  const updatedShift = await prisma.shift.update({
    where: { id: shiftId },
    data: {
      status: 'CLOSED',
      closingCash: actualClosingCash,
      expectedCash,
      variance,
      closedAt: new Date(),
      notes: notes || shift.notes,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
      transactions: {
        where: {
          status: 'COMPLETED',
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          items: true,
        },
      },
    },
  });

  return updatedShift;
};

/**
 * Get all shifts with filters
 */
export const getAllShifts = async (businessId, filters = {}) => {
  const {
    page = 1,
    limit = 20,
    userId,
    status,
    startDate,
    endDate,
    sortBy = 'openedAt',
    sortOrder = 'desc',
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { businessId };

  if (userId) {
    where.userId = userId;
  }

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.openedAt = {};
    if (startDate) {
      where.openedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.openedAt.lte = new Date(endDate);
    }
  }

  const [shifts, total] = await Promise.all([
    prisma.shift.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    }),
    prisma.shift.count({ where }),
  ]);

  return {
    shifts,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)),
  };
};

/**
 * Get shift by ID
 */
export const getShiftById = async (businessId, shiftId) => {
  const shift = await prisma.shift.findFirst({
    where: { 
      id: shiftId,
      businessId
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
      transactions: {
        where: {
          status: 'COMPLETED',
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          items: true,
        },
      },
    },
  });

  if (!shift) {
    throw new AppError('Shift not found', 404);
  }

  return shift;
};

/**
 * Get current open shift for a user
 */
export const getCurrentShift = async (businessId, userId) => {
  const shift = await prisma.shift.findFirst({
    where: {
      businessId,
      userId,
      status: 'OPEN',
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  return shift;
};

/**
 * Get shift report with detailed analytics
 */
export const getShiftReport = async (businessId, shiftId) => {
  const shift = await prisma.shift.findFirst({
    where: { 
      id: shiftId,
      businessId
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
      transactions: {
        where: {
          status: 'COMPLETED',
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  category: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!shift) {
    throw new AppError('Shift not found', 404);
  }

  // Calculate totals by payment method
  const paymentMethodTotals = {};
  shift.transactions.forEach((txn) => {
    const method = txn.paymentMethod;
    if (!paymentMethodTotals[method]) {
      paymentMethodTotals[method] = {
        count: 0,
        total: 0,
      };
    }
    paymentMethodTotals[method].count += 1;
    paymentMethodTotals[method].total += parseFloat(txn.total);
  });

  // Calculate totals
  const totalSales = shift.transactions.reduce(
    (sum, t) => sum + parseFloat(t.total),
    0
  );
  const totalTransactions = shift.transactions.length;
  const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  const totalTax = shift.transactions.reduce(
    (sum, t) => sum + parseFloat(t.taxAmount),
    0
  );
  const totalDiscount = shift.transactions.reduce(
    (sum, t) => sum + parseFloat(t.discountAmount),
    0
  );

  // Calculate items sold
  const itemsSold = shift.transactions.reduce((sum, t) => {
    return sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);

  // Top products
  const productSales = {};
  shift.transactions.forEach((txn) => {
    txn.items.forEach((item) => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[item.productId].quantity += item.quantity;
      productSales[item.productId].revenue += parseFloat(item.total);
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Cash reconciliation
  const cashTransactions = shift.transactions.filter((t) => t.paymentMethod === 'CASH');
  const cashSales = cashTransactions.reduce(
    (sum, t) => sum + parseFloat(t.amountPaid),
    0
  );
  const cashReturns = cashTransactions.reduce(
    (sum, t) => sum + parseFloat(t.changeGiven),
    0
  );
  const expectedCash = parseFloat(shift.openingCash) + cashSales - cashReturns;

  return {
    shift: {
      id: shift.id,
      shiftNumber: shift.shiftNumber,
      status: shift.status,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt,
      openingCash: parseFloat(shift.openingCash),
      closingCash: shift.closingCash ? parseFloat(shift.closingCash) : null,
      expectedCash: shift.expectedCash ? parseFloat(shift.expectedCash) : expectedCash,
      variance: shift.variance ? parseFloat(shift.variance) : null,
      notes: shift.notes,
      user: shift.user,
    },
    summary: {
      totalSales: parseFloat(totalSales.toFixed(2)),
      totalTransactions,
      averageTransaction: parseFloat(averageTransaction.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
      itemsSold,
    },
    paymentMethods: Object.entries(paymentMethodTotals).map(([method, data]) => ({
      method,
      count: data.count,
      total: parseFloat(data.total.toFixed(2)),
    })),
    cashReconciliation: {
      openingCash: parseFloat(shift.openingCash),
      cashSales: parseFloat(cashSales.toFixed(2)),
      cashReturns: parseFloat(cashReturns.toFixed(2)),
      expectedCash: parseFloat(expectedCash.toFixed(2)),
      actualCash: shift.closingCash ? parseFloat(shift.closingCash) : null,
      variance: shift.variance ? parseFloat(shift.variance) : null,
    },
    topProducts,
    transactions: shift.transactions,
  };
};