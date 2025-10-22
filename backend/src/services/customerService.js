import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Customer Service - Business logic for CRM operations
 */

/**
 * Get all customers with filters
 */
export const getAllCustomers = async (filters = {}) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    loyaltyTier,
    sortBy = 'lastName',
    sortOrder = 'asc',
  } = filters;

  const skip = (page - 1) * limit;
  const where = { isActive: true };

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
export const getCustomerById = async (id) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
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
export const createCustomer = async (customerData, userId) => {
  // Check if email already exists
  if (customerData.email) {
    const existingEmail = await prisma.customer.findUnique({
      where: { email: customerData.email },
    });

    if (existingEmail) {
      throw new AppError('Customer with this email already exists', 400);
    }
  }

  // Check if phone already exists
  if (customerData.phone) {
    const existingPhone = await prisma.customer.findUnique({
      where: { phone: customerData.phone },
    });

    if (existingPhone) {
      throw new AppError('Customer with this phone number already exists', 400);
    }
  }

  const customer = await prisma.customer.create({
    data: customerData,
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
export const updateCustomer = async (id, customerData, userId) => {
  const existingCustomer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!existingCustomer) {
    throw new AppError('Customer not found', 404);
  }

  // Check email uniqueness if being changed
  if (customerData.email && customerData.email !== existingCustomer.email) {
    const emailExists = await prisma.customer.findUnique({
      where: { email: customerData.email },
    });

    if (emailExists) {
      throw new AppError('Email already in use', 400);
    }
  }

  // Check phone uniqueness if being changed
  if (customerData.phone && customerData.phone !== existingCustomer.phone) {
    const phoneExists = await prisma.customer.findUnique({
      where: { phone: customerData.phone },
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
export const deleteCustomer = async (id, userId) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
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
export const searchCustomer = async (searchTerm) => {
  const customers = await prisma.customer.findMany({
    where: {
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
