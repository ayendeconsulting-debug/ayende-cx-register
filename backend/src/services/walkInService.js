/**
 * Walk-In Service
 * Handles anonymous walk-in customers and conversion to registered customers
 * 
 * Three customer types:
 * 1. Anonymous Walk-in: No info provided, uses shared anonymous customer
 * 2. Interested Walk-in: Phone provided, converts to registered
 * 3. Registered Customer: Full customer profile
 */

import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { fetchCustomerFromCRM } from './crmIntegrationService.js';

/**
 * Get or create anonymous walk-in customer for a business
 * Each business has exactly one anonymous customer for tracking walk-in transactions
 */
export const getAnonymousCustomer = async (businessId) => {
  try {
    // Try to find existing anonymous customer
    let anonymousCustomer = await prisma.customer.findFirst({
      where: {
        businessId,
        isAnonymous: true,
      },
    });

    // If not found, create one (shouldn't happen as they're created during migration)
    if (!anonymousCustomer) {
      console.log(`[WALK-IN] Creating anonymous customer for business ${businessId}`);
      
      anonymousCustomer = await prisma.customer.create({
        data: {
          businessId,
          firstName: 'Walk-In',
          lastName: 'Customer',
          email: null,
          phone: null,
          loyaltyPoints: 0,
          totalSpent: 0,
          visitCount: 0,
          loyaltyTier: 'BRONZE',
          isAnonymous: true,
          customerSource: 'ANONYMOUS',
          syncState: 'SYNCED', // Anonymous customers don't sync to CRM
          isActive: true,
          marketingOptIn: false,
          notes: 'Anonymous walk-in customer for tracking non-registered purchases',
        },
      });

      console.log(`[WALK-IN] Anonymous customer created: ${anonymousCustomer.id}`);
    }

    return anonymousCustomer;
  } catch (error) {
    console.error('[WALK-IN] Error getting anonymous customer:', error);
    throw new AppError('Failed to get anonymous customer', 500);
  }
};

/**
 * Check if customer exists in POS or CRM by phone number
 * Returns: { exists: boolean, customer: object|null, source: 'pos'|'crm'|null }
 */
export const checkCustomerExists = async (businessId, phone) => {
  if (!phone) {
    return { exists: false, customer: null, source: null };
  }

  try {
    // Normalize phone number (remove spaces, dashes, etc)
    const normalizedPhone = phone.replace(/\D/g, '');

    // 1. Check if customer exists in POS
    const posCustomer = await prisma.customer.findFirst({
      where: {
        businessId,
        phone: {
          contains: normalizedPhone,
        },
        isAnonymous: false, // Don't match anonymous customers
      },
    });

    if (posCustomer) {
      console.log(`[WALK-IN] Customer found in POS: ${posCustomer.id}`);
      return {
        exists: true,
        customer: posCustomer,
        source: 'pos',
      };
    }

    // 2. Check if customer exists in CRM
    console.log(`[WALK-IN] Checking CRM for customer with phone: ${phone}`);
    
    const crmCustomer = await fetchCustomerFromCRM(phone, businessId);

    if (crmCustomer) {
      console.log(`[WALK-IN] Customer found in CRM`);
      return {
        exists: true,
        customer: crmCustomer,
        source: 'crm',
      };
    }

    // 3. Customer doesn't exist anywhere
    console.log(`[WALK-IN] No existing customer found for phone: ${phone}`);
    return {
      exists: false,
      customer: null,
      source: null,
    };
  } catch (error) {
    console.error('[WALK-IN] Error checking customer existence:', error);
    // If check fails, assume customer doesn't exist to avoid blocking transaction
    return {
      exists: false,
      customer: null,
      source: null,
    };
  }
};

/**
 * Convert walk-in to registered customer
 * Called when customer provides phone number during checkout
 * 
 * Process:
 * 1. Check if customer exists in POS - use existing
 * 2. Check if customer exists in CRM - import to POS
 * 3. Create new customer in POS - queue for CRM sync
 */
export const convertWalkInToRegistered = async (businessId, phoneNumber, additionalData = {}) => {
  try {
    console.log(`[WALK-IN] Converting walk-in to registered customer: ${phoneNumber}`);

    // Check if customer exists
    const existingCheck = await checkCustomerExists(businessId, phoneNumber);

    // Case 1: Customer exists in POS - return existing
    if (existingCheck.exists && existingCheck.source === 'pos') {
      console.log(`[WALK-IN] Using existing POS customer: ${existingCheck.customer.id}`);
      return {
        customer: existingCheck.customer,
        isNew: false,
        source: 'pos',
      };
    }

    // Case 2: Customer exists in CRM - import to POS
    if (existingCheck.exists && existingCheck.source === 'crm') {
      console.log(`[WALK-IN] Importing customer from CRM`);
      
      const crmData = existingCheck.customer;
      
      // Create local POS record
      const newCustomer = await prisma.customer.create({
        data: {
          businessId,
          firstName: crmData.firstName || additionalData.firstName || 'Walk-In',
          lastName: crmData.lastName || additionalData.lastName || 'Customer',
          phone: phoneNumber,
          email: crmData.email || additionalData.email || null,
          address: crmData.address || additionalData.address || null,
          city: crmData.city || additionalData.city || null,
          state: crmData.state || additionalData.state || null,
          zipCode: crmData.zipCode || additionalData.zipCode || null,
          dateOfBirth: crmData.dateOfBirth ? new Date(crmData.dateOfBirth) : null,
          
          // Loyalty data from CRM
          loyaltyPoints: crmData.loyaltyPoints || 0,
          loyaltyTier: crmData.loyaltyTier || 'BRONZE',
          totalSpent: crmData.totalSpent || 0,
          visitCount: crmData.visitCount || 0,
          
          // Phase 2 fields
          customerSource: 'CRM',
          syncState: 'SYNCED',
          isAnonymous: false,
          marketingOptIn: crmData.marketingOptIn || false,
          
          // Sync tracking
          externalId: crmData.crmCustomerId || null,
          lastSyncedAt: new Date(),
        },
      });

      // Create mapping between POS and CRM
      await prisma.systemMapping.create({
        data: {
          entityType: 'CUSTOMER',
          posId: newCustomer.id,
          crmId: crmData.crmCustomerId || crmData.id,
          businessId,
          syncStatus: 'ACTIVE',
          metadata: {
            importedAt: new Date().toISOString(),
            source: 'walk_in_conversion',
          },
        },
      });

      console.log(`[WALK-IN] Customer imported from CRM: ${newCustomer.id}`);
      
      return {
        customer: newCustomer,
        isNew: true,
        source: 'crm',
      };
    }

    // Case 3: New customer - create in POS and queue for CRM sync
    console.log(`[WALK-IN] Creating new customer`);
    
    const newCustomer = await prisma.customer.create({
      data: {
        businessId,
        firstName: additionalData.firstName || 'Walk-In',
        lastName: additionalData.lastName || 'Customer',
        phone: phoneNumber,
        email: additionalData.email || null,
        address: additionalData.address || null,
        city: additionalData.city || null,
        state: additionalData.state || null,
        zipCode: additionalData.zipCode || null,
        dateOfBirth: additionalData.dateOfBirth ? new Date(additionalData.dateOfBirth) : null,
        
        // Initial values
        loyaltyPoints: 0,
        loyaltyTier: 'BRONZE',
        totalSpent: 0,
        visitCount: 0,
        
        // Phase 2 fields
        customerSource: 'POS',
        syncState: 'PENDING', // Will be synced to CRM
        isAnonymous: false,
        needsEnrichment: true, // Flag for CRM to enrich profile
        marketingOptIn: additionalData.marketingOptIn || false,
      },
    });

    // Queue for CRM sync
    await prisma.syncQueue.create({
      data: {
        businessId,
        entityType: 'customer',
        entityId: newCustomer.id,
        operation: 'CREATE',
        priority: 'HIGH', // New customers are high priority
        status: 'PENDING',
        payload: {
          customerId: newCustomer.id,
          phone: phoneNumber,
          createdAt: new Date().toISOString(),
        },
      },
    });

    console.log(`[WALK-IN] New customer created and queued for CRM sync: ${newCustomer.id}`);

    return {
      customer: newCustomer,
      isNew: true,
      source: 'new',
    };
  } catch (error) {
    console.error('[WALK-IN] Error converting walk-in to registered:', error);
    throw new AppError('Failed to convert walk-in customer', 500);
  }
};

/**
 * Handle walk-in customer for transaction
 * Determines which customer to use based on provided data
 * 
 * @param {string} businessId - Business ID
 * @param {object} customerData - Customer data from checkout { phone?, firstName?, lastName?, email? }
 * @returns {object} - { customerId, isAnonymous, isNew }
 */
export const handleWalkInCustomer = async (businessId, customerData = {}) => {
  try {
    // If no phone provided, use anonymous customer
    if (!customerData.phone) {
      console.log('[WALK-IN] No phone provided, using anonymous customer');
      const anonymousCustomer = await getAnonymousCustomer(businessId);
      
      return {
        customerId: anonymousCustomer.id,
        customer: anonymousCustomer,
        isAnonymous: true,
        isNew: false,
      };
    }

    // Phone provided - convert to registered customer
    console.log('[WALK-IN] Phone provided, converting to registered customer');
    const result = await convertWalkInToRegistered(
      businessId,
      customerData.phone,
      {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        marketingOptIn: customerData.marketingOptIn,
      }
    );

    return {
      customerId: result.customer.id,
      customer: result.customer,
      isAnonymous: false,
      isNew: result.isNew,
      source: result.source,
    };
  } catch (error) {
    console.error('[WALK-IN] Error handling walk-in customer:', error);
    
    // Fallback to anonymous customer if something fails
    console.log('[WALK-IN] Falling back to anonymous customer due to error');
    const anonymousCustomer = await getAnonymousCustomer(businessId);
    
    return {
      customerId: anonymousCustomer.id,
      customer: anonymousCustomer,
      isAnonymous: true,
      isNew: false,
      error: error.message,
    };
  }
};

export default {
  getAnonymousCustomer,
  checkCustomerExists,
  convertWalkInToRegistered,
  handleWalkInCustomer,
};
