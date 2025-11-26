/**
 * Bulk Upload Controller
 * Handles CSV/Excel imports for products and customers
 */

import Papa from 'papaparse';
import XLSX from 'xlsx';
import prisma from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import * as syncQueueService from '../services/syncQueueService.js';

/**
 * Parse uploaded file (CSV or Excel) to JSON
 */
const parseFile = (buffer, filename) => {
  const ext = filename.toLowerCase().split('.').pop();

  if (ext === 'csv') {
    // Parse CSV
    const csvString = buffer.toString('utf-8');
    const result = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, ''),
    });

    if (result.errors.length > 0) {
      console.warn('[BULK UPLOAD] CSV parsing warnings:', result.errors);
    }

    return result.data;
  } else if (ext === 'xlsx' || ext === 'xls') {
    // Parse Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
      raw: false,
    });

    // Normalize headers
    return data.map((row) => {
      const normalized = {};
      Object.keys(row).forEach((key) => {
        const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '');
        normalized[normalizedKey] = row[key];
      });
      return normalized;
    });
  } else {
    throw new AppError('Unsupported file format', 400);
  }
};

/**
 * Validate product row
 */
const validateProductRow = (row, index, existingSkus, categories) => {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!row.name || row.name.trim() === '') {
    errors.push(`Row ${index + 1}: Product name is required`);
  }

  if (!row.sku || row.sku.trim() === '') {
    errors.push(`Row ${index + 1}: SKU is required`);
  } else if (existingSkus.has(row.sku.trim().toUpperCase())) {
    errors.push(`Row ${index + 1}: SKU "${row.sku}" already exists`);
  }

  if (!row.price || isNaN(parseFloat(row.price))) {
    errors.push(`Row ${index + 1}: Valid price is required`);
  }

  if (!row.category || row.category.trim() === '') {
    errors.push(`Row ${index + 1}: Category is required`);
  } else {
    const categoryName = row.category.trim().toLowerCase();
    if (!categories.has(categoryName)) {
      warnings.push(`Row ${index + 1}: Category "${row.category}" not found - will be created`);
    }
  }

  // Optional field validation
  if (row.stockquantity && isNaN(parseInt(row.stockquantity))) {
    warnings.push(`Row ${index + 1}: Invalid stock quantity, defaulting to 0`);
  }

  if (row.costprice && isNaN(parseFloat(row.costprice))) {
    warnings.push(`Row ${index + 1}: Invalid cost price, will be skipped`);
  }

  return { errors, warnings };
};

/**
 * Validate customer row
 */
const validateCustomerRow = (row, index, existingEmails, existingPhones) => {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!row.firstname || row.firstname.trim() === '') {
    errors.push(`Row ${index + 1}: First name is required`);
  }

  if (!row.lastname || row.lastname.trim() === '') {
    errors.push(`Row ${index + 1}: Last name is required`);
  }

  // At least email or phone required
  if ((!row.email || row.email.trim() === '') && (!row.phone || row.phone.trim() === '')) {
    errors.push(`Row ${index + 1}: Either email or phone is required`);
  }

  // Check for duplicates
  if (row.email && row.email.trim() !== '') {
    const email = row.email.trim().toLowerCase();
    if (existingEmails.has(email)) {
      errors.push(`Row ${index + 1}: Email "${row.email}" already exists`);
    }
  }

  if (row.phone && row.phone.trim() !== '') {
    const phone = row.phone.trim();
    if (existingPhones.has(phone)) {
      errors.push(`Row ${index + 1}: Phone "${row.phone}" already exists`);
    }
  }

  // Email format validation
  if (row.email && row.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email.trim())) {
      warnings.push(`Row ${index + 1}: Invalid email format`);
    }
  }

  return { errors, warnings };
};

/**
 * @route   POST /api/v1/bulk-upload/products/preview
 * @desc    Preview product import (validate without saving)
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
export const previewProductUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const businessId = req.user.businessId;

  // Parse file
  const data = parseFile(req.file.buffer, req.file.originalname);

  if (data.length === 0) {
    throw new AppError('File is empty or has no valid data', 400);
  }

  // Get existing SKUs
  const existingProducts = await prisma.product.findMany({
    where: { businessId },
    select: { sku: true },
  });
  const existingSkus = new Set(existingProducts.map((p) => p.sku.toUpperCase()));

  // Get existing categories
  const existingCategories = await prisma.category.findMany({
    where: { businessId },
    select: { name: true },
  });
  const categories = new Set(existingCategories.map((c) => c.name.toLowerCase()));

  // Validate each row
  const allErrors = [];
  const allWarnings = [];
  const validRows = [];
  const newCategories = new Set();

  data.forEach((row, index) => {
    const { errors, warnings } = validateProductRow(row, index, existingSkus, categories);
    allErrors.push(...errors);
    allWarnings.push(...warnings);

    if (errors.length === 0) {
      validRows.push(row);
      // Track new categories
      const categoryName = row.category?.trim().toLowerCase();
      if (categoryName && !categories.has(categoryName)) {
        newCategories.add(row.category.trim());
      }
      // Add SKU to set to detect duplicates within file
      existingSkus.add(row.sku.trim().toUpperCase());
    }
  });

  return successResponse(res, {
    totalRows: data.length,
    validRows: validRows.length,
    invalidRows: data.length - validRows.length,
    errors: allErrors.slice(0, 50), // Limit errors shown
    warnings: allWarnings.slice(0, 50),
    newCategories: Array.from(newCategories),
    preview: validRows.slice(0, 10).map((row) => ({
      sku: row.sku,
      name: row.name,
      category: row.category,
      price: row.price,
      stockQuantity: row.stockquantity || 0,
    })),
  }, 'Preview generated successfully');
});

/**
 * @route   POST /api/v1/bulk-upload/products/import
 * @desc    Import products from CSV/Excel
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
export const importProducts = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const businessId = req.user.businessId;
  const userId = req.user.id;
  const { createCategories = true } = req.body;

  // Parse file
  const data = parseFile(req.file.buffer, req.file.originalname);

  if (data.length === 0) {
    throw new AppError('File is empty or has no valid data', 400);
  }

  // Get existing SKUs
  const existingProducts = await prisma.product.findMany({
    where: { businessId },
    select: { sku: true },
  });
  const existingSkus = new Set(existingProducts.map((p) => p.sku.toUpperCase()));

  // Get existing categories
  const existingCategories = await prisma.category.findMany({
    where: { businessId },
    select: { id: true, name: true },
  });
  const categoryMap = new Map(existingCategories.map((c) => [c.name.toLowerCase(), c.id]));

  const results = {
    success: 0,
    failed: 0,
    errors: [],
    createdCategories: [],
  };

  // Process each row
  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    try {
      // Skip if SKU exists
      if (existingSkus.has(row.sku?.trim().toUpperCase())) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: SKU "${row.sku}" already exists`);
        continue;
      }

      // Validate required fields
      if (!row.name || !row.sku || !row.price || !row.category) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Missing required fields (name, sku, price, category)`);
        continue;
      }

      // Get or create category
      let categoryId = categoryMap.get(row.category.trim().toLowerCase());

      if (!categoryId) {
        if (createCategories) {
          // Create new category
          const newCategory = await prisma.category.create({
            data: {
              businessId,
              name: row.category.trim(),
              description: `Auto-created from bulk import`,
              isActive: true,
            },
          });
          categoryId = newCategory.id;
          categoryMap.set(row.category.trim().toLowerCase(), categoryId);
          results.createdCategories.push(row.category.trim());
        } else {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Category "${row.category}" not found`);
          continue;
        }
      }

      // Create product
      const product = await prisma.product.create({
        data: {
          businessId,
          sku: row.sku.trim(),
          name: row.name.trim(),
          description: row.description?.trim() || null,
          categoryId,
          price: parseFloat(row.price),
          costPrice: row.costprice ? parseFloat(row.costprice) : null,
          stockQuantity: parseInt(row.stockquantity) || 0,
          lowStockAlert: parseInt(row.lowstockalert) || 10,
          unit: row.unit?.trim() || 'unit',
          barcode: row.barcode?.trim() || null,
          isActive: true,
          isTaxable: row.istaxable?.toLowerCase() !== 'false',
          loyaltyPoints: parseInt(row.loyaltypoints) || 0,
        },
      });

      // Create stock movement if initial stock > 0
      if (product.stockQuantity > 0) {
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            movementType: 'PURCHASE',
            quantity: product.stockQuantity,
            previousStock: 0,
            newStock: product.stockQuantity,
            reference: 'Bulk Import',
            notes: `Imported from ${req.file.originalname}`,
          },
        });
      }

      existingSkus.add(row.sku.trim().toUpperCase());
      results.success++;
    } catch (error) {
      console.error(`[BULK UPLOAD] Error on row ${i + 1}:`, error.message);
      results.failed++;
      results.errors.push(`Row ${i + 1}: ${error.message}`);
    }
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CREATE',
      entityType: 'Product',
      entityId: null,
      changes: JSON.stringify({
        action: 'Bulk Import',
        filename: req.file.originalname,
        totalRows: data.length,
        success: results.success,
        failed: results.failed,
      }),
    },
  });

  return successResponse(res, {
    totalProcessed: data.length,
    successful: results.success,
    failed: results.failed,
    errors: results.errors.slice(0, 50),
    createdCategories: results.createdCategories,
  }, `Import complete: ${results.success} products created, ${results.failed} failed`);
});

/**
 * @route   POST /api/v1/bulk-upload/customers/preview
 * @desc    Preview customer import (validate without saving)
 * @access  Private (ADMIN)
 */
export const previewCustomerUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const businessId = req.user.businessId;

  // Parse file
  const data = parseFile(req.file.buffer, req.file.originalname);

  if (data.length === 0) {
    throw new AppError('File is empty or has no valid data', 400);
  }

  // Get existing emails and phones
  const existingCustomers = await prisma.customer.findMany({
    where: { businessId, isAnonymous: false },
    select: { email: true, phone: true },
  });
  const existingEmails = new Set(
    existingCustomers.filter((c) => c.email).map((c) => c.email.toLowerCase())
  );
  const existingPhones = new Set(
    existingCustomers.filter((c) => c.phone).map((c) => c.phone)
  );

  // Validate each row
  const allErrors = [];
  const allWarnings = [];
  const validRows = [];

  data.forEach((row, index) => {
    const { errors, warnings } = validateCustomerRow(row, index, existingEmails, existingPhones);
    allErrors.push(...errors);
    allWarnings.push(...warnings);

    if (errors.length === 0) {
      validRows.push(row);
      // Add to sets to detect duplicates within file
      if (row.email) existingEmails.add(row.email.trim().toLowerCase());
      if (row.phone) existingPhones.add(row.phone.trim());
    }
  });

  return successResponse(res, {
    totalRows: data.length,
    validRows: validRows.length,
    invalidRows: data.length - validRows.length,
    errors: allErrors.slice(0, 50),
    warnings: allWarnings.slice(0, 50),
    preview: validRows.slice(0, 10).map((row) => ({
      firstName: row.firstname,
      lastName: row.lastname,
      email: row.email,
      phone: row.phone,
    })),
  }, 'Preview generated successfully');
});

/**
 * @route   POST /api/v1/bulk-upload/customers/import
 * @desc    Import customers from CSV/Excel
 * @access  Private (ADMIN)
 */
export const importCustomers = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const businessId = req.user.businessId;
  const userId = req.user.id;
  const { syncToCRM = true } = req.body;

  // Parse file
  const data = parseFile(req.file.buffer, req.file.originalname);

  if (data.length === 0) {
    throw new AppError('File is empty or has no valid data', 400);
  }

  // Get existing emails and phones
  const existingCustomers = await prisma.customer.findMany({
    where: { businessId, isAnonymous: false },
    select: { email: true, phone: true },
  });
  const existingEmails = new Set(
    existingCustomers.filter((c) => c.email).map((c) => c.email.toLowerCase())
  );
  const existingPhones = new Set(
    existingCustomers.filter((c) => c.phone).map((c) => c.phone)
  );

  const results = {
    success: 0,
    failed: 0,
    errors: [],
    syncQueued: 0,
  };

  // Process each row
  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    try {
      // Validate required fields
      if (!row.firstname || !row.lastname) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: First name and last name are required`);
        continue;
      }

      if (!row.email && !row.phone) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Either email or phone is required`);
        continue;
      }

      // Check for duplicates
      const email = row.email?.trim().toLowerCase();
      const phone = row.phone?.trim();

      if (email && existingEmails.has(email)) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Email "${row.email}" already exists`);
        continue;
      }

      if (phone && existingPhones.has(phone)) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: Phone "${row.phone}" already exists`);
        continue;
      }

      // Parse date of birth if provided
      let dateOfBirth = null;
      if (row.dateofbirth || row.dob) {
        const dobString = row.dateofbirth || row.dob;
        dateOfBirth = new Date(dobString);
        if (isNaN(dateOfBirth.getTime())) {
          dateOfBirth = null;
        }
      }

      // Create customer
      const customer = await prisma.customer.create({
        data: {
          businessId,
          firstName: row.firstname.trim(),
          lastName: row.lastname.trim(),
          email: email || null,
          phone: phone || null,
          dateOfBirth,
          address: row.address?.trim() || null,
          city: row.city?.trim() || null,
          state: row.state?.trim() || null,
          zipCode: row.zipcode?.trim() || row.postalcode?.trim() || null,
          marketingOptIn: row.marketingoptin?.toLowerCase() === 'true',
          notes: row.notes?.trim() || `Imported from ${req.file.originalname}`,
          loyaltyPoints: 0,
          totalSpent: 0,
          visitCount: 0,
          loyaltyTier: 'BRONZE',
          isActive: true,
          isAnonymous: false,
          customerSource: 'POS',
          syncState: syncToCRM ? 'PENDING' : 'SYNCED',
        },
      });

      // Queue for CRM sync if enabled
      if (syncToCRM) {
        try {
          await syncQueueService.addToQueue({
            businessId,
            entityType: 'customer',
            entityId: customer.id,
            operation: 'CREATE',
            priority: 'NORMAL',
          });
          results.syncQueued++;
        } catch (syncError) {
          console.warn(`[BULK UPLOAD] Failed to queue customer for sync:`, syncError.message);
        }
      }

      // Add to sets
      if (email) existingEmails.add(email);
      if (phone) existingPhones.add(phone);
      results.success++;
    } catch (error) {
      console.error(`[BULK UPLOAD] Error on row ${i + 1}:`, error.message);
      results.failed++;
      results.errors.push(`Row ${i + 1}: ${error.message}`);
    }
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CREATE',
      entityType: 'Customer',
      entityId: null,
      changes: JSON.stringify({
        action: 'Bulk Import',
        filename: req.file.originalname,
        totalRows: data.length,
        success: results.success,
        failed: results.failed,
        syncQueued: results.syncQueued,
      }),
    },
  });

  return successResponse(res, {
    totalProcessed: data.length,
    successful: results.success,
    failed: results.failed,
    syncQueued: results.syncQueued,
    errors: results.errors.slice(0, 50),
  }, `Import complete: ${results.success} customers created, ${results.failed} failed`);
});

/**
 * @route   GET /api/v1/bulk-upload/templates/products
 * @desc    Download product import template
 * @access  Private
 */
export const getProductTemplate = asyncHandler(async (req, res) => {
  const template = `sku,name,description,category,price,costPrice,stockQuantity,lowStockAlert,unit,barcode,isTaxable,loyaltyPoints
PROD001,Sample Product,Product description,General,29.99,15.00,100,10,unit,123456789,true,0
PROD002,Another Product,Another description,Food & Beverage,19.99,10.00,50,5,piece,,true,10`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=product_import_template.csv');
  res.send(template);
});

/**
 * @route   GET /api/v1/bulk-upload/templates/customers
 * @desc    Download customer import template
 * @access  Private
 */
export const getCustomerTemplate = asyncHandler(async (req, res) => {
  const template = `firstName,lastName,email,phone,dateOfBirth,address,city,state,zipCode,marketingOptIn,notes
John,Doe,john@example.com,+1234567890,1990-01-15,123 Main St,Toronto,ON,M5V1A1,true,VIP customer
Jane,Smith,jane@example.com,+0987654321,1985-06-20,456 Oak Ave,Vancouver,BC,V6B2W2,false,`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=customer_import_template.csv');
  res.send(template);
});
