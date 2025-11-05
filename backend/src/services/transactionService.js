import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
// ============================================
// 🔗 INTEGRATION: Phase 2D - Queue-based sync
// ============================================
import syncQueueService from './syncQueueService.js';
import { handleWalkInCustomer } from './walkInService.js';

/**
 * Transaction Service - Business logic for CRM operations
 * MULTI-TENANT VERSION - All operations filtered by businessId
 */

/**
 * Create transaction
 */
export const createTransaction = async (businessId, transactionData, userId) => {
  // ============================================
  // PHASE 2B: Handle walk-in customer
  // ============================================
  let customerId = transactionData.customerId;
  
  // If no customerId but customerInfo provided, handle walk-in
  if (!customerId && transactionData.customerInfo) {
    console.log('[TRANSACTION] Processing walk-in customer');
    
    const walkInResult = await handleWalkInCustomer(businessId, transactionData.customerInfo);
    customerId = walkInResult.customerId;
    
    // Log walk-in conversion if customer was created/imported
    if (walkInResult.isNew) {
      console.log(`[TRANSACTION] Walk-in customer ${walkInResult.source === 'crm' ? 'imported' : 'created'}: ${customerId}`);
    }
  }

  // ============================================
  // ENRICH TRANSACTION ITEMS WITH PRODUCT DATA
  // ============================================
  // Fetch product details for all items to get required fields
  const enrichedItems = [];
  if (transactionData.items && transactionData.items.length > 0) {
    for (const item of transactionData.items) {
      // Fetch product details
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          isTaxable: true,
        },
      });

      if (!product) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }

      // Calculate item-level values
      const unitPrice = item.price || product.price;
      const quantity = item.quantity;
      const subtotal = item.subtotal || (unitPrice * quantity);
      const discount = item.discount || 0;
      
      // Calculate tax for this item (proportional to transaction tax)
      const itemTaxRate = transactionData.taxAmount / transactionData.subtotal;
      const tax = product.isTaxable ? (subtotal - discount) * itemTaxRate : 0;
      
      // Calculate total for this item
      const total = subtotal - discount + tax;

      // Create enriched item with all required fields
      enrichedItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: quantity,
        unitPrice: unitPrice,
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        total: total,
      });
    }
  }

  // Create transaction with all items
  const transaction = await prisma.$transaction(async (tx) => {
    // ============================================
    // GENERATE TRANSACTION NUMBER
    // ============================================
    // Generate unique transaction number: TX-YYYYMMDD-XXXXX
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get count of transactions today for this business
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    
    const todayCount = await tx.transaction.count({
      where: {
        businessId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
    
    const transactionNumber = `TX-${dateStr}-${String(todayCount + 1).padStart(5, '0')}`;
    
    // ============================================
    // CREATE TRANSACTION
    // ============================================
    const transactionCreateData = {
      business: {
        connect: { id: businessId }
      },
      // Only connect customer if customerId exists and is not undefined
      ...(customerId && customerId !== undefined && {
        customer: {
          connect: { id: customerId }
        }
      }),
      ...(userId && { user: { connect: { id: userId } } }),
      transactionNumber: transactionNumber, // Use generated transaction number
      subtotal: transactionData.subtotal,
      taxAmount: transactionData.taxAmount,
      discountAmount: transactionData.discountAmount || 0,
      total: transactionData.total,
      paymentMethod: transactionData.paymentMethod,
      amountPaid: transactionData.amountPaid,
      changeGiven: transactionData.changeGiven || 0,
      loyaltyPointsEarned: transactionData.loyaltyPointsEarned || 0,
      loyaltyPointsRedeemed: transactionData.loyaltyPointsRedeemed || 0,
      status: transactionData.status || 'COMPLETED',
      ...(transactionData.shiftId && { shift: { connect: { id: transactionData.shiftId } } }),
      notes: transactionData.notes || null,
      items: {
        create: enrichedItems,
      },
    };
    
    const newTransaction = await tx.transaction.create({
      data: transactionCreateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    // Update product stock
    if (enrichedItems && enrichedItems.length > 0) {
      for (const item of enrichedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    // Update customer loyalty points and stats (skip for anonymous customers)
    if (customerId && newTransaction.customer && !newTransaction.customer.isAnonymous) {
      const pointsEarned = transactionData.loyaltyPointsEarned || Math.floor(transactionData.total || 0);

      await tx.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: {
            increment: pointsEarned,
          },
          loyaltyPointsLocal: {
            increment: pointsEarned, // Phase 2: Local points tracking
          },
          totalSpent: {
            increment: transactionData.total,
          },
          visitCount: {
            increment: 1,
          },
          lastVisit: new Date(),
        },
      });

      // Create loyalty transaction record
      await tx.loyaltyTransaction.create({
        data: {
          businessId,
          customerId,
          transactionId: newTransaction.id,
          points: pointsEarned,
          type: 'EARNED',
          description: `Points earned from transaction ${newTransaction.transactionNumber}`,
        },
      });
    }

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entityType: 'Transaction',
        entityId: newTransaction.id,
        changes: JSON.stringify(newTransaction),
      },
    });

    return newTransaction;
  });

  // ============================================
  // 🔗 INTEGRATION: Phase 2D - Add to sync queue
  // ============================================
 try {
  // Only sync if customer exists (not anonymous transaction)
  if (transaction.customerId && process.env.ENABLE_REALTIME_SYNC === 'true') {
    const customer = await prisma.customer.findUnique({ 
      where: { id: transaction.customerId }, 
      select: { isAnonymous: true } 
    });
    
    // Only sync if customer exists and is not anonymous
    if (customer && !customer.isAnonymous) {
      // Add transaction to sync queue
      await syncQueueService.addToQueue({
        businessId: transaction.businessId,
        entityType: 'transaction',
        entityId: transaction.id,
        operation: 'CREATE',
        priority: 'HIGH',
        payload: null,
      });
      console.log(`[SYNC] Transaction ${transaction.transactionNumber} added to sync queue`);

    } else if (!transaction.customerId && process.env.ENABLE_REALTIME_SYNC === 'true') {
  console.log(`[TRANSACTION] Transaction ${transaction.transactionNumber} is anonymous, adding to sync queue`);
  // Add anonymous transaction to sync queue
      await syncQueueService.addToQueue({
        businessId: transaction.businessId,
        entityType: 'transaction',
        entityId: transaction.id,
        operation: 'CREATE',
        priority: 'NORMAL',
        payload: null,
      });
    }
  }
  
} catch (error) {
  // Log error but don't fail the transaction
  console.error(`[SYNC ERROR] Failed to add transaction to sync queue:`, error.message);
}

return transaction;
};

/**
 * Get all transactions with filters
 */
export const getAllTransactions = async (businessId, filters = {}) => {
  const {
    page = 1,
    limit = 20,
    startDate,
    endDate,
    customerId,
    status,
    paymentMethod,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeAnonymous = true, // Phase 2B: Option to include/exclude anonymous
  } = filters;

  const skip = (page - 1) * limit;
  const where = { businessId };

  if (customerId) where.customerId = customerId;
  if (status) where.status = status;
  if (paymentMethod) where.paymentMethod = paymentMethod;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Filter out anonymous transactions if requested
  if (!includeAnonymous) {
    where.customer = {
      isAnonymous: false,
    };
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
            isAnonymous: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
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
 * Get transaction by ID
 */
export const getTransactionById = async (businessId, id) => {
  const transaction = await prisma.transaction.findFirst({
    where: { 
      id,
      businessId
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      shift: {
        select: {
          id: true,
          shiftNumber: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  return transaction;
};

/**
 * Update transaction status
 */
export const updateTransactionStatus = async (businessId, id, status, userId) => {
  const transaction = await prisma.transaction.findFirst({
    where: { 
      id,
      businessId
    },
  });

  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }

  const updatedTransaction = await prisma.transaction.update({
    where: { id },
    data: { status },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      entityType: 'Transaction',
      entityId: id,
      changes: JSON.stringify({
        before: { status: transaction.status },
        after: { status },
      }),
    },
  });

  return updatedTransaction;
};

/**
 * Get transaction analytics
 */
export const getTransactionAnalytics = async (businessId, filters = {}) => {
  const { startDate, endDate, includeAnonymous = true } = filters;
  
  const where = { 
    businessId,
    status: 'COMPLETED'
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Filter out anonymous transactions if requested
  if (!includeAnonymous) {
    where.customer = {
      isAnonymous: false,
    };
  }

  const [totalRevenue, transactionCount, averageTransaction, anonymousCount] = await Promise.all([
    prisma.transaction.aggregate({
      where,
      _sum: { total: true },
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.aggregate({
      where,
      _avg: { total: true },
    }),
    // Phase 2B: Count anonymous transactions
    prisma.transaction.count({
      where: {
        ...where,
        customer: {
          isAnonymous: true,
        },
      },
    }),
  ]);

  return {
    totalRevenue: totalRevenue._sum.total || 0,
    transactionCount,
    averageTransaction: averageTransaction._avg.total || 0,
    anonymousTransactionCount: anonymousCount,
    registeredTransactionCount: transactionCount - anonymousCount,
  };
}
