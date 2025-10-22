import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse, createdResponse } from '../utils/response.js';
import * as categoryService from '../services/categoryService.js';

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories
 * @access  Private
 */
export const getCategories = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const categories = await categoryService.getAllCategories(includeInactive);
  return successResponse(res, categories, 'Categories retrieved successfully');
});

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get single category by ID
 * @access  Private
 */
export const getCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  return successResponse(res, category, 'Category retrieved successfully');
});

/**
 * @route   POST /api/v1/categories
 * @desc    Create new category
 * @access  Private (ADMIN only)
 */
export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body, req.user.id);
  return createdResponse(res, category, 'Category created successfully');
});

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category
 * @access  Private (ADMIN only)
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body, req.user.id);
  return successResponse(res, category, 'Category updated successfully');
});

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category (soft delete)
 * @access  Private (ADMIN only)
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id, req.user.id);
  return successResponse(res, null, 'Category deleted successfully');
});

/**
 * @route   POST /api/v1/categories/reorder
 * @desc    Reorder categories
 * @access  Private (ADMIN only)
 */
export const reorderCategories = asyncHandler(async (req, res) => {
  const result = await categoryService.reorderCategories(req.body, req.user.id);
  return successResponse(res, result, 'Categories reordered successfully');
});
