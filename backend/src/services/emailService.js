/**
 * Email Service
 * PHASE 2F: Handle all email sending operations
 * 
 * Location: src/services/emailService.js
 */

import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Email configuration
 */
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

/**
 * Create transporter
 */
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      console.warn('[EMAIL] SMTP credentials not configured. Emails will be logged instead of sent.');
      return null;
    }
    
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
    console.log('[EMAIL] Email transporter created successfully');
  }
  return transporter;
};

/**
 * Load and compile email template
 * @param {string} templateName - Template file name (without .html)
 * @param {Object} data - Data to inject into template
 * @returns {Promise<string>} Compiled HTML
 */
const compileTemplate = async (templateName, data) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateContent);
    return template(data);
  } catch (error) {
    console.error(`[EMAIL] Error loading template ${templateName}:`, error.message);
    throw error;
  }
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.from - Sender email (optional)
 * @returns {Promise<Object>} Email result
 */
export const sendEmail = async ({ to, subject, html, from = null }) => {
  try {
    const transport = getTransporter();
    
    // If no transporter, log instead of sending
    if (!transport) {
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║  EMAIL LOG (SMTP not configured)      ║');
      console.log('╚════════════════════════════════════════╝');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`From: ${from || process.env.SMTP_FROM || 'noreply@ayende-cx.com'}`);
      console.log('HTML Content:', html.substring(0, 200) + '...');
      console.log('════════════════════════════════════════\n');
      
      return {
        success: true,
        messageId: `log-${Date.now()}`,
        logged: true,
      };
    }

    const mailOptions = {
      from: from || process.env.SMTP_FROM || 'noreply@ayende-cx.com',
      to,
      subject,
      html,
    };

    const info = await transport.sendMail(mailOptions);
    
    console.log(`[EMAIL] Email sent successfully to ${to}`);
    console.log(`[EMAIL] Message ID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      logged: false,
    };
  } catch (error) {
    console.error(`[EMAIL] Error sending email to ${to}:`, error.message);
    throw error;
  }
};

/**
 * Send transaction receipt email
 * @param {Object} transaction - Transaction object
 * @param {Object} customer - Customer object
 * @param {Object} business - Business object
 * @returns {Promise<Object>} Email result
 */
export const sendTransactionReceipt = async (transaction, customer, business) => {
  try {
    console.log(`[EMAIL] Preparing transaction receipt for ${customer.email}`);

    // Skip if customer has no email
    if (!customer.email || customer.isAnonymous) {
      console.log('[EMAIL] Skipping receipt - no customer email or anonymous customer');
      return { success: false, reason: 'No customer email' };
    }

    // Format transaction data for template
    const templateData = {
      businessName: business.businessName,
      businessAddress: business.businessAddress,
      businessPhone: business.businessPhone,
      businessEmail: business.businessEmail,
      transactionNumber: transaction.transactionNumber,
      transactionDate: new Date(transaction.createdAt).toLocaleDateString(),
      transactionTime: new Date(transaction.createdAt).toLocaleTimeString(),
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      items: transaction.items.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice).toFixed(2),
        total: parseFloat(item.total).toFixed(2),
      })),
      subtotal: parseFloat(transaction.subtotal).toFixed(2),
      tax: parseFloat(transaction.taxAmount || 0).toFixed(2),
      discount: parseFloat(transaction.discountAmount || 0).toFixed(2),
      total: parseFloat(transaction.total).toFixed(2),
      paymentMethod: transaction.paymentMethod,
      loyaltyPointsEarned: transaction.loyaltyPointsEarned || 0,
      currentYear: new Date().getFullYear(),
    };

    // Compile template
    const html = await compileTemplate('receipt', templateData);

    // Send email
    const result = await sendEmail({
      to: customer.email,
      subject: `Receipt #${transaction.transactionNumber} - ${business.businessName}`,
      html,
      from: business.businessEmail || undefined,
    });

    return result;
  } catch (error) {
    console.error('[EMAIL] Error sending transaction receipt:', error);
    throw error;
  }
};

/**
 * Send end-of-day report
 * @param {Object} reportData - Report data
 * @param {string} recipientEmail - Recipient email
 * @param {Object} business - Business object
 * @returns {Promise<Object>} Email result
 */
export const sendEndOfDayReport = async (reportData, recipientEmail, business) => {
  try {
    console.log(`[EMAIL] Preparing end-of-day report for ${recipientEmail}`);

    const templateData = {
      businessName: business.businessName,
      reportDate: new Date(reportData.date).toLocaleDateString(),
      totalSales: parseFloat(reportData.totalSales).toFixed(2),
      totalTransactions: reportData.totalTransactions,
      averageTransaction: parseFloat(reportData.averageTransaction).toFixed(2),
      totalTax: parseFloat(reportData.totalTax).toFixed(2),
      totalDiscount: parseFloat(reportData.totalDiscount).toFixed(2),
      cashSales: parseFloat(reportData.cashSales || 0).toFixed(2),
      cardSales: parseFloat(reportData.cardSales || 0).toFixed(2),
      newCustomers: reportData.newCustomers || 0,
      topProducts: reportData.topProducts || [],
      currentYear: new Date().getFullYear(),
    };

    const html = await compileTemplate('end-of-day-report', templateData);

    const result = await sendEmail({
      to: recipientEmail,
      subject: `End of Day Report - ${templateData.reportDate} - ${business.businessName}`,
      html,
      from: business.businessEmail || undefined,
    });

    return result;
  } catch (error) {
    console.error('[EMAIL] Error sending end-of-day report:', error);
    throw error;
  }
};

/**
 * Send low stock alert
 * @param {Array} lowStockProducts - Array of low stock products
 * @param {string} recipientEmail - Recipient email
 * @param {Object} business - Business object
 * @returns {Promise<Object>} Email result
 */
export const sendLowStockAlert = async (lowStockProducts, recipientEmail, business) => {
  try {
    console.log(`[EMAIL] Preparing low stock alert for ${recipientEmail}`);

    if (!lowStockProducts || lowStockProducts.length === 0) {
      console.log('[EMAIL] No low stock products, skipping alert');
      return { success: false, reason: 'No low stock products' };
    }

    const templateData = {
      businessName: business.businessName,
      alertDate: new Date().toLocaleDateString(),
      totalProducts: lowStockProducts.length,
      products: lowStockProducts.map(product => ({
        name: product.name,
        sku: product.sku,
        currentStock: product.stockQuantity,
        alertThreshold: product.lowStockAlert,
        difference: product.lowStockAlert - product.stockQuantity,
      })),
      currentYear: new Date().getFullYear(),
    };

    const html = await compileTemplate('low-stock-alert', templateData);

    const result = await sendEmail({
      to: recipientEmail,
      subject: `Low Stock Alert - ${lowStockProducts.length} Products - ${business.businessName}`,
      html,
      from: business.businessEmail || undefined,
    });

    return result;
  } catch (error) {
    console.error('[EMAIL] Error sending low stock alert:', error);
    throw error;
  }
};

/**
 * Verify email configuration
 * @returns {Promise<boolean>} True if configured correctly
 */
export const verifyEmailConfig = async () => {
  try {
    const transport = getTransporter();
    
    if (!transport) {
      console.log('[EMAIL] Email not configured (SMTP credentials missing)');
      return false;
    }

    await transport.verify();
    console.log('[EMAIL] Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('[EMAIL] Email configuration verification failed:', error.message);
    return false;
  }
};

export default {
  sendEmail,
  sendTransactionReceipt,
  sendEndOfDayReport,
  sendLowStockAlert,
  verifyEmailConfig,
};
