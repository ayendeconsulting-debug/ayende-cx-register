/**
 * Customer Service
 * Business logic for customer operations
 * MULTI-TENANT VERSION - All operations filtered by businessId
 */

import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { syncCustomerToCRM, fetchCustomerFromCRM } from './crmIntegrationService.js';
import * as syncQueueService from './syncQueueService.js';

/**
 * Create customer with CRM duplicate check
 */
export const createCustomer = async (businessId, customerData) => {
  try {
    // Check for duplicate by phone if provided
    if (customerData.phone) {
      const existingByPhone = await prisma.customer.findFirst({
        where: {
          businessId,
          phone: customerData.phone,
          isAnonymous: false,
        },
      });

      if (existingByPhone) {
        throw new AppError('Customer with this phone number already exists', 409);
      }

      // Check CRM for duplicate
      const crmCustomer = await fetchCustomerFromCRM(customerData.phone, businessId, 'phone');
      if (crmCustomer) {
        throw new AppError('Customer exists in CRM. Please import customer first.', 409);
      }
    }

    // Check for duplicate by email if provided
    if (customerData.email) {
      const existingByEmail = await prisma.customer.findFirst({
        where: {
          businessId,
          email: customerData.email,
          isAnonymous: false,
        },
      });

      if (existingByEmail) {
        throw new AppError('Customer with this email already exists', 409);
      }
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        businessId,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email || null,
        phone: customerData.phone || null,
        dateOfBirth: customerData.dateOfBirth ? new Date(customerData.dateOfBirth) : null,
        address: customerData.address || null,
        city: customerData.city || null,
        state: customerData.state || null,
        zipCode: customerData.zipCode || null,
        loyaltyPoints: 0,
        totalSpent: 0,
        visitCount: 0,
        loyaltyTier: 'BRONZE',
        marketingOptIn: customerData.marketingOptIn || false,
        isActive: true,
        notes: customerData.notes || null,
        
        // Phase 2 fields
        customerSource: 'POS',
        syncState: 'PENDING',
        isAnonymous: false,
      },
    });

    // Queue for CRM sync using syncQueueService
    await syncQueueService.addToQueue({
      businessId,
      entityType: 'customer',
      entityId: customer.id,
      operation: 'CREATE',
      priority: 'HIGH',
      payload: null,
    });

    console.log(`[CUSTOMER] Customer created: ${customer.id}`);

    return customer;
  } catch (error) {
    console.error('[CUSTOMER] Error creating customer:', error);
    throw error;
  }
};

/**
 * Get all customers with filters
 */
export const getAllCustomers = async (businessId, filters = {}) => {
  const {
    page = 1,
    limit = 20,
    search,
    loyaltyTier,
    isActive = true,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeAnonymous = false,
  } = filters;

  const skip = (page - 1) * limit;
  const where = { 
    businessId,
    isActive: isActive === 'all' ? undefined : isActive 
  };

  // Filter out anonymous customers by default
  if (!includeAnonymous) {
    where.isAnonymous = false;
  }

  if (loyaltyTier) where.loyaltyTier = loyaltyTier;

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        totalSpent: true,
        visitCount: true,
        lastVisit: true,
        memberSince: true,
        isActive: true,
        isAnonymous: true,
        customerSource: true,
        syncState: true,
        createdAt: true,
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get customer by ID
 */
export const getCustomerById = async (businessId, id) => {
  const customer = await prisma.customer.findFirst({
    where: {
      id,
      businessId,
    },
    include: {
      transactions: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          transactionNumber: true,
          total: true,
          createdAt: true,
          status: true,
        },
      },
      loyaltyTransactions: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  return customer;
};

/**
 * Update customer
 */
export const updateCustomer = async (businessId, id, updateData) => {
  const customer = await prisma.customer.findFirst({
    where: {
      id,
      businessId,
    },
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Don't allow updating anonymous customers' core fields
  if (customer.isAnonymous) {
    throw new AppError('Cannot update anonymous customer', 400);
  }

  // Check for duplicate email if being updated
  if (updateData.email && updateData.email !== customer.email) {
    const existingEmail = await prisma.customer.findFirst({
      where: {
        businessId,
        email: updateData.email,
        id: { not: id },
      },
    });

    if (existingEmail) {
      throw new AppError('Email already in use by another customer', 409);
    }
  }

  // Check for duplicate phone if being updated
  if (updateData.phone && updateData.phone !== customer.phone) {
    const existingPhone = await prisma.customer.findFirst({
      where: {
        businessId,
        phone: updateData.phone,
        id: { not: id },
      },
    });

    if (existingPhone) {
      throw new AppError('Phone already in use by another customer', 409);
    }
  }

  const updatedCustomer = await prisma.customer.update({
    where: { id },
    data: {
      ...updateData,
      dateOfBirth: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : undefined,
      syncState: 'PENDING', // Mark for sync
    },
  });

  // Queue for CRM sync
  await prisma.syncQueue.create({
    data: {
      businessId,
      entityType: 'customer',
      entityId: id,
      operation: 'UPDATE',
      priority: 'NORMAL', // UPDATE operations can remain NORMAL priority
      status: 'PENDING',
      payload: {
        customerId: id,
        updatedFields: Object.keys(updateData),
      },
    },
  });

  console.log(`[CUSTOMER] Customer updated: ${id}`);

  return updatedCustomer;
};

/**
 * Delete (deactivate) customer
 */
export const deleteCustomer = async (businessId, id) => {
  const customer = await prisma.customer.findFirst({
    where: {
      id,
      businessId,
    },
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  if (customer.isAnonymous) {
    throw new AppError('Cannot delete anonymous customer', 400);
  }

  // Soft delete - just deactivate
  const deactivated = await prisma.customer.update({
    where: { id },
    data: {
      isActive: false,
      syncState: 'PENDING',
    },
  });

  // Queue for CRM sync
  await prisma.syncQueue.create({
    data: {
      businessId,
      entityType: 'customer',
      entityId: id,
      operation: 'DELETE',
      priority: 'NORMAL', // DELETE operations can remain NORMAL priority
      status: 'PENDING',
      payload: {
        customerId: id,
      },
    },
  });

  console.log(`[CUSTOMER] Customer deactivated: ${id}`);

  return deactivated;
};

/**
 * Get customer analytics
 */
export const getCustomerAnalytics = async (businessId) => {
  const [totalCustomers, activeCustomers, loyaltyBreakdown, topSpenders] = await Promise.all([
    prisma.customer.count({
      where: {
        businessId,
        isAnonymous: false,
      },
    }),
    prisma.customer.count({
      where: {
        businessId,
        isActive: true,
        isAnonymous: false,
      },
    }),
    prisma.customer.groupBy({
      by: ['loyaltyTier'],
      where: {
        businessId,
        isAnonymous: false,
      },
      _count: true,
    }),
    prisma.customer.findMany({
      where: {
        businessId,
        isAnonymous: false,
      },
      orderBy: {
        totalSpent: 'desc',
      },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        totalSpent: true,
        visitCount: true,
        loyaltyTier: true,
      },
    }),
  ]);

  return {
    totalCustomers,
    activeCustomers,
    loyaltyBreakdown,
    topSpenders,
  };
};

/**
 * Search customers by phone or email
 */
export const searchCustomers = async (businessId, query) => {
  const customers = await prisma.customer.findMany({
    where: {
      businessId,
      isAnonymous: false,
      OR: [
        { phone: { contains: query } },
        { email: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 10,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      loyaltyPoints: true,
      loyaltyTier: true,
    },
  });

  return customers;
};

export default {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerAnalytics,
  searchCustomers,
};
