/**
 * Provisioning Webhook Controller
 * Handles CRM provisioning completion webhook
 * 
 * When CRM provisions a new tenant, it sends a webhook to link
 * the POS business with the CRM tenant UUID (externalTenantId)
 * 
 * Location: backend/src/controllers/provisioningWebhookController.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Handle provisioning completion webhook from CRM
 * 
 * POST /api/v1/webhooks/provisioning-complete
 * 
 * Payload:
 * {
 *   "business_id": "pos-business-uuid",
 *   "crm_tenant_id": "crm-tenant-uuid",
 *   "subdomain": "businessname"
 * }
 * 
 * Updates POS business record with CRM tenant UUID
 */
export const handleProvisioningComplete = async (req, res) => {
  try {
    const { business_id, crm_tenant_id, subdomain } = req.body;

    console.log('[PROVISIONING WEBHOOK] Received provisioning complete notification');
    console.log(`[PROVISIONING WEBHOOK] Business: ${business_id}`);
    console.log(`[PROVISIONING WEBHOOK] CRM Tenant: ${crm_tenant_id}`);
    console.log(`[PROVISIONING WEBHOOK] Subdomain: ${subdomain}`);

    // Validate required fields
    if (!business_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: business_id'
      });
    }

    if (!crm_tenant_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: crm_tenant_id'
      });
    }

    // Find the business
    const business = await prisma.business.findUnique({
      where: { id: business_id }
    });

    if (!business) {
      console.log(`[PROVISIONING WEBHOOK] Business not found: ${business_id}`);
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Check if business already linked to a different CRM tenant
    if (business.externalTenantId && business.externalTenantId !== crm_tenant_id) {
      console.warn(
        `[PROVISIONING WEBHOOK] Business ${business_id} already linked to tenant: ${business.externalTenantId}`
      );
      return res.status(409).json({
        success: false,
        error: 'Business already linked to a different CRM tenant',
        current_tenant_id: business.externalTenantId
      });
    }

    // Update business with CRM tenant ID
    const updatedBusiness = await prisma.business.update({
      where: { id: business_id },
      data: {
        externalTenantId: crm_tenant_id,
        updatedAt: new Date()
      }
    });

    console.log('[PROVISIONING WEBHOOK] Business linked to CRM tenant successfully');
    console.log(`[PROVISIONING WEBHOOK] ${business.name} → ${crm_tenant_id}`);

    return res.status(200).json({
      success: true,
      message: 'Business linked to CRM tenant successfully',
      business: {
        id: updatedBusiness.id,
        name: updatedBusiness.name,
        subdomain: updatedBusiness.subdomain,
        externalTenantId: updatedBusiness.externalTenantId,
        updatedAt: updatedBusiness.updatedAt
      }
    });

  } catch (error) {
    console.error('[PROVISIONING WEBHOOK] Error handling provisioning completion:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process provisioning completion',
      details: error.message
    });
  }
};

export default {
  handleProvisioningComplete
};
