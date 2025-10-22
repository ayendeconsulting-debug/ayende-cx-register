import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Transaction Service - Business logic for POS transactions
 */

/**
 * Generate unique transaction number
 * Format: TXN-YYYYMMDD-XXX
 */
const generateTransactionNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  
  // Get count of transactions today
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  const todayCount = await prisma.transaction.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });
  
  const sequence = String(todayCount + 1).padStart(3, '0');
  return `TXN-${dateStr}-${sequence}`;
};

/**
 * Calculate transaction totals
 */
const calculateTransactionTotals = (items, taxRate, discountAmount = 0, loyaltyPointsRedeemed = 0, loyaltyRedemptionRate = 100) => {
  // Calculate subtotal from items
  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.unitPrice) * item.quantity);
  }, 0);
  
  // Calculate tax on taxable items
  const taxAmount = items.reduce((sum, item) => {
    if (item.isTaxable) {
      const itemSubtotal = parseFloat(item.unitPrice) * item.quantity;
      return sum + (itemSubtotal * taxRate);
    }
    return sum;
  }, 0);
  
  // Calculate loyalty discount (points to dollar)
  const loyaltyDiscount = loyaltyPointsRedeemed / loyaltyRedemptionRate;
  
  // Total discount
  const totalDiscount = parseFloat(discountAmount) + loyaltyDiscount;
  
  // Calculate total
  const total = subtotal + taxAmount - totalDiscount;
  
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    discountAmount: parseFloat(totalDiscount.toFixed(2)),
    total: parseFloat(Math.max(0, total).toFixed(2)), // Ensure not negative
  };
};

/**
 * Calculate loyalty points earned
 */
const calculateLoyaltyPointsEarned = (items, pointsPerDollar = 10) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.unitPrice) * item.quantity);
  }, 0);
  
  // Points from purchase amount only (product-specific loyalty points removed)
  const purchasePoints = Math.floor(subtotal * pointsPerDollar);
  
  return purchasePoints;
};

/**
 * Create a new transaction (sale)
 */
export const createTransaction = async (transactionData, userId) => {
  const {
    customerId,
    items,
    paymentMethod,
    amountPaid,
    discountAmount = 0,
    loyaltyPointsRedeemed = 0,
    notes,
    shiftId,
  } = transactionData;

  // Validate items
  if (!items || items.length === 0) {
    throw new AppError('Transaction must have at least one item', 400);
  }

  // Get system configuration
  const [taxRateConfig, loyaltyPointsConfig, loyaltyRedemptionConfig] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { key: 'tax_rate' } }),
    prisma.systemConfig.findUnique({ where: { key: 'loyalty_points_per_dollar' } }),
    prisma.systemConfig.findUnique({ where: { key: 'loyalty_redemption_rate' } }),
  ]);

  const taxRate = parseFloat(taxRateConfig?.value || '0.15');
  const pointsPerDollar = parseInt(loyaltyPointsConfig?.value || '10');
  const loyaltyRedemptionRate = parseInt(loyaltyRedemptionConfig?.value || '100');

  // Fetch product details and validate stock
  const productIds = items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    throw new AppError('One or more products not found', 404);
  }

  // Build transaction items with product details
  const transactionItems = items.map(item => {
    const product = products.find(p => p.id === item.productId);
    
    if (!product) {
      throw new AppError(`Product ${item.productId} not found`, 404);
    }

    if (!product.isActive) {
      throw new AppError(`Product ${product.name} is not available`, 400);
    }

    if (product.stockQuantity < item.quantity) {
      throw new AppError(
        `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
        400
      );
    }

    const unitPrice = parseFloat(product.price);
    const quantity = parseInt(item.quantity);
    const itemSubtotal = unitPrice * quantity;
    const itemDiscount = parseFloat(item.discount || 0);
    const itemTax = product.isTaxable ? (itemSubtotal - itemDiscount) * taxRate : 0;
    const itemTotal = itemSubtotal - itemDiscount + itemTax;

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity,
      unitPrice,
      subtotal: parseFloat(itemSubtotal.toFixed(2)),
      discount: parseFloat(itemDiscount.toFixed(2)),
      tax: parseFloat(itemTax.toFixed(2)),
      total: parseFloat(itemTotal.toFixed(2)),
     
    };
  });

  // Calculate totals
  const totals = calculateTransactionTotals(
    transactionItems,
    taxRate,
    discountAmount,
    loyaltyPointsRedeemed,
    loyaltyRedemptionRate
  );

  // Validate payment amount
  const paidAmount = parseFloat(amountPaid);
  if (paidAmount < totals.total) {
    throw new AppError(
      `Insufficient payment. Total: ${totals.total}, Paid: ${paidAmount}`,
      400
    );
  }

  const changeGiven = parseFloat((paidAmount - totals.total).toFixed(2));

  // Calculate loyalty points earned
  const loyaltyPointsEarned = customerId
    ? calculateLoyaltyPointsEarned(transactionItems, pointsPerDollar)
    : 0;

  // Validate customer has enough points to redeem
  if (loyaltyPointsRedeemed > 0 && customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    if (customer.loyaltyPoints < loyaltyPointsRedeemed) {
      throw new AppError(
        `Insufficient loyalty points. Available: ${customer.loyaltyPoints}, Requested: ${loyaltyPointsRedeemed}`,
        400
      );
    }
  }

  // Generate transaction number
  const transactionNumber = await generateTransactionNumber();

  // Create transaction with all related data in a single database transaction
  const transaction = await prisma.$transaction(async (tx) => {
    // 1. Create the transaction
    const newTransaction = await tx.transaction.create({
      data: {
        transactionNumber,
        customerId: customerId || null,
        userId,
        shiftId: shiftId || null,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        total: totals.total,
        paymentMethod,
        amountPaid: paidAmount,
        changeGiven,
        loyaltyPointsEarned,
        loyaltyPointsRedeemed,
        status: 'COMPLETED',
        notes: notes || null,
        items: {
          create: transactionItems,
        },
      },
      include: {
        items: true,
        customer: true,
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

    // 2. Update product stock and create stock movements
    for (const item of transactionItems) {
      // Update stock
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });

      // Create stock movement
      const product = products.find(p => p.id === item.productId);
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          movementType: 'SALE',
          quantity: item.quantity,
          previousStock: product.stockQuantity,
          newStock: product.stockQuantity - item.quantity,
          reference: transactionNumber,
          notes: `Sale transaction`,
        },
      });
    }

    // 3. Update customer loyalty points
    if (customerId) {
      const netPoints = loyaltyPointsEarned - loyaltyPointsRedeemed;
      
      await tx.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: { increment: netPoints },
          totalSpent: { increment: totals.total },
          visitCount: { increment: 1 },
          lastVisit: new Date(),
        },
      });

      // Create loyalty transaction for points earned
      if (loyaltyPointsEarned > 0) {
        await tx.loyaltyTransaction.create({
          data: {
            customerId,
            type: 'EARNED',
            points: loyaltyPointsEarned,
            transactionId: newTransaction.id,
            description: `Points earned from purchase ${transactionNumber}`,
          },
        });
      }

      // Create loyalty transaction for points redeemed
      if (loyaltyPointsRedeemed > 0) {
        await tx.loyaltyTransaction.create({
          data: {
            customerId,
            type: 'REDEEMED',
            points: -loyaltyPointsRedeemed,
            transactionId: newTransaction.id,
            description: `Points redeemed on purchase ${transactionNumber}`,
          },
        });
      }
    }

    // 4. Create audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entityType: 'Transaction',
        entityId: newTransaction.id,
        changes: JSON.stringify({
          transactionNumber,
          total: totals.total,
          itemCount: transactionItems.length,
        }),
      },
    });

    return newTransaction;
  });

  return transaction;
};

/**
 * Get all transactions with filters
 */
export const getAllTransactions = async (filters = {}) => {
  const {
    page = 1,
    limit = 20,
    status,
    customerId,
    userId,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    paymentMethod,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const skip = (page - 1) * limit;
  const where = {};

  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (userId) where.userId = userId;
  if (paymentMethod) where.paymentMethod = paymentMethod;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  if (minAmount || maxAmount) {
    where.total = {};
    if (minAmount) where.total.gte = parseFloat(minAmount);
    if (maxAmount) where.total.lte = parseFloat(maxAmount);
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
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
        items: {
          select: {
            id: true,
            productName: true,
            sku: true,
            quantity: true,
            unitPrice: true,
            total: true,
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get single transaction by ID
 */
export const getTransactionById = async (id) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      customer: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
      items: true,
      shift: true,
    },
  });

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  return transaction;
};

/**
 * Get transaction by transaction number
 */
export const getTransactionByNumber = async (transactionNumber) => {
  const transaction = await prisma.transaction.findUnique({
    where: { transactionNumber },
    include: {
      customer: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
      items: true,
    },
  });

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  return transaction;
};

/**
 * Void a transaction
 */
export const voidTransaction = async (id, reason, userId) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  if (transaction.status === 'VOID') {
    throw new AppError('Transaction is already voided', 400);
  }

  if (transaction.status === 'REFUNDED') {
    throw new AppError('Cannot void a refunded transaction', 400);
  }

  // Void transaction and restore stock in a single database transaction
  const voidedTransaction = await prisma.$transaction(async (tx) => {
    // 1. Update transaction status
    const updated = await tx.transaction.update({
      where: { id },
      data: {
        status: 'VOID',
        voidReason: reason,
      },
      include: {
        items: true,
        customer: true,
      },
    });

    // 2. Restore stock for each item
    for (const item of transaction.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: { increment: item.quantity },
        },
      });

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          movementType: 'RETURN',
          quantity: item.quantity,
          previousStock: product.stockQuantity,
          newStock: product.stockQuantity + item.quantity,
          reference: transaction.transactionNumber,
          notes: `Void transaction: ${reason}`,
        },
      });
    }

    // 3. Reverse loyalty points
    if (transaction.customerId) {
      const netPoints = transaction.loyaltyPointsRedeemed - transaction.loyaltyPointsEarned;
      
      await tx.customer.update({
        where: { id: transaction.customerId },
        data: {
          loyaltyPoints: { increment: netPoints },
          totalSpent: { decrement: transaction.total },
          visitCount: { decrement: 1 },
        },
      });

      // Create loyalty adjustment
      if (netPoints !== 0) {
        await tx.loyaltyTransaction.create({
          data: {
            customerId: transaction.customerId,
            type: 'ADJUSTED',
            points: netPoints,
            transactionId: transaction.id,
            description: `Void transaction ${transaction.transactionNumber}: ${reason}`,
          },
        });
      }
    }

    // 4. Create audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: 'VOID_TRANSACTION',
        entityType: 'Transaction',
        entityId: id,
        changes: JSON.stringify({ reason, transactionNumber: transaction.transactionNumber }),
      },
    });

    return updated;
  });

  return voidedTransaction;
};

/**
 * Get sales summary
 */
export const getSalesSummary = async (startDate, endDate) => {
  const where = {
    status: 'COMPLETED',
    createdAt: {},
  };

  if (startDate) where.createdAt.gte = new Date(startDate);
  if (endDate) where.createdAt.lte = new Date(endDate);

  const [transactions, summary] = await Promise.all([
    prisma.transaction.findMany({ where }),
    prisma.transaction.aggregate({
      where,
      _sum: {
        total: true,
        subtotal: true,
        taxAmount: true,
        discountAmount: true,
      },
      _count: true,
    }),
  ]);

  // Calculate payment method breakdown
  const paymentBreakdown = {};
  transactions.forEach(txn => {
    if (!paymentBreakdown[txn.paymentMethod]) {
      paymentBreakdown[txn.paymentMethod] = { count: 0, total: 0 };
    }
    paymentBreakdown[txn.paymentMethod].count += 1;
    paymentBreakdown[txn.paymentMethod].total += parseFloat(txn.total);
  });

  return {
    totalSales: summary._sum.total || 0,
    totalTransactions: summary._count,
    averageTransaction: summary._count > 0 
      ? (summary._sum.total / summary._count).toFixed(2) 
      : 0,
    totalTax: summary._sum.taxAmount || 0,
    totalDiscounts: summary._sum.discountAmount || 0,
    paymentBreakdown,
  };
};