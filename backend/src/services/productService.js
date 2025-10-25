import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Product Service - Business logic for product operations
 * MULTI-TENANT VERSION - All operations filtered by businessId
 */

/**
 * Get all products with filtering, pagination, and search
 */
export const getAllProducts = async (businessId, filters = {}) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    categoryId = '',
    isActive = null,
    lowStock = false,
    sortBy = 'name',
    sortOrder = 'asc',
  } = filters;

  const skip = (page - 1) * limit;

  // Build where clause
  const where = { businessId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (isActive !== null) {
    where.isActive = isActive === 'true';
  }

  if (lowStock) {
    where.stockQuantity = { lte: prisma.product.fields.lowStockAlert };
  }

  // Get products with category info
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get single product by ID
 */
export const getProductById = async (businessId, id) => {
  const product = await prisma.product.findFirst({
    where: { 
      id,
      businessId
    },
    include: {
      category: true,
      stockMovements: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
};

/**
 * Get product by SKU
 */
export const getProductBySku = async (businessId, sku) => {
  const product = await prisma.product.findFirst({
    where: { 
      sku,
      businessId
    },
    include: {
      category: true,
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
};

/**
 * Get product by barcode
 */
export const getProductByBarcode = async (businessId, barcode) => {
  const product = await prisma.product.findFirst({
    where: { 
      barcode,
      businessId
    },
    include: {
      category: true,
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
};

/**
 * Create new product
 */
export const createProduct = async (businessId, productData, userId) => {
  // Check if SKU already exists in this business
  const existingSku = await prisma.product.findFirst({
    where: { 
      sku: productData.sku,
      businessId
    },
  });

  if (existingSku) {
    throw new AppError('Product with this SKU already exists', 400);
  }

  // Check if barcode already exists in this business (if provided)
  if (productData.barcode) {
    const existingBarcode = await prisma.product.findFirst({
      where: { 
        barcode: productData.barcode,
        businessId
      },
    });

    if (existingBarcode) {
      throw new AppError('Product with this barcode already exists', 400);
    }
  }

  // Verify category exists in this business
  const category = await prisma.category.findFirst({
    where: { 
      id: productData.categoryId,
      businessId
    },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Create product
  const product = await prisma.product.create({
    data: {
      businessId,
      ...productData,
      price: parseFloat(productData.price),
      costPrice: productData.costPrice ? parseFloat(productData.costPrice) : null,
      stockQuantity: parseInt(productData.stockQuantity) || 0,
      lowStockAlert: parseInt(productData.lowStockAlert) || 10,
      loyaltyPoints: parseInt(productData.loyaltyPoints) || 0,
    },
    include: {
      category: true,
    },
  });

  // Create initial stock movement if stock quantity > 0
  if (product.stockQuantity > 0) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        movementType: 'PURCHASE',
        quantity: product.stockQuantity,
        previousStock: 0,
        newStock: product.stockQuantity,
        reference: 'Initial Stock',
        notes: 'Product creation',
      },
    });
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CREATE',
      entityType: 'Product',
      entityId: product.id,
      changes: JSON.stringify(product),
    },
  });

  return product;
};

/**
 * Update product
 */
export const updateProduct = async (businessId, id, productData, userId) => {
  // Check if product exists in this business
  const existingProduct = await prisma.product.findFirst({
    where: { 
      id,
      businessId
    },
  });

  if (!existingProduct) {
    throw new AppError('Product not found', 404);
  }

  // Check if SKU is being changed and if it already exists in this business
  if (productData.sku && productData.sku !== existingProduct.sku) {
    const existingSku = await prisma.product.findFirst({
      where: { 
        sku: productData.sku,
        businessId
      },
    });

    if (existingSku) {
      throw new AppError('Product with this SKU already exists', 400);
    }
  }

  // Check if barcode is being changed and if it already exists in this business
  if (productData.barcode && productData.barcode !== existingProduct.barcode) {
    const existingBarcode = await prisma.product.findFirst({
      where: { 
        barcode: productData.barcode,
        businessId
      },
    });

    if (existingBarcode) {
      throw new AppError('Product with this barcode already exists', 400);
    }
  }

  // Verify category exists in this business if being changed
  if (productData.categoryId && productData.categoryId !== existingProduct.categoryId) {
    const category = await prisma.category.findFirst({
      where: { 
        id: productData.categoryId,
        businessId
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }
  }

  // Prepare update data
  const updateData = { ...productData };
  if (updateData.price) updateData.price = parseFloat(updateData.price);
  if (updateData.costPrice) updateData.costPrice = parseFloat(updateData.costPrice);
  if (updateData.lowStockAlert) updateData.lowStockAlert = parseInt(updateData.lowStockAlert);
  if (updateData.loyaltyPoints) updateData.loyaltyPoints = parseInt(updateData.loyaltyPoints);

  // Update product
  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      entityType: 'Product',
      entityId: product.id,
      changes: JSON.stringify({
        before: existingProduct,
        after: product,
      }),
    },
  });

  return product;
};

/**
 * Delete product (soft delete)
 */
export const deleteProduct = async (businessId, id, userId) => {
  const product = await prisma.product.findFirst({
    where: { 
      id,
      businessId
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Soft delete by setting isActive to false
  const deletedProduct = await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DELETE',
      entityType: 'Product',
      entityId: id,
      changes: JSON.stringify({ productName: product.name }),
    },
  });

  return deletedProduct;
};

/**
 * Adjust product stock
 */
export const adjustStock = async (businessId, id, adjustmentData, userId) => {
  const { quantity, movementType, reference, notes } = adjustmentData;

  const product = await prisma.product.findFirst({
    where: { 
      id,
      businessId
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const previousStock = product.stockQuantity;
  let newStock;

  // Calculate new stock based on movement type
  switch (movementType) {
    case 'PURCHASE':
    case 'RETURN':
      newStock = previousStock + parseInt(quantity);
      break;
    case 'SALE':
    case 'DAMAGE':
      newStock = previousStock - parseInt(quantity);
      break;
    case 'ADJUSTMENT':
      // For adjustments, quantity can be positive or negative
      newStock = previousStock + parseInt(quantity);
      break;
    default:
      throw new AppError('Invalid movement type', 400);
  }

  // Prevent negative stock
  if (newStock < 0) {
    throw new AppError('Insufficient stock for this operation', 400);
  }

  // Update product stock and create stock movement in a transaction
  const [updatedProduct, stockMovement] = await prisma.$transaction([
    prisma.product.update({
      where: { id },
      data: { stockQuantity: newStock },
    }),
    prisma.stockMovement.create({
      data: {
        productId: id,
        movementType,
        quantity: parseInt(quantity),
        previousStock,
        newStock,
        reference: reference || '',
        notes: notes || '',
      },
    }),
  ]);

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      entityType: 'Product',
      entityId: id,
      changes: JSON.stringify({
        stockAdjustment: {
          previousStock,
          newStock,
          quantity,
          movementType,
        },
      }),
    },
  });

  return {
    product: updatedProduct,
    stockMovement,
  };
};

/**
 * Get low stock products
 */
export const getLowStockProducts = async (businessId) => {
  // Use raw SQL comparison since Prisma doesn't support comparing two columns directly
  const products = await prisma.$queryRaw`
    SELECT p.*, 
           json_build_object('id', c.id, 'name', c.name) as category
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    WHERE p."businessId" = ${businessId}
      AND p."isActive" = true 
      AND p."stockQuantity" <= p."lowStockAlert"
    ORDER BY p."stockQuantity" ASC
  `;

  return products;
};

/**
 * Get stock movements for a product
 */
export const getProductStockHistory = async (businessId, id, limit = 50) => {
  const product = await prisma.product.findFirst({
    where: { 
      id,
      businessId
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const movements = await prisma.stockMovement.findMany({
    where: { productId: id },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit),
  });

  return movements;
};