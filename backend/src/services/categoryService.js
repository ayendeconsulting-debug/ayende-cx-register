import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Category Service - Business logic for category operations
 * MULTI-TENANT VERSION - All operations filtered by businessId
 */

/**
 * Get all categories
 */
export const getAllCategories = async (businessId, includeInactive = false) => {
  const where = { businessId };
  
  if (!includeInactive) {
    where.isActive = true;
  }

  const categories = await prisma.category.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return categories;
};

/**
 * Get single category by ID
 */
export const getCategoryById = async (businessId, id) => {
  const category = await prisma.category.findFirst({
    where: { 
      id,
      businessId
    },
    include: {
      products: {
        where: { isActive: true },
        select: {
          id: true,
          sku: true,
          name: true,
          price: true,
          stockQuantity: true,
          isActive: true,
        },
      },
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  return category;
};

/**
 * Create new category
 */
export const createCategory = async (businessId, categoryData, userId) => {
  // Check if category name already exists in this business
  const existingCategory = await prisma.category.findFirst({
    where: { 
      name: categoryData.name,
      businessId
    },
  });

  if (existingCategory) {
    throw new AppError('Category with this name already exists', 400);
  }

  // Get the highest sort order and add 1 for this business
  const lastCategory = await prisma.category.findFirst({
    where: { businessId },
    orderBy: { sortOrder: 'desc' },
  });

  const sortOrder = categoryData.sortOrder || (lastCategory ? lastCategory.sortOrder + 1 : 1);

  const category = await prisma.category.create({
    data: {
      businessId,
      name: categoryData.name,
      description: categoryData.description || null,
      sortOrder: parseInt(sortOrder),
      isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CREATE',
      entityType: 'Category',
      entityId: category.id,
      changes: JSON.stringify(category),
    },
  });

  return category;
};

/**
 * Update category
 */
export const updateCategory = async (businessId, id, categoryData, userId) => {
  const existingCategory = await prisma.category.findFirst({
    where: { 
      id,
      businessId
    },
  });

  if (!existingCategory) {
    throw new AppError('Category not found', 404);
  }

  // Check if name is being changed and if it already exists in this business
  if (categoryData.name && categoryData.name !== existingCategory.name) {
    const nameExists = await prisma.category.findFirst({
      where: { 
        name: categoryData.name,
        businessId
      },
    });

    if (nameExists) {
      throw new AppError('Category with this name already exists', 400);
    }
  }

  const updateData = { ...categoryData };
  if (updateData.sortOrder) updateData.sortOrder = parseInt(updateData.sortOrder);

  const category = await prisma.category.update({
    where: { id },
    data: updateData,
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      entityType: 'Category',
      entityId: category.id,
      changes: JSON.stringify({
        before: existingCategory,
        after: category,
      }),
    },
  });

  return category;
};

/**
 * Delete category (soft delete)
 */
export const deleteCategory = async (businessId, id, userId) => {
  const category = await prisma.category.findFirst({
    where: { 
      id,
      businessId
    },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Check if category has products
  if (category._count.products > 0) {
    throw new AppError(
      'Cannot delete category with existing products. Please reassign or delete products first.',
      400
    );
  }

  // Soft delete
  const deletedCategory = await prisma.category.update({
    where: { id },
    data: { isActive: false },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DELETE',
      entityType: 'Category',
      entityId: id,
      changes: JSON.stringify({ categoryName: category.name }),
    },
  });

  return deletedCategory;
};

/**
 * Reorder categories
 */
export const reorderCategories = async (businessId, orderData, userId) => {
  // orderData should be array of { id, sortOrder }
  // Verify all categories belong to this business
  const categoryIds = orderData.map(item => item.id);
  const categories = await prisma.category.findMany({
    where: {
      id: { in: categoryIds },
      businessId
    }
  });

  if (categories.length !== categoryIds.length) {
    throw new AppError('One or more categories not found', 404);
  }

  const updates = orderData.map((item) =>
    prisma.category.update({
      where: { id: item.id },
      data: { sortOrder: parseInt(item.sortOrder) },
    })
  );

  await prisma.$transaction(updates);

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      entityType: 'Category',
      changes: JSON.stringify({ reorder: orderData }),
    },
  });

  return { message: 'Categories reordered successfully' };
};