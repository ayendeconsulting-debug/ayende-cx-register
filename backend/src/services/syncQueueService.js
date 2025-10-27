/**
 * Sync Queue Service
 * Manages the queue for POS → CRM synchronization
 * 
 * Phase 2D: Queue-based sync with priority handling
 */

import prisma from '../config/database.js';

/**
 * Add item to sync queue
 * @param {Object} params - Queue item parameters
 * @param {string} params.businessId - Business ID
 * @param {string} params.entityType - Type: customer, transaction, product, business
 * @param {string} params.entityId - Entity UUID
 * @param {string} params.operation - Operation: CREATE, UPDATE, DELETE
 * @param {Object} params.payload - Data to sync
 * @param {string} params.priority - Priority: HIGH, NORMAL, LOW (default: NORMAL)
 * @param {Date} params.scheduledFor - When to process (default: now)
 */
export const addToQueue = async ({
  businessId,
  entityType,
  entityId,
  operation,
  payload = null,
  priority = 'NORMAL',
  scheduledFor = new Date(),
}) => {
  try {
    // Check if item already in queue (prevent duplicates)
    const existing = await prisma.syncQueue.findFirst({
      where: {
        businessId,
        entityType,
        entityId,
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
      },
    });

    if (existing) {
      console.log(`[SYNC QUEUE] Item already queued: ${entityType} ${entityId}`);
      return existing;
    }

    // Create queue item
    const queueItem = await prisma.syncQueue.create({
      data: {
        businessId,
        entityType,
        entityId,
        operation,
        priority,
        status: 'PENDING',
        scheduledFor,
        payload,
        retryCount: 0,
      },
    });

    console.log(`[SYNC QUEUE] Added ${entityType} ${entityId} to queue (Priority: ${priority})`);
    return queueItem;
  } catch (error) {
    console.error('[SYNC QUEUE ERROR] Failed to add item to queue:', error);
    throw error;
  }
};

/**
 * Get pending items from queue
 * @param {number} limit - Maximum items to fetch (default: 100)
 * @param {string} priority - Filter by priority (optional)
 * @returns {Array} Pending queue items
 */
export const getPendingItems = async (limit = 100, priority = null) => {
  try {
    const where = {
      status: 'PENDING',
      scheduledFor: {
        lte: new Date(), // Only items scheduled for now or past
      },
    };

    if (priority) {
      where.priority = priority;
    }

    const items = await prisma.syncQueue.findMany({
      where,
      orderBy: [
        { priority: 'desc' }, // HIGH → NORMAL → LOW
        { scheduledFor: 'asc' }, // Oldest first
        { createdAt: 'asc' },
      ],
      take: limit,
    });

    return items;
  } catch (error) {
    console.error('[SYNC QUEUE ERROR] Failed to fetch pending items:', error);
    throw error;
  }
};

/**
 * Mark item as processing
 * @param {string} queueItemId - Queue item ID
 */
export const markAsProcessing = async (queueItemId) => {
  try {
    return await prisma.syncQueue.update({
      where: { id: queueItemId },
      data: {
        status: 'PROCESSING',
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('[SYNC QUEUE ERROR] Failed to mark as processing:', error);
    throw error;
  }
};

/**
 * Mark item as success
 * @param {string} queueItemId - Queue item ID
 */
export const markAsSuccess = async (queueItemId) => {
  try {
    return await prisma.syncQueue.update({
      where: { id: queueItemId },
      data: {
        status: 'SUCCESS',
        processedAt: new Date(),
        error: null,
      },
    });
  } catch (error) {
    console.error('[SYNC QUEUE ERROR] Failed to mark as success:', error);
    throw error;
  }
};

/**
 * Mark item as failed
 * @param {string} queueItemId - Queue item ID
 * @param {string} errorMessage - Error message
 * @param {boolean} shouldRetry - Whether to retry (default: true)
 */
export const markAsFailed = async (queueItemId, errorMessage, shouldRetry = true) => {
  try {
    const queueItem = await prisma.syncQueue.findUnique({
      where: { id: queueItemId },
    });

    if (!queueItem) {
      throw new Error(`Queue item not found: ${queueItemId}`);
    }

    const newRetryCount = queueItem.retryCount + 1;
    const maxRetries = parseInt(process.env.SYNC_RETRY_ATTEMPTS || '3');

    // Determine if we should retry
    const canRetry = shouldRetry && newRetryCount < maxRetries;

    // Calculate next retry time with exponential backoff
    // 2^retryCount minutes (1min, 2min, 4min, etc.)
    const nextRetryDelay = canRetry ? Math.pow(2, newRetryCount) * 60 * 1000 : null;
    const scheduledFor = canRetry ? new Date(Date.now() + nextRetryDelay) : null;

    return await prisma.syncQueue.update({
      where: { id: queueItemId },
      data: {
        status: canRetry ? 'RETRY' : 'FAILED',
        retryCount: newRetryCount,
        scheduledFor: scheduledFor || queueItem.scheduledFor,
        error: errorMessage,
        processedAt: canRetry ? null : new Date(),
      },
    });
  } catch (error) {
    console.error('[SYNC QUEUE ERROR] Failed to mark as failed:', error);
    throw error;
  }
};

/**
 * Delete queue item (after successful processing)
 * @param {string} queueItemId - Queue item ID
 */
export const deleteQueueItem = async (queueItemId) => {
  try {
    return await prisma.syncQueue.delete({
      where: { id: queueItemId },
    });
  } catch (error) {
    console.error('[SYNC QUEUE ERROR] Failed to delete queue item:', error);
    throw error;
  }
};

/**
 * Get retry items
 * Items that failed but can be retried
 */
export const getRetryItems = async (limit = 50) => {
  try {
    return await prisma.syncQueue.findMany({
      where: {
        status: 'RETRY',
        scheduledFor: {
          lte: new Date(), // Time to retry
        },
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledFor: 'asc' },
      ],
      take: limit,
    });
  } catch (error) {
    console.error('[SYNC QUEUE ERROR] Failed to fetch retry items:', error);
    throw error;
  }
};

/**
 * Get queue statistics
 * @param {string} businessId - Business ID (optional)
 */
export const getQueueStats = async (businessId = null) => {
  try {
    const where = businessId ? { businessId } : {};

    const [pending, processing, retry, failed, total] = await Promise.all([
      prisma.syncQueue.count({ where: { ...where, status: 'PENDING' } }),
      prisma.syncQueue.count({ where: { ...where, status: 'PROCESSING' } }),
      prisma.syncQueue.count({ where: { ...where, status: 'RETRY' } }),
      prisma.syncQueue.count({ where: { ...where, status: 'FAILED' } }),
      prisma.syncQueue.count({ where }),
    ]);

    return {
      pending,
      processing,
      retry,
      failed,
      total,
      success: total - pending - processing - retry - failed,
    };
  } catch (error) {
    console.error('[SYNC QUEUE ERROR] Failed to get queue stats:', error);
    throw error;
  }
};

/**
 * Clean up old completed items
 * Remove SUCCESS items older than specified days
 * @param {number} daysOld - Days to keep (default: 7)
 */
export const cleanupOldItems = async (daysOld = 7) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.syncQueue.deleteMany({
      where: {
        status: 'SUCCESS',
        processedAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`[SYNC QUEUE] Cleaned up ${result.count} old items`);
    return result.count;
  } catch (error) {
    console.error('[SYNC QUEUE ERROR] Failed to cleanup old items:', error);
    throw error;
  }
};

/**
 * Reset stuck items
 * Items that have been PROCESSING for too long (likely crashed)
 * @param {number} minutesStuck - Minutes threshold (default: 30)
 */
export const resetStuckItems = async (minutesStuck = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setMinutes(cutoffDate.getMinutes() - minutesStuck);

    const result = await prisma.syncQueue.updateMany({
      where: {
        status: 'PROCESSING',
        updatedAt: {
          lt: cutoffDate,
        },
      },
      data: {
        status: 'RETRY',
        scheduledFor: new Date(),
      },
    });

    console.log(`[SYNC QUEUE] Reset ${result.count} stuck items`);
    return result.count;
  } catch (error) {
    console.error('[SYNC QUEUE ERROR] Failed to reset stuck items:', error);
    throw error;
  }
};

export default {
  addToQueue,
  getPendingItems,
  markAsProcessing,
  markAsSuccess,
  markAsFailed,
  deleteQueueItem,
  getRetryItems,
  getQueueStats,
  cleanupOldItems,
  resetStuckItems,
};