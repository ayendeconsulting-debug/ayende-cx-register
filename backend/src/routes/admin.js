// Admin route to trigger bulk customer sync
import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

// POST /api/admin/bulk-sync-customers
router.post('/bulk-sync-customers', async (req, res) => {
  try {
    console.log('[BULK SYNC] Starting bulk customer sync...');
    
    // Get business
    const business = await prisma.business.findFirst({
      select: { id: true, businessName: true }
    });
    
    if (!business) {
      return res.status(400).json({ error: 'No business found' });
    }
    
    // Get all unsynced customers
    const customers = await prisma.customer.findMany({
      where: {
        isAnonymous: false,
        OR: [
          { externalId: null },
          { syncState: { not: 'SYNCED' } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        externalId: true,
        syncState: true,
        businessId: true
      }
    });
    
    console.log([BULK SYNC] Found ${customers.length} unsynced customers);
    
    let added = 0;
    let skipped = 0;
    const addedCustomers = [];
    
    for (const customer of customers) {
      // Check if already in queue
      const existing = await prisma.syncQueue.findFirst({
        where: {
          entityType: 'CUSTOMER',
          entityId: customer.id,
          status: { in: ['PENDING', 'PROCESSING', 'RETRY'] }
        }
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Add to queue
      await prisma.syncQueue.create({
        data: {
          businessId: customer.businessId,
          entityType: 'CUSTOMER',
          entityId: customer.id,
          operation: 'CREATE',
          priority: 'HIGH',
          status: 'PENDING',
          retryCount: 0
        }
      });
      
      added++;
      addedCustomers.push({
        id: customer.id,
        name: ` ${customer.lastName}`,
        email: customer.email
      });
      
      console.log([BULK SYNC] ? Added: ${customer.firstName} ${customer.lastName}`);
    }
    
    console.log([BULK SYNC] Complete - Added: ${added}, Skipped: ${skipped}`);
    
    return res.json({
      success: true,
      message: 'Bulk sync initiated',
      results: {
        total: customers.length,
        added,
        skipped,
        customers: addedCustomers
      }
    });
    
  } catch (error) {
    console.error('[BULK SYNC] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
