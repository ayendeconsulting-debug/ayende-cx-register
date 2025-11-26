/**
 * File Upload Configuration
 * Handles CSV and Excel file uploads for bulk import
 */

import multer from 'multer';
import path from 'path';
import { AppError } from './errorHandler.js';

// Configure storage - use memory storage for processing
const storage = multer.memoryStorage();

// File filter - only allow CSV and Excel files
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/csv',
    'text/plain', // Some systems send CSV as text/plain
  ];

  const allowedExtensions = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError('Only CSV and Excel files are allowed', 400), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only 1 file at a time
  },
});

export default upload;
