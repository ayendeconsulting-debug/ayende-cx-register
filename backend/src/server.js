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
import integrationWebhookRoutes from './routes/integration-webhooks.js';
import * as syncJob from './cron/syncJob.js';
import { initializeReconciliationJob } from './cron/reconciliationJob.js';
import reconciliationRoutes from './routes/reconciliationRoutes.js';
import { initializeEmailJobs } from './cron/emailJobs.js';


// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - Production ready
const corsOptions = {
  origin: function (origin, callback) {
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, use strict origin checking
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : [];
    
    // Add regex for all subdomains of ayendecx.com
    const allowedPatterns = [
      /^https:\/\/[\w-]+\.ayendecx\.com$/,  // All subdomains
      /^https:\/\/ayendecx\.com$/,           // Root domain
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches patterns
    const isAllowed = allowedOrigins.includes(origin) || 
                     allowedPatterns.some(pattern => pattern.test(origin));
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Webhook-Signature',
    'X-Tenant-ID',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint - Enhanced for Railway
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    
    res.status(200).json({
      status: 'ok',
      success: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0',
      features: {
        crmSync: process.env.ENABLE_REALTIME_SYNC === 'true',
        webhooks: process.env.ENABLE_CRM_SYNC === 'true',
        emailNotifications: process.env.ENABLE_RECEIPT_EMAILS === 'true',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      success: false,
      message: 'Service unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Ayende-CX POS API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV,
    documentation: '/api/v1/docs',
    health: '/health',
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
app.use('/api/integration/webhook', integrationWebhookRoutes);
app.use('/api/v1/reconciliation', reconciliationRoutes);

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
  // ============================================
// PHASE 2E: Initialize reconciliation cron job
// ============================================
    try {
      initializeReconciliationJob();
      console.log('  ✓ Reconciliation job initialized successfully\n');
    } catch (error) {
      console.error('  ✗ Failed to initialize reconciliation job:', error.message);
    }
        // ============================================
    // PHASE 2F: Initialize email cron jobs
    // ============================================
  if (process.env.ENABLE_EOD_REPORTS === 'true' || process.env.ENABLE_LOW_STOCK_ALERTS === 'true') {
    try {
      initializeEmailJobs();
      console.log('  ✓ Email jobs initialized successfully\n');
    } catch (error) {
      console.error('  ✗ Failed to initialize email jobs:', error.message);
    }
    } else {
      console.log('  ⚠  Email jobs disabled\n');
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

export default app;