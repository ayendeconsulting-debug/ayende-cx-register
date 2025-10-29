/**
 * Email Cron Jobs
 * PHASE 2F: Automated email reports and alerts
 * 
 * Location: src/cron/emailJobs.js
 */

import cron from 'node-cron';
import prisma from '../config/database.js';
import { generateEndOfDayReport, getLowStockProducts } from '../services/reportService.js';
import { sendEndOfDayReport, sendLowStockAlert } from '../services/emailService.js';

/**
 * Initialize end-of-day report job
 * Runs daily at 11:00 PM
 */
export const initializeEndOfDayReportJob = () => {
  console.log('[EMAIL CRON] Initializing end-of-day report job');

  // Run daily at 11:00 PM
  // Cron format: '0 23 * * *' = At 23:00 every day
  const schedule = process.env.EOD_REPORT_SCHEDULE || '0 23 * * *';
  
  cron.schedule(schedule, async () => {
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  END OF DAY REPORTS - SCHEDULED RUN       ║');
    console.log('╚═══════════════════════════════════════════╝\n');
    console.log(`[EMAIL CRON] Starting at ${new Date().toISOString()}`);

    try {
      // Get all active businesses
      const businesses = await prisma.business.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          businessName: true,
          businessEmail: true,
          businessAddress: true,
          businessPhone: true,
        },
      });

      console.log(`[EMAIL CRON] Found ${businesses.length} active businesses\n`);

      for (const business of businesses) {
        console.log(`[EMAIL CRON] Processing: ${business.businessName}`);
        
        try {
          // Generate report for today
          const report = await generateEndOfDayReport(business.id);

          // Get business owner/admin email
          const adminUser = await prisma.user.findFirst({
            where: {
              businessId: business.id,
              role: 'OWNER',
              isActive: true,
            },
            select: {
              email: true,
            },
          });

          // Fallback to MANAGER if no OWNER
          const recipientUser = adminUser || await prisma.user.findFirst({
            where: {
              businessId: business.id,
              role: 'MANAGER',
              isActive: true,
            },
            select: {
              email: true,
            },
          });

          if (!recipientUser) {
            console.log(`[EMAIL CRON] No admin/manager found for ${business.businessName}, skipping`);
            continue;
          }

          // Send report email
          await sendEndOfDayReport(report, recipientUser.email, business);
          
          console.log(`[EMAIL CRON] ✓ Report sent to ${recipientUser.email}`);
        } catch (error) {
          console.error(`[EMAIL CRON] Error processing ${business.businessName}:`, error.message);
        }
      }

      console.log(`\n[EMAIL CRON] End-of-day reports completed at ${new Date().toISOString()}`);
      console.log('═'.repeat(50) + '\n');

    } catch (error) {
      console.error('[EMAIL CRON] Fatal error in end-of-day report job:', error);
    }
  });

  console.log(`[EMAIL CRON] End-of-day report job scheduled: ${schedule} (Daily at 11:00 PM)\n`);
};

/**
 * Initialize low stock alert job
 * Runs daily at 9:00 AM
 */
export const initializeLowStockAlertJob = () => {
  console.log('[EMAIL CRON] Initializing low stock alert job');

  // Run daily at 9:00 AM
  // Cron format: '0 9 * * *' = At 09:00 every day
  const schedule = process.env.LOW_STOCK_ALERT_SCHEDULE || '0 9 * * *';
  
  cron.schedule(schedule, async () => {
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  LOW STOCK ALERTS - SCHEDULED RUN         ║');
    console.log('╚═══════════════════════════════════════════╝\n');
    console.log(`[EMAIL CRON] Starting at ${new Date().toISOString()}`);

    try {
      // Get all active businesses
      const businesses = await prisma.business.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          businessName: true,
          businessEmail: true,
        },
      });

      console.log(`[EMAIL CRON] Checking ${businesses.length} businesses\n`);

      let totalAlertsSent = 0;

      for (const business of businesses) {
        try {
          // Get low stock products
          const lowStockProducts = await getLowStockProducts(business.id);

          if (lowStockProducts.length === 0) {
            console.log(`[EMAIL CRON] ${business.businessName}: No low stock products`);
            continue;
          }

          console.log(`[EMAIL CRON] ${business.businessName}: ${lowStockProducts.length} low stock products`);

          // Get business owner/manager email
          const adminUser = await prisma.user.findFirst({
            where: {
              businessId: business.id,
              role: { in: ['OWNER', 'MANAGER'] },
              isActive: true,
            },
            select: {
              email: true,
            },
          });

          if (!adminUser) {
            console.log(`[EMAIL CRON] No admin/manager found for ${business.businessName}, skipping`);
            continue;
          }

          // Send alert email
          await sendLowStockAlert(lowStockProducts, adminUser.email, business);
          
          totalAlertsSent++;
          console.log(`[EMAIL CRON] ✓ Alert sent to ${adminUser.email}`);
        } catch (error) {
          console.error(`[EMAIL CRON] Error processing ${business.businessName}:`, error.message);
        }
      }

      console.log(`\n[EMAIL CRON] Low stock alerts completed: ${totalAlertsSent} sent`);
      console.log(`[EMAIL CRON] Completed at ${new Date().toISOString()}`);
      console.log('═'.repeat(50) + '\n');

    } catch (error) {
      console.error('[EMAIL CRON] Fatal error in low stock alert job:', error);
    }
  });

  console.log(`[EMAIL CRON] Low stock alert job scheduled: ${schedule} (Daily at 9:00 AM)\n`);
};

/**
 * Initialize all email cron jobs
 */
export const initializeEmailJobs = () => {
  console.log('[EMAIL CRON] Initializing all email jobs...\n');
  
  try {
    initializeEndOfDayReportJob();
    initializeLowStockAlertJob();
    
    console.log('[EMAIL CRON] All email jobs initialized successfully\n');
  } catch (error) {
    console.error('[EMAIL CRON] Failed to initialize email jobs:', error);
    throw error;
  }
};

export default {
  initializeEmailJobs,
  initializeEndOfDayReportJob,
  initializeLowStockAlertJob,
};
