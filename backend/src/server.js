import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import shiftRoutes from './routes/shiftRoutes.js';
import stockAdjustmentRoutes from './routes/stockAdjustmentRoutes.js';
import registrationRoutes from './routes/registration.routes.js';
import invitationRoutes from './routes/invitation.routes.js';
// ============================================
// 🔗 INTEGRATION: Import integration routes
// ============================================
import integrationRoutes from './routes/integration.routes.js';
// ============================================
// 🔗 PHASE 2C: Import webhook routes
// ============================================
import customerSyncRoutes from './routes/integration/customerSync.js';
import * as syncJob from './cron/syncJob.js';


// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
const API_VERSION = process.env.API_VERSION || 'v1';
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/products`, productRoutes);
app.use(`/api/${API_VERSION}/categories`, categoryRoutes);
app.use(`/api/${API_VERSION}/transactions`, transactionRoutes);
app.use(`/api/${API_VERSION}/customers`, customerRoutes);
app.use('/api/v1/shifts', shiftRoutes);
app.use('/api/v1/stock-adjustments', stockAdjustmentRoutes);
app.use('/api/v1/registration', registrationRoutes);
app.use('/api/v1/invitations', invitationRoutes);

// ============================================
// 🔗 INTEGRATION: Register integration routes
// ============================================
app.use('/api/v1/integration', integrationRoutes);
// ============================================
// 🔗 PHASE 2C: Register webhook routes
// ============================================
app.use('/api/integration', customerSyncRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
    ╔═══════════════════════════════════════╗
    ║   Ayende-CX Payment Register System       ║
    ║   Backend Server Running                  ║
    ╠═══════════════════════════════════════╣
    ║   Environment: ${process.env.NODE_ENV?.padEnd(24) || 'development'.padEnd(24)}║
    ║   Port: ${String(PORT).padEnd(32)}║
    ║   API: /api/${API_VERSION.padEnd(30)}║
    ║   🔗 Integration: ENABLED                 ║
    ║   🔗 Webhooks: ENABLED (Phase 2C)         ║
    ║   🔗 Sync Job: ENABLED (Phase 2D)         ║
    ╚═══════════════════════════════════════╝
  `);
  
  // ============================================
  // PHASE 2D: Initialize sync cron job
  // ============================================
  if (process.env.ENABLE_REALTIME_SYNC === 'true') {
    try {
      syncJob.initializeSyncJob();
      console.log('  ✓ Sync job initialized successfully\n');
    } catch (error) {
      console.error('  ✗ Failed to initialize sync job:', error.message);
    }
  } else {
    console.log('  ⚠ Sync job disabled (ENABLE_REALTIME_SYNC=false)\n');
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

export default app;