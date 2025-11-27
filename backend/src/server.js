import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { 
  sanitizeInput, 
  detectSuspiciousActivity, 
  preventParameterPollution,
  addSecurityHeaders
} from './middleware/securityMiddleware.js';

// ============================================
// CORE ROUTES
// ============================================
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import userRoutes from './routes/userRoutes.js';
import businessSettingsRoutes from './routes/businessSettingsRoutes.js';
// ============================================
// RENTAL MANAGEMENT ROUTES
// ============================================
import rentalRoutes from './routes/rentalRoutes.js';

// ============================================
// SHIFT & STOCK MANAGEMENT ROUTES
// ============================================
import shiftRoutes from './routes/shiftRoutes.js';
import stockAdjustmentRoutes from './routes/stockAdjustmentRoutes.js';

// ============================================
// BULK UPLOAD ROUTES
// ============================================
import bulkUploadRoutes from './routes/bulkUploadRoutes.js';

// ============================================
// REGISTRATION & INVITATION ROUTES
// ============================================
import registrationRoutes from './routes/registration.routes.js';
import invitationRoutes from './routes/invitation.routes.js';

// ============================================
// INTEGRATION ROUTES
// ============================================
import integrationRoutes from './routes/integration.routes.js';
import customerSyncRoutes from './routes/integration/customerSync.js';
import integrationWebhookRoutes from './routes/integration-webhooks.js';
import webhookRoutes from './routes/webhooks.js';

// ============================================
// ADMIN & RECONCILIATION ROUTES
// ============================================
import reconciliationRoutes from './routes/reconciliationRoutes.js';
import adminRoutes from './routes/admin.js';

// ============================================
// CRON JOBS
// ============================================
import * as syncJob from './cron/syncJob.js';
import { initializeReconciliationJob } from './cron/reconciliationJob.js';
import { initializeEmailJobs } from './cron/emailJobs.js';
import { initCrmSyncScheduler } from './jobs/crmSyncScheduler.js';
import { initializeRentalOverdueJob } from './cron/rentalOverdueJob.js';


// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.set('trust proxy', 1);  // Add this line

// Security middleware - Enhanced configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for POS frontend
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  xssFilter: true, // Enable XSS filter (re-enabled)
  noSniff: true,
  frameguard: {
    action: 'sameorigin'
  }
}));

// Rate limiting - Prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiter to all API routes
app.use('/api/', generalLimiter);

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

// Additional security middleware
app.use(addSecurityHeaders);
app.use(preventParameterPollution);
app.use(sanitizeInput);
app.use(detectSuspiciousActivity);

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
        shifts: true,
        stockAdjustments: true,
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

// ============================================
// API ROUTES REGISTRATION
// ============================================
const API_VERSION = process.env.API_VERSION || 'v1';

// Core business routes
app.use(`/api/${API_VERSION}/auth`, authLimiter, authRoutes); // Rate limit auth endpoints
app.use(`/api/${API_VERSION}/products`, productRoutes);
app.use(`/api/${API_VERSION}/categories`, categoryRoutes);
app.use(`/api/${API_VERSION}/transactions`, transactionRoutes);
app.use(`/api/${API_VERSION}/customers`, customerRoutes);
app.use(`/api/${API_VERSION}/businesses`, businessRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/business-settings`, businessSettingsRoutes);

// Shift and stock management routes
app.use(`/api/${API_VERSION}/shifts`, shiftRoutes);
app.use(`/api/${API_VERSION}/stock-adjustments`, stockAdjustmentRoutes);
app.use(`/api/${API_VERSION}/bulk-upload`, bulkUploadRoutes);
app.use(`/api/${API_VERSION}/rentals`, rentalRoutes);

// Registration and invitation routes
app.use(`/api/${API_VERSION}/registration`, registrationRoutes);
app.use(`/api/${API_VERSION}/invitations`, invitationRoutes);

// Integration routes
app.use(`/api/${API_VERSION}/integration`, integrationRoutes);
app.use('/api/integration', customerSyncRoutes);
app.use('/api/integration/webhook', integrationWebhookRoutes);
app.use(`/api/${API_VERSION}/webhooks`, webhookRoutes);
app.use(`/api/${API_VERSION}/reconciliation`, reconciliationRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// ============================================
// BASH EVENTS PRODUCT IMPORT - One-time endpoint
// ============================================
app.post('/api/v1/admin/import-bash-products', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const BASH_EVENTS_TENANT_ID = process.env.BASH_EVENTS_TENANT_ID || '0cc33bf2-f1b5-4e72-8743-cd39a2cb8f98';
    
    const categories = [
      { name: 'Tableware', description: 'Plates, cutlery, glasses, and serving items' },
      { name: 'Furniture', description: 'Tables, chairs, and seating arrangements' },
      { name: 'Lighting', description: 'Uplighting, chandeliers, and decorative lighting' },
      { name: 'Decor', description: 'Centerpieces, backdrops, and decorative items' },
      { name: 'Linens', description: 'Tablecloths, napkins, and chair covers' },
      { name: 'Serving Equipment', description: 'Chafing dishes and serving tools' },
      { name: 'Nigerian Cuisine', description: 'Traditional Nigerian dishes and party trays' },
      { name: 'English Cuisine', description: 'Traditional English dishes and catering' },
      { name: 'Beverages', description: 'Drinks and beverage packages' },
    ];

    const products = [
      { name: 'White China Dinner Plates (10.5")', category: 'Tableware', price: 500, stock: 500, description: 'Classic white china dinner plates' },
      { name: 'Gold Rim Charger Plates', category: 'Tableware', price: 800, stock: 200, description: 'Elegant gold-rimmed charger plates' },
      { name: 'Premium Stainless Steel Cutlery Set', category: 'Tableware', price: 300, stock: 300, description: 'Complete cutlery set' },
      { name: 'Crystal Wine Glasses', category: 'Tableware', price: 400, stock: 400, description: 'Premium crystal wine glasses' },
      { name: 'Champagne Flutes', category: 'Tableware', price: 400, stock: 300, description: 'Elegant champagne flutes' },
      { name: 'Gold Plastic Forks (100-pack)', category: 'Tableware', price: 3500, stock: 50, description: 'Disposable gold forks, 100 pack' },
      { name: 'White Linen Napkins', category: 'Tableware', price: 200, stock: 600, description: 'Premium white linen napkins' },
      { name: 'Glass Water Goblets', category: 'Tableware', price: 350, stock: 400, description: 'Classic glass goblets' },
      { name: 'White Chiavari Chairs', category: 'Furniture', price: 2500, stock: 200, description: 'Classic white chiavari chairs' },
      { name: 'Gold Chiavari Chairs', category: 'Furniture', price: 2500, stock: 150, description: 'Luxurious gold chiavari chairs' },
      { name: '6ft Rectangular Tables', category: 'Furniture', price: 5000, stock: 80, description: '6-foot rectangular tables' },
      { name: '5ft Round Tables (seats 8)', category: 'Furniture', price: 6000, stock: 60, description: 'Round tables seating 8' },
      { name: 'LED Uplighting (per unit)', category: 'Lighting', price: 8000, stock: 50, description: 'Wireless LED uplighting' },
      { name: 'Fairy String Lights (100ft)', category: 'Lighting', price: 12000, stock: 40, description: 'Decorative fairy lights' },
      { name: 'Crystal Chandelier', category: 'Lighting', price: 35000, stock: 10, description: 'Elegant crystal chandelier' },
      { name: 'Floral Centerpiece (Large)', category: 'Decor', price: 12000, stock: 50, description: 'Large floral centerpiece' },
      { name: 'White Fabric Backdrop (20ft)', category: 'Decor', price: 25000, stock: 15, description: 'White draping backdrop' },
      { name: 'White Tablecloth (6ft)', category: 'Linens', price: 2500, stock: 150, description: 'Premium white tablecloth' },
      { name: 'White Chair Covers', category: 'Linens', price: 800, stock: 300, description: 'Universal spandex covers' },
      { name: 'Chafing Dish Set', category: 'Serving Equipment', price: 8000, stock: 40, description: 'Complete chafing dish set' },
      { name: 'Jollof Rice (Party Tray)', category: 'Nigerian Cuisine', price: 45000, stock: 0, description: 'Nigerian jollof rice - serves 20-25' },
      { name: 'Fried Rice (Party Tray)', category: 'Nigerian Cuisine', price: 45000, stock: 0, description: 'Nigerian fried rice - serves 20-25' },
      { name: 'Pounded Yam with Egusi', category: 'Nigerian Cuisine', price: 55000, stock: 0, description: 'Pounded yam with egusi - serves 15-20' },
      { name: 'Pepper Soup (Goat)', category: 'Nigerian Cuisine', price: 65000, stock: 0, description: 'Spicy goat pepper soup - serves 20-25' },
      { name: 'Suya Platter (Beef)', category: 'Nigerian Cuisine', price: 50000, stock: 0, description: 'Grilled suya beef - serves 20-25' },
      { name: 'Roast Beef with Yorkshire Pudding', category: 'English Cuisine', price: 80000, stock: 0, description: 'Traditional roast beef - serves 20-25' },
      { name: 'Fish and Chips (Pack - 25)', category: 'English Cuisine', price: 65000, stock: 0, description: 'Classic fish and chips, 25 servings' },
      { name: 'Shepherd\'s Pie (Tray)', category: 'English Cuisine', price: 55000, stock: 0, description: 'Traditional shepherd\'s pie - serves 20-25' },
      { name: 'Chapman (Party Jug - 5L)', category: 'Beverages', price: 15000, stock: 0, description: 'Nigerian cocktail mix - serves 20-25' },
      { name: 'Zobo (Party Jug - 5L)', category: 'Beverages', price: 12000, stock: 0, description: 'Hibiscus drink - serves 20-25' },
    ];

    const business = await prisma.business.findFirst({ where: { externalTenantId: BASH_EVENTS_TENANT_ID } });
    if (!business) return res.status(404).json({ success: false, error: 'Bash Events not found' });

    // Create categories - skip if exists
    const createdCategories = {};
    for (const cat of categories) {
      let category = await prisma.category.findFirst({
        where: { businessId: business.id, name: cat.name }
      });
      
      if (!category) {
        category = await prisma.category.create({
          data: { businessId: business.id, name: cat.name, description: cat.description, isActive: true }
        });
      }
      
      createdCategories[cat.name] = category.id;
    }

    let count = 0;
    for (const prod of products) {
    await prisma.product.create({
      data: {
        businessId: business.id,
        categoryId: createdCategories[prod.category],
        name: prod.name,
        description: prod.description,
        price: prod.price,
        costPrice: prod.price * 0.6,
        stockQuantity: prod.stock,
        lowStockAlert: 10,
        unit: 'piece',
        sku: `BASH-${Date.now()}-${count}`,
        barcode: null,
        imageUrl: null,
        isActive: true,
        isTaxable: true,
        loyaltyPoints: 0,
        currency: '₦',
        currencyCode: 'NGN',
      }
    });
    count++;
  }

    await prisma.$disconnect();
    res.json({ 
      success: true, 
      message: 'Import complete!', 
      summary: { 
        business: business.businessName, 
        categories: Object.keys(createdCategories).length, 
        products: count 
      } 
    });
  } catch (error) {
    console.error('[IMPORT]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List all businesses
app.get('/api/v1/admin/list-businesses', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const businesses = await prisma.business.findMany({
      select: { id: true, businessName: true, externalTenantId: true }
    });
    await prisma.$disconnect();
    res.json({ success: true, businesses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ERROR HANDLERS
// ============================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================
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
    ║   🔗 CRM Webhooks: ENABLED (CRM→POS)      ║
    ║   🔗 Sync Job: ENABLED (Phase 2D)         ║
    ║   💼 Shifts: ENABLED                      ║
    ║   📦 Stock Adjustments: ENABLED           ║
    ╚═══════════════════════════════════════╝
  `);
  
  // ============================================
  // INITIALIZE CRON JOBS
  // ============================================
  
  // Phase 2D: Sync job
  if (process.env.ENABLE_REALTIME_SYNC === 'true') {
    try {
      syncJob.initializeSyncJob();
      console.log('  ✓ Sync job initialized successfully\n');
    } catch (error) {
      console.error('  ✗ Failed to initialize sync job:', error.message);
    }
  } else {
    console.log('  ⚠  Sync job disabled (ENABLE_REALTIME_SYNC=false)\n');
  }
  
  // Phase 2E: Reconciliation job
  try {
    initializeReconciliationJob();
    console.log('  ✓ Reconciliation job initialized successfully\n');
  } catch (error) {
    console.error('  ✗ Failed to initialize reconciliation job:', error.message);
  }
  
  // Phase 2F: Email jobs
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
  // Rental overdue job
    try {
      initializeRentalOverdueJob();
      console.log('  ✓ Rental overdue job initialized successfully\n');
    } catch (error) {
      console.error('  ✗ Failed to initialize rental overdue job:', error.message);
    }
    
  // CRM sync scheduler
  if (process.env.ENABLE_CRM_SYNC === 'true') {
    try {
      initCrmSyncScheduler();
      console.log('  ✓ CRM sync scheduler initialized successfully');
    } catch (error) {
      console.error('  ✗ Failed to initialize CRM sync scheduler:', error.message);
    }
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

export default app;


