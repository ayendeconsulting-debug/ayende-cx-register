/**
 * Provisioning Token Utility
 * Generates signed tokens for CRM provisioning magic links
 * 
 * Location: src/utils/provisioningToken.js
 */

import crypto from 'crypto';

/**
 * Generate a signed provisioning token for CRM creation
 * 
 * @param {Object} businessData - Business registration data
 * @returns {Object} - { token: base64Payload, signature: hmacSignature, provisionUrl: fullUrl }
 */
export const generateProvisioningToken = (businessData) => {
  const secret = process.env.PROVISIONING_SECRET_KEY;
  
  if (!secret) {
    console.warn('[PROVISIONING] PROVISIONING_SECRET_KEY not set. Using fallback.');
  }
  
  const secretKey = secret || 'default-dev-secret-change-in-production';
  
  // Create payload with business data and timestamp
  const payload = {
    businessId: businessData.businessId,
    businessName: businessData.businessName,
    subdomain: businessData.subdomain,
    businessEmail: businessData.businessEmail,
    businessPhone: businessData.businessPhone || null,
    ownerFirstName: businessData.ownerFirstName,
    ownerLastName: businessData.ownerLastName,
    ownerEmail: businessData.ownerEmail,
    primaryColor: businessData.primaryColor || '#667eea',
    secondaryColor: businessData.secondaryColor || '#764ba2',
    createdAt: new Date().toISOString(),
  };
  
  // Encode payload as base64
  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadJson).toString('base64url');
  
  // Generate HMAC signature
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(payloadBase64)
    .digest('hex');
  
  // Build provision URL
  const crmBaseUrl = process.env.CRM_BASE_URL || 'https://staging.ayendecx.com';
  const provisionUrl = `${crmBaseUrl}/provisioning/provision/?token=${encodeURIComponent(payloadBase64)}&sig=${signature}`;
  
  return {
    token: payloadBase64,
    signature,
    provisionUrl,
    payload, // For logging/debugging
  };
};

export default { generateProvisioningToken };