/**
 * Email Service
 * PHASE 2F: Handle all email sending operations
 *
 * Location: src/services/emailService.js
 */

import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
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

// ============================================================================
// SENDGRID INTEGRATION FOR TEAM INVITATIONS
// ============================================================================

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('[EMAIL] SendGrid initialized successfully');
} else {
  console.warn('[EMAIL] SendGrid API key not configured.');
}

/**
 * Send team invitation email via SendGrid
 */
export const sendInvitationEmail = async ({
  email,
  firstName,
  lastName,
  businessName,
  inviterName,
  invitationLink,
  role,
  message,
  expiresAt,
}) => {
  try {
    const msg = {
      to: email,
      from: process.env.DEFAULT_FROM_EMAIL || 'noreply@ayendecx.com',
      subject: `You've been invited to join ${businessName} on Ayende-CX`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Team Invitation</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #3498db;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #3498db;
              margin-bottom: 10px;
            }
            .content {
              margin-bottom: 30px;
            }
            h1 {
              color: #2c3e50;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .info-box {
              background-color: #f8f9fa;
              border-left: 4px solid #3498db;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .info-box strong {
              color: #2c3e50;
            }
            .button {
              display: inline-block;
              padding: 14px 30px;
              background-color: #3498db;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
            }
            .button:hover {
              background-color: #2980b9;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              font-size: 14px;
              color: #666;
            }
            .expiry-notice {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
              font-size: 14px;
            }
            .link-box {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 4px;
              word-break: break-all;
              font-family: monospace;
              font-size: 12px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Ayende-CX</div>
              <p style="color: #666; margin: 0;">POS System</p>
            </div>

            <div class="content">
              <h1>You're Invited to Join the Team!</h1>

              <p>Hi <strong>${firstName} ${lastName}</strong>,</p>

              <p><strong>${inviterName}</strong> has invited you to join <strong>${businessName}</strong> as a <strong>${role}</strong> on the Ayende-CX POS system.</p>

              ${message ? `
                <div class="info-box">
                  <strong>Personal Message:</strong><br>
                  "${message}"
                </div>
              ` : ''}

              <div class="info-box">
                <strong>Your Role:</strong> ${role}<br>
                <strong>Business:</strong> ${businessName}<br>
                <strong>Invited By:</strong> ${inviterName}
              </div>

              <p style="text-align: center;">
                <a href="${invitationLink}" class="button">Accept Invitation</a>
              </p>

              <div class="expiry-notice">
                <strong>Note:</strong> This invitation expires on <strong>${new Date(expiresAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</strong>
              </div>

              <p style="font-size: 14px; color: #666;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <div class="link-box">
                ${invitationLink}
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Once you accept the invitation, you'll be able to create your account and start working with the team.
              </p>
            </div>

            <div class="footer">
              <p>This is an automated email from Ayende-CX POS System.</p>
              <p>If you did not expect this invitation, you can safely ignore this email.</p>
              <p style="margin-top: 20px;">
                <strong>Ayende-CX</strong><br>
                Making business management simple and efficient
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
You've been invited to join ${businessName} on Ayende-CX

Hi ${firstName} ${lastName},

${inviterName} has invited you to join ${businessName} as a ${role} on the Ayende-CX POS system.

${message ? `Personal Message: "${message}"` : ''}

Your Role: ${role}
Business: ${businessName}
Invited By: ${inviterName}

To accept this invitation, click the link below:
${invitationLink}

This invitation expires on ${new Date(expiresAt).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

Once you accept the invitation, you'll be able to create your account and start working with the team.

---
This is an automated email from Ayende-CX POS System.
If you did not expect this invitation, you can safely ignore this email.

Ayende-CX
Making business management simple and efficient
      `,
    };

    await sgMail.send(msg);
    console.log(`[EMAIL] Invitation email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Failed to send invitation email:', error);
    if (error.response) {
      console.error('[EMAIL] SendGrid error:', error.response.body);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Send invitation reminder email via SendGrid
 */
export const sendInvitationReminderEmail = async ({
  email,
  firstName,
  businessName,
  invitationLink,
  role,
  expiresAt,
}) => {
  try {
    const msg = {
      to: email,
      from: process.env.DEFAULT_FROM_EMAIL || 'noreply@ayendecx.com',
      subject: `Reminder: Your invitation to ${businessName} is expiring soon`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3498db; color: #ffffff; text-decoration: none; border-radius: 5px; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Reminder: Invitation Expiring Soon</h1>
            <p>Hi ${firstName},</p>
            <p>This is a reminder that your invitation to join <strong>${businessName}</strong> as a <strong>${role}</strong> is expiring soon.</p>
            <div class="warning">
              Expires on: ${new Date(expiresAt).toLocaleDateString()}
            </div>
            <p style="text-align: center;">
              <a href="${invitationLink}" class="button">Accept Invitation Now</a>
            </p>
            <p>Don't miss out on this opportunity to join the team!</p>
          </div>
        </body>
        </html>
      `,
    };

    await sgMail.send(msg);
    console.log(`[EMAIL] Reminder email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Failed to send reminder email:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// PASSWORD RESET & WELCOME EMAIL FUNCTIONS
// ============================================================================

/**
 * Send password reset email via SendGrid
 */
export const sendPasswordResetEmail = async ({
  email,
  firstName,
  lastName,
  businessName,
  resetUrl,
  expiresIn,
}) => {
  try {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log('[EMAIL] SendGrid not configured. Logging password reset email:');
      console.log(`To: ${email}`);
      console.log(`Reset URL: ${resetUrl}`);
      return { success: true, logged: true };
    }

    const msg = {
      to: email,
      from: process.env.DEFAULT_FROM_EMAIL || 'noreply@ayendecx.com',
      subject: `Reset Your Password - ${businessName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #3498db;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #3498db;
              margin-bottom: 10px;
            }
            .content {
              margin-bottom: 30px;
            }
            h1 {
              color: #2c3e50;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              padding: 14px 30px;
              background-color: #3498db;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
            }
            .button:hover {
              background-color: #2980b9;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
              font-size: 14px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              font-size: 14px;
              color: #666;
            }
            .link-box {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 4px;
              word-break: break-all;
              font-family: monospace;
              font-size: 12px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Ayende-CX</div>
              <p style="color: #666; margin: 0;">Password Reset Request</p>
            </div>

            <div class="content">
              <h1>Reset Your Password</h1>

              <p>Hi <strong>${firstName} ${lastName}</strong>,</p>

              <p>We received a request to reset your password for your <strong>${businessName}</strong> account on Ayende-CX.</p>

              <p>Click the button below to reset your password:</p>

              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>

              <div class="warning">
                This link will expire in <strong>${expiresIn}</strong>. If you didn't request a password reset, you can safely ignore this email.
              </div>

              <p style="font-size: 14px; color: #666;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <div class="link-box">
                ${resetUrl}
              </div>
            </div>

            <div class="footer">
              <p>This is an automated email from Ayende-CX POS System.</p>
              <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
              <p style="margin-top: 20px;">
                <strong>Ayende-CX</strong><br>
                Making business management simple and efficient
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Reset Your Password - ${businessName}

Hi ${firstName} ${lastName},

We received a request to reset your password for your ${businessName} account on Ayende-CX.

Click the link below to reset your password:
${resetUrl}

This link will expire in ${expiresIn}. If you didn't request a password reset, you can safely ignore this email.

---
This is an automated email from Ayende-CX POS System.
If you did not request this password reset, please ignore this email or contact support if you have concerns.

Ayende-CX
Making business management simple and efficient
      `,
    };

    await sgMail.send(msg);
    console.log(`[EMAIL] Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Failed to send password reset email:', error);
    if (error.response) {
      console.error('[EMAIL] SendGrid error:', error.response.body);
    }
    throw error;
  }
};

/**
 * Send welcome email to new business owner via SendGrid
 */
export const sendWelcomeEmail = async ({
  email,
  firstName,
  lastName,
  businessName,
  username,
  temporaryPassword,
  loginUrl,
  subdomain,
}) => {
  try {
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.log('[EMAIL] SendGrid not configured. Logging welcome email:');
      console.log(`To: ${email}`);
      console.log(`Username: ${username}`);
      console.log(`Temp Password: ${temporaryPassword || 'N/A (user set their own)'}`);
      console.log(`Login URL: ${loginUrl}`);
      return { success: true, logged: true };
    }

    const msg = {
      to: email,
      from: process.env.DEFAULT_FROM_EMAIL || 'noreply@ayendecx.com',
      subject: `Welcome to Ayende-CX - Your ${businessName} Account is Ready!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Ayende-CX</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #10B981;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #10B981;
              margin-bottom: 10px;
            }
            .content {
              margin-bottom: 30px;
            }
            h1 {
              color: #2c3e50;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .credentials-box {
              background-color: #f0fdf4;
              border: 2px solid #10B981;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
            }
            .credentials-box h3 {
              color: #059669;
              margin-top: 0;
              margin-bottom: 15px;
            }
            .credential-item {
              margin-bottom: 10px;
              padding: 8px;
              background-color: #ffffff;
              border-radius: 4px;
            }
            .credential-label {
              font-weight: bold;
              color: #374151;
              display: inline-block;
              width: 120px;
            }
            .credential-value {
              color: #059669;
              font-family: monospace;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              padding: 14px 30px;
              background-color: #10B981;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
            }
            .button:hover {
              background-color: #059669;
            }
            .info-box {
              background-color: #f8f9fa;
              border-left: 4px solid #3498db;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
              font-size: 14px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              font-size: 14px;
              color: #666;
            }
            .features {
              margin: 20px 0;
            }
            .feature {
              display: inline-block;
              width: 45%;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 8px;
              text-align: center;
              margin: 5px;
              vertical-align: top;
            }
            .feature-icon {
              font-size: 24px;
              margin-bottom: 8px;
            }
            .feature-title {
              font-weight: bold;
              color: #2c3e50;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Ayende-CX</div>
              <p style="color: #666; margin: 0;">Welcome to Your POS System</p>
            </div>

            <div class="content">
              <h1>Welcome to Ayende-CX!</h1>

              <p>Hi <strong>${firstName} ${lastName}</strong>,</p>

              <p>Congratulations! Your business <strong>${businessName}</strong> has been successfully registered on Ayende-CX. You're now ready to start managing your sales, inventory, and customer relationships.</p>

              <div class="credentials-box">
                <h3>Your Login Credentials</h3>
                <div class="credential-item">
                  <span class="credential-label">Username:</span>
                  <span class="credential-value">${username}${subdomain ? `.${subdomain}` : ''}</span>
                </div>
                ${temporaryPassword ? `
                <div class="credential-item">
                  <span class="credential-label">Password:</span>
                  <span class="credential-value">${temporaryPassword}</span>
                </div>
                ` : `
                <div class="credential-item">
                  <span class="credential-label">Password:</span>
                  <span class="credential-value">The password you set during registration</span>
                </div>
                `}
                <div class="credential-item">
                  <span class="credential-label">Login URL:</span>
                  <span class="credential-value">${loginUrl}</span>
                </div>
              </div>

              ${temporaryPassword ? `
              <div class="warning">
                <strong>Important:</strong> For security, please change your password after your first login.
              </div>
              ` : ''}

              <p style="text-align: center;">
                <a href="${loginUrl}" class="button">Login to Your Account</a>
              </p>

              <div class="info-box">
                <strong>Getting Started:</strong>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Login with your credentials above</li>
                  <li>Set up your product catalog</li>
                  <li>Configure your business settings</li>
                  <li>Invite team members to join</li>
                  <li>Start processing sales!</li>
                </ol>
              </div>

              <h3 style="color: #2c3e50; margin-top: 30px;">What You Can Do</h3>
              <div class="features">
                <div class="feature">
                  <div class="feature-icon">🛒</div>
                  <div class="feature-title">Process Sales</div>
                </div>
                <div class="feature">
                  <div class="feature-icon">📦</div>
                  <div class="feature-title">Manage Inventory</div>
                </div>
                <div class="feature">
                  <div class="feature-icon">👥</div>
                  <div class="feature-title">Track Customers</div>
                </div>
                <div class="feature">
                  <div class="feature-icon">📊</div>
                  <div class="feature-title">View Reports</div>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>Need help? Contact our support team at support@ayendecx.com</p>
              <p style="margin-top: 20px;">
                <strong>Ayende-CX</strong><br>
                Making business management simple and efficient
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to Ayende-CX!

Hi ${firstName} ${lastName},

Congratulations! Your business ${businessName} has been successfully registered on Ayende-CX.

YOUR LOGIN CREDENTIALS
----------------------
Username: ${username}${subdomain ? `.${subdomain}` : ''}
Password: ${temporaryPassword || 'The password you set during registration'}
Login URL: ${loginUrl}

${temporaryPassword ? 'IMPORTANT: For security, please change your password after your first login.\n' : ''}

GETTING STARTED
---------------
1. Login with your credentials above
2. Set up your product catalog
3. Configure your business settings
4. Invite team members to join
5. Start processing sales!

WHAT YOU CAN DO
---------------
- Process Sales
- Manage Inventory
- Track Customers
- View Reports

Need help? Contact our support team at support@ayendecx.com

---
Ayende-CX
Making business management simple and efficient
      `,
    };

    await sgMail.send(msg);
    console.log(`[EMAIL] Welcome email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Failed to send welcome email:', error);
    if (error.response) {
      console.error('[EMAIL] SendGrid error:', error.response.body);
    }
    // Don't throw - welcome email failure shouldn't block registration
    return { success: false, error: error.message };
  }
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  sendEmail,
  sendTransactionReceipt,
  sendEndOfDayReport,
  sendLowStockAlert,
  verifyEmailConfig,
  sendInvitationEmail,
  sendInvitationReminderEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};