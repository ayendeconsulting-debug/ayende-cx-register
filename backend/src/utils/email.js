/**
 * Email Utility
 * Handles admin notifications for business registration
 * 
 * Location: src/utils/email.js
 * 
 * UPDATED: Added "Provision CRM" magic link button
 */

import sgMail from '@sendgrid/mail';
import { generateProvisioningToken } from './provisioningToken.js';

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send admin notification for new business registration
 * Includes "Provision CRM" magic link button
 */
export const sendBusinessRegistrationNotification = async ({
  businessId,
  businessName,
  subdomain,
  businessEmail,
  businessPhone,
  ownerFirstName,
  ownerLastName,
  ownerEmail,
  primaryColor,
  secondaryColor
}) => {
  // Generate provisioning token and URL
  const provisioningData = generateProvisioningToken({
    businessId,
    businessName,
    subdomain,
    businessEmail,
    businessPhone,
    ownerFirstName,
    ownerLastName,
    ownerEmail,
    primaryColor,
    secondaryColor,
  });
  
  console.log(`[EMAIL] Generated provisioning URL for ${businessName}`);
  
  const msg = {
    to: 'admin@ayendecx.com',
    from: 'noreply@ayendecx.com',
    subject: `New Business Registration: ${businessName}`,
    text: `
New Business Registration - Ayende CX

BUSINESS DETAILS:
-----------------
Business Name: ${businessName}
Subdomain: ${subdomain}
POS URL: https://${subdomain}.ayendecx.com
Business Email: ${businessEmail || 'Not provided'}
Business Phone: ${businessPhone || 'Not provided'}

OWNER DETAILS:
--------------
Name: ${ownerFirstName} ${ownerLastName}
Email: ${ownerEmail}
Username: admin

BRANDING:
---------
Primary Color: ${primaryColor || '#667eea'}
Secondary Color: ${secondaryColor || '#764ba2'}

REGISTRATION TIME: ${new Date().toLocaleString()}

PROVISION CRM:
--------------
Click the link below to provision the CRM tenant (requires admin login):
${provisioningData.provisionUrl}

This link expires in 72 hours.

---
This is an automated notification from Ayende CX Registration System
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0a1e3d 0%, #1e3a5f 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .section { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #60a5fa; }
    .section h3 { margin-top: 0; color: #0a1e3d; }
    .detail { padding: 5px 0; }
    .label { font-weight: 600; color: #1e3a5f; }
    .button { display: inline-block; padding: 12px 24px; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; font-weight: 600; }
    .button-primary { background: #10B981; }
    .button-secondary { background: #60a5fa; }
    .provision-section { background: #d1fae5; border-left-color: #10B981; }
    .provision-section h3 { color: #065f46; }
    .next-steps { background: #fff3cd; border-left-color: #ffc107; }
    .expiry-notice { font-size: 12px; color: #6b7280; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Business Registration</h1>
      <p style="margin: 0; opacity: 0.9;">Ayende CX Platform</p>
    </div>

    <div class="content">
      <!-- PROVISION CRM SECTION - PROMINENT AT TOP -->
      <div class="section provision-section">
        <h3>Provision CRM Tenant</h3>
        <p style="margin: 0 0 15px 0;">Click the button below to automatically create the CRM tenant for this business:</p>
        <div style="text-align: center;">
          <a href="${provisioningData.provisionUrl}" class="button button-primary" style="color: white;">
            Provision CRM Now
          </a>
        </div>
        <p class="expiry-notice">
          This link requires admin login and expires in 72 hours.<br>
          Once clicked, the CRM tenant will be created and the owner will receive a setup wizard email.
        </p>
      </div>

      <div class="section">
        <h3>Business Details</h3>
        <div class="detail"><span class="label">Business Name:</span> ${businessName}</div>
        <div class="detail"><span class="label">Subdomain:</span> ${subdomain}</div>
        <div class="detail"><span class="label">POS URL:</span> <a href="https://${subdomain}.ayendecx.com">https://${subdomain}.ayendecx.com</a></div>
        <div class="detail"><span class="label">Business Email:</span> ${businessEmail || 'Not provided'}</div>
        <div class="detail"><span class="label">Business Phone:</span> ${businessPhone || 'Not provided'}</div>
      </div>

      <div class="section">
        <h3>Owner Details</h3>
        <div class="detail"><span class="label">Name:</span> ${ownerFirstName} ${ownerLastName}</div>
        <div class="detail"><span class="label">Email:</span> <a href="mailto:${ownerEmail}">${ownerEmail}</a></div>
        <div class="detail"><span class="label">Username:</span> admin</div>
      </div>

      <div class="section">
        <h3>Branding</h3>
        <div class="detail">
          <span class="label">Primary Color:</span>
          <span style="background: ${primaryColor || '#667eea'}; padding: 2px 10px; border-radius: 3px; color: white;">${primaryColor || '#667eea'}</span>
        </div>
        <div class="detail">
          <span class="label">Secondary Color:</span>
          <span style="background: ${secondaryColor || '#764ba2'}; padding: 2px 10px; border-radius: 3px; color: white;">${secondaryColor || '#764ba2'}</span>
        </div>
      </div>

      <div class="section next-steps">
        <h3>What Happens When You Click "Provision CRM"</h3>
        <ol style="margin: 10px 0; padding-left: 20px;">
          <li>CRM tenant <strong>${businessName}</strong> will be created</li>
          <li>Subdomain <strong>${subdomain}.ayendecx.com</strong> will be configured</li>
          <li>Owner account for <strong>${ownerEmail}</strong> will be created</li>
          <li>POS - CRM sync will be enabled</li>
          <li>Owner will receive a setup wizard email</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <a href="https://staging.ayendecx.com/admin/" class="button button-secondary" style="color: white;">
          Go to Admin Dashboard
        </a>
      </div>

      <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
        <p>Registration Time: ${new Date().toLocaleString()}</p>
        <p>This is an automated notification from Ayende CX Registration System</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
  };

  return await sgMail.send(msg);
};