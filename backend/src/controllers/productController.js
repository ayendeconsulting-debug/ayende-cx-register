import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse, createdResponse, paginatedResponse } from '../utils/response.js';
import * as productService from '../services/productService.js';

/**
 * @route   GET /api/v1/products
 * @desc    Get all products with filters
 * @access  Private
 */
export const getProducts = asyncHandler(async (req, res) => {
  const filters = {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    categoryId: req.query.categoryId,
    isActive: req.query.isActive,
    lowStock: req.query.lowStock === 'true',
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
  };

  const result = await productService.getAllProducts(req.user.businessId, filters);

  return paginatedResponse(
    res,
    result.products,
    result.page,
    result.limit,
    result.total,
    'Products retrieved successfully'
  );
});

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get single product by ID
 * @access  Private
 */
export const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.user.businessId, req.params.id);
  return successResponse(res, product, 'Product retrieved successfully');
});

/**
 * @route   GET /api/v1/products/sku/:sku
 * @desc    Get product by SKU
 * @access  Private
 */
export const getProductBySku = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySku(req.user.businessId, req.params.sku);
  return successResponse(res, product, 'Product retrieved successfully');
});

/**
 * @route   GET /api/v1/products/barcode/:barcode
 * @desc    Get product by barcode (for scanning)
 * @access  Private
 */
export const getProductByBarcode = asyncHandler(async (req, res) => {
  const product = await productService.getProductByBarcode(req.user.businessId, req.params.barcode);
  return successResponse(res, product, 'Product retrieved successfully');
});

/**
 * @route   POST /api/v1/products
 * @desc    Create new product
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.user.businessId, req.body, req.user.id);
  return createdResponse(res, product, 'Product created successfully');
});

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.user.businessId, req.params.id, req.body, req.user.id);
  return successResponse(res, product, 'Product updated successfully');
});

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product (soft delete)
 * @access  Private (ADMIN only)
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.user.businessId, req.params.id, req.user.id);
  return successResponse(res, null, 'Product deleted successfully');
});

/**
 * @route   POST /api/v1/products/:id/adjust-stock
 * @desc    Adjust product stock
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
export const adjustStock = asyncHandler(async (req, res) => {
  const result = await productService.adjustStock(req.user.businessId, req.params.id, req.body, req.user.id);
  return successResponse(res, result, 'Stock adjusted successfully');
});

/**
 * @route   GET /api/v1/products/alerts/low-stock
 * @desc    Get low stock products
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
export const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await productService.getLowStockProducts(req.user.businessId);
  return successResponse(res, products, 'Low stock products retrieved successfully');
});

/**
 * @route   GET /api/v1/products/:id/stock-history
 * @desc    Get stock movement history for a product
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
export const getStockHistory = asyncHandler(async (req, res) => {
  const limit = req.query.limit || 50;
  const movements = await productService.getProductStockHistory(req.user.businessId, req.params.id, limit);
  return successResponse(res, movements, 'Stock history retrieved successfully');
});