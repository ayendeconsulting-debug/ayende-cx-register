import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate unique contract number
 */
const generateContractNumber = async (businessId) => {
  const today = new Date();
  const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Find the last contract number for today
  const lastContract = await prisma.rentalContract.findFirst({
    where: {
      businessId,
      contractNumber: { startsWith: `RNT-${datePrefix}` }
    },
    orderBy: { contractNumber: 'desc' }
  });

  let sequence = 1;
  if (lastContract) {
    const lastSequence = parseInt(lastContract.contractNumber.split('-')[2], 10);
    sequence = lastSequence + 1;
  }

  return `RNT-${datePrefix}-${String(sequence).padStart(4, '0')}`;
};

/**
 * Calculate rental days between two dates
 */
const calculateRentalDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 1); // Minimum 1 day
};

/**
 * Create a new rental contract
 */
export const createRentalContract = async (businessId, data, userId) => {
  const {
    customerId,
    items,
    startDate,
    expectedReturnDate,
    depositAmount,
    contactPhone,
    contactEmail,
    deliveryAddress,
    notes,
    transactionId
  } = data;

  // Validate customer exists
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId }
  });

  if (!customer) {
    throw new Error('Customer not found');
  }

  // Validate products and calculate totals
  let subtotal = 0;
  const rentalDays = calculateRentalDays(startDate, expectedReturnDate);
  const validatedItems = [];

  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, businessId, isActive: true }
    });

    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    if (!product.isRental) {
      throw new Error(`Product "${product.name}" is not available for rental`);
    }

    // Check stock availability
    if (product.stockQuantity < item.quantity) {
      throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stockQuantity}, Requested: ${item.quantity}`);
    }

    const dailyRate = product.dailyRate || product.price;
    const itemSubtotal = Number(dailyRate) * item.quantity * rentalDays;
    subtotal += itemSubtotal;

    validatedItems.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: item.quantity,
      dailyRate: dailyRate,
      subtotal: itemSubtotal
    });
  }

  // Get business for tax calculation
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  const taxRate = business.taxEnabled ? Number(business.taxRate) : 0;
  const taxAmount = subtotal * taxRate;
  const totalDue = subtotal + taxAmount;

  // Generate contract number
  const contractNumber = await generateContractNumber(businessId);

  // Create contract with items in a transaction
  const contract = await prisma.$transaction(async (tx) => {
    // Create the rental contract
    const newContract = await tx.rentalContract.create({
      data: {
        contractNumber,
        businessId,
        customerId,
        transactionId: transactionId || null,
        startDate: new Date(startDate),
        expectedReturnDate: new Date(expectedReturnDate),
        rentalDays,
        subtotal,
        taxAmount,
        depositAmount: depositAmount || 0,
        totalDue,
        totalPaid: depositAmount || 0,
        balanceDue: totalDue - (depositAmount || 0),
        currency: business.currency,
        currencyCode: business.currencyCode,
        status: 'ACTIVE',
        contactPhone,
        contactEmail,
        deliveryAddress,
        items: {
          create: validatedItems
        }
      },
      include: {
        items: {
          include: { product: true }
        },
        customer: true
      }
    });

    // Reduce stock for each rented item
    for (const item of validatedItems) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } }
      });

      // Create stock movement record
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: -item.quantity,
          previousStock: product.stockQuantity,
          newStock: product.stockQuantity - item.quantity,
          movementType: 'RENTAL_OUT',
          reference: newContract.contractNumber,
          notes: `Rental contract ${newContract.contractNumber}`
        }
      });
    }

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: 'RENTAL_CREATE',
        entityType: 'RentalContract',
        entityId: newContract.id,
        changes: JSON.stringify({
          contractNumber: newContract.contractNumber,
          customerId,
          itemCount: validatedItems.length,
          totalDue
        })
      }
    });

    return newContract;
  });

  return contract;
};

/**
 * Get all rental contracts with filters
 */
export const getAllRentalContracts = async (businessId, filters = {}) => {
  const {
    page = 1,
    limit = 20,
    status,
    customerId,
    startDateFrom,
    startDateTo,
    expectedReturnFrom,
    expectedReturnTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search
  } = filters;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = { businessId };

  if (status) {
    // Handle multiple statuses
    if (status.includes(',')) {
      where.status = { in: status.split(',') };
    } else {
      where.status = status;
    }
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (startDateFrom || startDateTo) {
    where.startDate = {};
    if (startDateFrom) where.startDate.gte = new Date(startDateFrom);
    if (startDateTo) where.startDate.lte = new Date(startDateTo);
  }

  if (expectedReturnFrom || expectedReturnTo) {
    where.expectedReturnDate = {};
    if (expectedReturnFrom) where.expectedReturnDate.gte = new Date(expectedReturnFrom);
    if (expectedReturnTo) where.expectedReturnDate.lte = new Date(expectedReturnTo);
  }

  if (search) {
    where.OR = [
      { contractNumber: { contains: search, mode: 'insensitive' } },
      { customer: { firstName: { contains: search, mode: 'insensitive' } } },
      { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      { customer: { phone: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const [contracts, total] = await Promise.all([
    prisma.rentalContract.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, imageUrl: true } }
          }
        },
        returnProcessor: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    }),
    prisma.rentalContract.count({ where })
  ]);

  return {
    contracts,
    page: parseInt(page),
    limit: take,
    total,
    totalPages: Math.ceil(total / take)
  };
};

/**
 * Get single rental contract by ID
 */
export const getRentalContractById = async (businessId, contractId) => {
  const contract = await prisma.rentalContract.findFirst({
    where: { id: contractId, businessId },
    include: {
      customer: true,
      items: {
        include: {
          product: true
        }
      },
      transaction: true,
      returnProcessor: {
        select: { id: true, firstName: true, lastName: true, email: true }
      },
      business: {
        select: { businessName: true, businessPhone: true, businessEmail: true, businessAddress: true }
      }
    }
  });

  if (!contract) {
    throw new Error('Rental contract not found');
  }

  return contract;
};

/**
 * Get overdue rental contracts
 */
export const getOverdueRentals = async (businessId) => {
  const now = new Date();

  const overdueContracts = await prisma.rentalContract.findMany({
    where: {
      businessId,
      status: { in: ['ACTIVE', 'OVERDUE'] },
      expectedReturnDate: { lt: now }
    },
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      },
      items: {
        include: {
          product: { select: { id: true, name: true, latePenaltyRate: true } }
        }
      }
    },
    orderBy: { expectedReturnDate: 'asc' }
  });

  // Calculate overdue days and penalties for each contract
  return overdueContracts.map(contract => {
    const overdueDays = Math.ceil((now - new Date(contract.expectedReturnDate)) / (1000 * 60 * 60 * 24));
    
    let totalPenalty = 0;
    contract.items.forEach(item => {
      const penaltyRate = Number(item.product.latePenaltyRate || item.dailyRate * 0.1);
      const itemPenalty = penaltyRate * (item.quantity - item.returnedQuantity) * overdueDays;
      totalPenalty += itemPenalty;
    });

    return {
      ...contract,
      overdueDays,
      calculatedPenalty: totalPenalty
    };
  });
};

/**
 * Process rental return - ENHANCED with Early Return Recalculation
 * 
 * Key Enhancement: When items are returned EARLY, the system recalculates the total
 * based on actual rental days instead of the original expected duration.
 */
export const processRentalReturn = async (businessId, contractId, returnData, userId) => {
  const {
    items,
    returnNotes,
    damageNotes,
    depositReturned,
    additionalCharges = 0,
    recalculateForEarlyReturn = true  // New option - default true
  } = returnData;

  const contract = await prisma.rentalContract.findFirst({
    where: { id: contractId, businessId },
    include: { 
      items: true,
      business: {
        select: { currency: true, currencyCode: true }
      }
    }
  });

  if (!contract) {
    throw new Error('Rental contract not found');
  }

  if (contract.status === 'CLOSED' || contract.status === 'CANCELLED') {
    throw new Error('This rental contract is already closed');
  }

  const now = new Date();
  const startDate = new Date(contract.startDate);
  const expectedReturnDate = new Date(contract.expectedReturnDate);
  
  // Calculate actual days used
  const actualDaysUsed = Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
  const originalDays = Math.max(1, Math.ceil((expectedReturnDate - startDate) / (1000 * 60 * 60 * 24)));
  
  // Determine if this is an early return
  const isEarlyReturn = now < expectedReturnDate;
  const isOverdue = now > expectedReturnDate;
  const overdueDays = isOverdue
    ? Math.ceil((now - expectedReturnDate) / (1000 * 60 * 60 * 24))
    : 0;

  // Process return in transaction
  const updatedContract = await prisma.$transaction(async (tx) => {
    let totalDamageCharges = 0;
    let allItemsReturned = true;
    let recalculatedSubtotal = 0;
    let originalSubtotal = Number(contract.subtotal);

    // Process each returned item
    for (const returnItem of items) {
      const contractItem = contract.items.find(i => i.id === returnItem.itemId);
      if (!contractItem) continue;

      const returnedQty = returnItem.returnedQuantity || 0;
      const damagedQty = returnItem.damagedQuantity || 0;
      const missingQty = returnItem.missingQuantity || 0;
      const damageCharge = returnItem.damageCharge || 0;

      totalDamageCharges += damageCharge;

      // Calculate this item's contribution to recalculated total
      // Only recalculate if early return and full quantity being returned
      if (isEarlyReturn && recalculateForEarlyReturn && returnedQty >= contractItem.quantity) {
        // Recalculate based on actual days used
        const itemRecalculated = Number(contractItem.dailyRate) * contractItem.quantity * actualDaysUsed;
        recalculatedSubtotal += itemRecalculated;
      } else {
        // Use original subtotal for this item
        recalculatedSubtotal += Number(contractItem.subtotal);
      }

      // Update contract item
      await tx.rentalContractItem.update({
        where: { id: contractItem.id },
        data: {
          returnedQuantity: { increment: returnedQty },
          damagedQuantity: { increment: damagedQty },
          missingQuantity: { increment: missingQty },
          damageDescription: returnItem.damageDescription,
          damageCharge: { increment: damageCharge },
          returnedAt: now
        }
      });

      // Restore stock (only good items, not damaged or missing)
      const restoreQty = returnedQty - damagedQty - missingQty;
      if (restoreQty > 0) {
        const product = await tx.product.findUnique({ where: { id: contractItem.productId } });
        
        await tx.product.update({
          where: { id: contractItem.productId },
          data: { stockQuantity: { increment: restoreQty } }
        });

        // Create stock movement record
        await tx.stockMovement.create({
          data: {
            productId: contractItem.productId,
            quantity: restoreQty,
            previousStock: product.stockQuantity,
            newStock: product.stockQuantity + restoreQty,
            movementType: 'RENTAL_RETURN',
            reference: contract.contractNumber,
            notes: `Return from rental ${contract.contractNumber}${isEarlyReturn ? ' (early return)' : ''}`
          }
        });
      }

      // Check if all items returned
      const updatedItem = await tx.rentalContractItem.findUnique({ where: { id: contractItem.id } });
      if (updatedItem.returnedQuantity < contractItem.quantity) {
        allItemsReturned = false;
      }
    }

    // Calculate penalty if overdue
    let penaltyAmount = 0;
    if (isOverdue) {
      for (const item of contract.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        const penaltyRate = Number(product.latePenaltyRate || Number(item.dailyRate) * 0.1);
        const unreturned = item.quantity - item.returnedQuantity;
        penaltyAmount += penaltyRate * unreturned * overdueDays;
      }
    }

    // Calculate adjustment for early return
    let earlyReturnCredit = 0;
    if (isEarlyReturn && recalculateForEarlyReturn && allItemsReturned) {
      earlyReturnCredit = originalSubtotal - recalculatedSubtotal;
      if (earlyReturnCredit < 0) earlyReturnCredit = 0; // Safety check
    }

    // Determine new status
    let newStatus = contract.status;
    if (allItemsReturned) {
      newStatus = 'RETURNED';
    } else {
      newStatus = 'PARTIALLY_RETURNED';
    }

    // Calculate new totals
    const newSubtotal = isEarlyReturn && recalculateForEarlyReturn && allItemsReturned
      ? recalculatedSubtotal
      : Number(contract.subtotal);
    
    const newTotalDue = newSubtotal + Number(contract.taxAmount) + penaltyAmount + totalDamageCharges;
    const depositReturnedAmount = depositReturned !== undefined ? Number(depositReturned) : 0;
    const newBalanceDue = newTotalDue - Number(contract.totalPaid) - depositReturnedAmount + Number(contract.depositAmount);

    // Update contract
    const updated = await tx.rentalContract.update({
      where: { id: contractId },
      data: {
        status: newStatus,
        actualReturnDate: allItemsReturned ? now : null,
        returnedBy: userId,
        returnNotes: isEarlyReturn && earlyReturnCredit > 0
          ? `${returnNotes || ''}\n[Early Return Credit: ${contract.business?.currency || '$'}${earlyReturnCredit.toFixed(2)} - Actual days: ${actualDaysUsed} of ${originalDays}]`.trim()
          : returnNotes,
        damageNotes,
        rentalDays: allItemsReturned ? actualDaysUsed : contract.rentalDays,
        subtotal: newSubtotal,
        penaltyAmount: Number(contract.penaltyAmount) + penaltyAmount,
        damageCharges: Number(contract.damageCharges) + totalDamageCharges,
        depositReturned: depositReturned !== undefined ? depositReturned : contract.depositReturned,
        totalDue: newTotalDue,
        balanceDue: Math.max(0, newBalanceDue)
      },
      include: {
        customer: true,
        items: {
          include: { product: true }
        },
        returnProcessor: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: 'RENTAL_RETURN',
        entityType: 'RentalContract',
        entityId: contractId,
        changes: JSON.stringify({
          contractNumber: contract.contractNumber,
          returnedItems: items.length,
          isEarlyReturn,
          actualDaysUsed: isEarlyReturn ? actualDaysUsed : null,
          originalDays: isEarlyReturn ? originalDays : null,
          earlyReturnCredit: isEarlyReturn ? earlyReturnCredit : 0,
          penaltyAmount,
          damageCharges: totalDamageCharges,
          newStatus,
          newSubtotal,
          newTotalDue
        })
      }
    });

    return updated;
  });

  return updatedContract;
};

/**
 * Close rental contract
 */
export const closeRentalContract = async (businessId, contractId, userId, notes) => {
  const contract = await prisma.rentalContract.findFirst({
    where: { id: contractId, businessId }
  });

  if (!contract) {
    throw new Error('Rental contract not found');
  }

  if (contract.status === 'CLOSED') {
    throw new Error('Contract is already closed');
  }

  if (contract.status !== 'RETURNED') {
    throw new Error('Cannot close contract until all items are returned');
  }

  const updatedContract = await prisma.$transaction(async (tx) => {
    const updated = await tx.rentalContract.update({
      where: { id: contractId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        returnNotes: notes ? `${contract.returnNotes || ''}\nClosed: ${notes}` : contract.returnNotes
      },
      include: {
        customer: true,
        items: true
      }
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'RENTAL_CLOSE',
        entityType: 'RentalContract',
        entityId: contractId,
        changes: JSON.stringify({
          contractNumber: contract.contractNumber,
          closedAt: new Date().toISOString()
        })
      }
    });

    return updated;
  });

  return updatedContract;
};

/**
 * Cancel rental contract
 */
export const cancelRentalContract = async (businessId, contractId, userId, reason) => {
  const contract = await prisma.rentalContract.findFirst({
    where: { id: contractId, businessId },
    include: { items: true }
  });

  if (!contract) {
    throw new Error('Rental contract not found');
  }

  if (contract.status !== 'DRAFT' && contract.status !== 'ACTIVE') {
    throw new Error('Only draft or active contracts can be cancelled');
  }

  const updatedContract = await prisma.$transaction(async (tx) => {
    // Restore stock for all items
    for (const item of contract.items) {
      const unreturned = item.quantity - item.returnedQuantity;
      if (unreturned > 0) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: unreturned } }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: unreturned,
            previousStock: product.stockQuantity,
            newStock: product.stockQuantity + unreturned,
            movementType: 'RENTAL_RETURN',
            reference: contract.contractNumber,
            notes: `Cancelled rental ${contract.contractNumber}: ${reason}`
          }
        });
      }
    }

    const updated = await tx.rentalContract.update({
      where: { id: contractId },
      data: {
        status: 'CANCELLED',
        returnNotes: reason,
        closedAt: new Date()
      }
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'RENTAL_CLOSE',
        entityType: 'RentalContract',
        entityId: contractId,
        changes: JSON.stringify({
          contractNumber: contract.contractNumber,
          action: 'CANCELLED',
          reason
        })
      }
    });

    return updated;
  });

  return updatedContract;
};

/**
 * Get rental reports/summary
 */
export const getRentalSummary = async (businessId, startDate, endDate) => {
  const dateFilter = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  const whereClause = {
    businessId,
    ...(startDate || endDate ? { createdAt: dateFilter } : {})
  };

  // Get contract counts by status
  const statusCounts = await prisma.rentalContract.groupBy({
    by: ['status'],
    where: whereClause,
    _count: { id: true }
  });

  // Get revenue totals
  const revenueTotals = await prisma.rentalContract.aggregate({
    where: {
      ...whereClause,
      status: { in: ['ACTIVE', 'RETURNED', 'CLOSED'] }
    },
    _sum: {
      subtotal: true,
      taxAmount: true,
      totalDue: true,
      totalPaid: true,
      penaltyAmount: true,
      damageCharges: true,
      depositAmount: true
    },
    _count: { id: true }
  });

  // Get most rented products
  const mostRentedProducts = await prisma.rentalContractItem.groupBy({
    by: ['productId'],
    where: {
      contract: whereClause
    },
    _sum: { quantity: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10
  });

  // Get product details for most rented
  const productIds = mostRentedProducts.map(p => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true, dailyRate: true }
  });

  const mostRentedWithDetails = mostRentedProducts.map(item => ({
    ...item,
    product: products.find(p => p.id === item.productId)
  }));

  // Get overdue count
  const overdueCount = await prisma.rentalContract.count({
    where: {
      businessId,
      status: { in: ['ACTIVE', 'OVERDUE'] },
      expectedReturnDate: { lt: new Date() }
    }
  });

  // Get active rentals value
  const activeRentalsValue = await prisma.rentalContract.aggregate({
    where: {
      businessId,
      status: { in: ['ACTIVE', 'OVERDUE', 'PARTIALLY_RETURNED'] }
    },
    _sum: { totalDue: true, depositAmount: true }
  });

  return {
    period: { startDate, endDate },
    statusBreakdown: statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {}),
    revenue: {
      totalContracts: revenueTotals._count.id,
      subtotal: revenueTotals._sum.subtotal || 0,
      tax: revenueTotals._sum.taxAmount || 0,
      totalRevenue: revenueTotals._sum.totalDue || 0,
      totalCollected: revenueTotals._sum.totalPaid || 0,
      penalties: revenueTotals._sum.penaltyAmount || 0,
      damageCharges: revenueTotals._sum.damageCharges || 0,
      deposits: revenueTotals._sum.depositAmount || 0
    },
    mostRentedProducts: mostRentedWithDetails,
    overdueCount,
    activeRentals: {
      count: await prisma.rentalContract.count({
        where: { businessId, status: { in: ['ACTIVE', 'OVERDUE', 'PARTIALLY_RETURNED'] } }
      }),
      value: activeRentalsValue._sum.totalDue || 0,
      depositsHeld: activeRentalsValue._sum.depositAmount || 0
    }
  };
};

/**
 * Update overdue status for contracts
 */
export const updateOverdueStatus = async (businessId = null) => {
  const now = new Date();
  
  const whereClause = {
    status: 'ACTIVE',
    expectedReturnDate: { lt: now }
  };

  if (businessId) {
    whereClause.businessId = businessId;
  }

  const result = await prisma.rentalContract.updateMany({
    where: whereClause,
    data: { status: 'OVERDUE' }
  });

  return result.count;
};

export default {
  createRentalContract,
  getAllRentalContracts,
  getRentalContractById,
  getOverdueRentals,
  processRentalReturn,
  closeRentalContract,
  cancelRentalContract,
  getRentalSummary,
  updateOverdueStatus
};