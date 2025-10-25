import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Customer Service - Business logic for CRM operations
 * MULTI-TENANT VERSION - All operations filtered by businessId
 */

/**
 * Get all customers with filters
 */
export const getAllCustomers = async (businessId, filters = {}) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    loyaltyTier,
    sortBy = 'lastName',
    sortOrder = 'asc',
  } = filters;

  const skip = (page - 1) * limit;
  const where = { 
    businessId,
    isActive: true 
  };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (loyaltyTier) {
    where.loyaltyTier = loyaltyTier;
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
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
      businessId
    },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          transactionNumber: true,
          total: true,
          createdAt: true,
          status: true,
        },
      },
      loyaltyHistory: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  return customer;
};

/**
 * Create customer
 */
export const createCustomer = async (businessId, customerData, userId) => {
  // Check if email already exists in this business
  if (customerData.email) {
    const existingEmail = await prisma.customer.findFirst({
      where: { 
        email: customerData.email,
        businessId
      },
    });

    if (existingEmail) {
      throw new AppError('Customer with this email already exists', 400);
    }
  }

  // Check if phone already exists in this business
  if (customerData.phone) {
    const existingPhone = await prisma.customer.findFirst({
      where: { 
        phone: customerData.phone,
        businessId
      },
    });

    if (existingPhone) {
      throw new AppError('Customer with this phone number already exists', 400);
    }
  }

  const customer = await prisma.customer.create({
    data: {
      businessId,
      ...customerData
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CREATE',
      entityType: 'Customer',
      entityId: customer.id,
      changes: JSON.stringify(customer),
    },
  });

  return customer;
};

/**
 * Update customer
 */
export const updateCustomer = async (businessId, id, customerData, userId) => {
  const existingCustomer = await prisma.customer.findFirst({
    where: { 
      id,
      businessId
    },
  });

  if (!existingCustomer) {
    throw new AppError('Customer not found', 404);
  }

  // Check email uniqueness if being changed
  if (customerData.email && customerData.email !== existingCustomer.email) {
    const emailExists = await prisma.customer.findFirst({
      where: { 
        email: customerData.email,
        businessId
      },
    });

    if (emailExists) {
      throw new AppError('Email already in use', 400);
    }
  }

  // Check phone uniqueness if being changed
  if (customerData.phone && customerData.phone !== existingCustomer.phone) {
    const phoneExists = await prisma.customer.findFirst({
      where: { 
        phone: customerData.phone,
        businessId
      },
    });

    if (phoneExists) {
      throw new AppError('Phone number already in use', 400);
    }
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: customerData,
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      entityType: 'Customer',
      entityId: id,
      changes: JSON.stringify({
        before: existingCustomer,
        after: customer,
      }),
    },
  });

  return customer;
};

/**
 * Delete customer (soft delete)
 */
export const deleteCustomer = async (businessId, id, userId) => {
  const customer = await prisma.customer.findFirst({
    where: { 
      id,
      businessId
    },
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const deletedCustomer = await prisma.customer.update({
    where: { id },
    data: { isActive: false },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DELETE',
      entityType: 'Customer',
      entityId: id,
      changes: JSON.stringify({
        name: `${customer.firstName} ${customer.lastName}`,
      }),
    },
  });

  return deletedCustomer;
};

/**
 * Search customers by phone or email
 */
export const searchCustomer = async (businessId, searchTerm) => {
  const customers = await prisma.customer.findMany({
    where: {
      businessId,
      isActive: true,
      OR: [
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm } },
      ],
    },
    take: 10,
  });

  return customers;
};