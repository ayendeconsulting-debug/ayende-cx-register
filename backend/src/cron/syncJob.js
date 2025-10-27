/**
 * Sync Job - Cron Scheduler
 * Schedules periodic sync operations
 * 
 * Phase 2D: Runs sync queue processor every 5 minutes
 */

import cron from 'node-cron';
import * as syncQueueProcessor from '../services/syncQueueProcessor.js';

// Track job status
let isProcessing = false;
let lastRunTime = null;
let lastRunResult = null;

/**
 * Initialize sync job scheduler
 */
export const initializeSyncJob = () => {
  const syncInterval = process.env.SYNC_INTERVAL_MINUTES || '5';
  const enableSync = process.env.ENABLE_REALTIME_SYNC === 'true';

  if (!enableSync) {
    console.log('[SYNC JOB] Sync is disabled (ENABLE_REALTIME_SYNC=false)');
    return null;
  }

  console.log(`[SYNC JOB] Initializing sync job (every ${syncInterval} minutes)`);

  // Cron expression: every N minutes
  // Format: minute hour day month weekday
  const cronExpression = `*/${syncInterval} * * * *`;

  // Schedule the job
  const job = cron.schedule(cronExpression, async () => {
    // Prevent overlapping runs
    if (isProcessing) {
      console.log('[SYNC JOB] Previous sync still running, skipping this cycle');
      return;
    }

    isProcessing = true;
    lastRunTime = new Date();

    try {
      console.log(`[SYNC JOB] Starting scheduled sync at ${lastRunTime.toISOString()}`);
      
      const result = await syncQueueProcessor.processPendingQueue();
      
      lastRunResult = {
        success: true,
        timestamp: lastRunTime,
        ...result,
      };

      console.log('[SYNC JOB] Scheduled sync completed successfully');
    } catch (error) {
      console.error('[SYNC JOB ERROR] Sync job failed:', error);
      
      lastRunResult = {
        success: false,
        timestamp: lastRunTime,
        error: error.message,
      };
    } finally {
      isProcessing = false;
    }
  }, {
    scheduled: true,
    timezone: process.env.TIMEZONE || 'UTC',
  });

  console.log(`[SYNC JOB] Sync job scheduled successfully`);
  console.log(`[SYNC JOB] Cron expression: ${cronExpression}`);
  console.log(`[SYNC JOB] Next run: ${getNextRunTime(cronExpression)}`);

  return job;
};

/**
 * Get next scheduled run time
 */
const getNextRunTime = (cronExpression) => {
  try {
    const syncInterval = parseInt(process.env.SYNC_INTERVAL_MINUTES || '5');
    const nextRun = new Date();
    nextRun.setMinutes(nextRun.getMinutes() + syncInterval);
    return nextRun.toISOString();
  } catch (error) {
    return 'Unable to calculate';
  }
};

/**
 * Get sync job status
 */
export const getSyncJobStatus = () => {
  return {
    isProcessing,
    lastRunTime,
    lastRunResult,
    enabled: process.env.ENABLE_REALTIME_SYNC === 'true',
    interval: `${process.env.SYNC_INTERVAL_MINUTES || '5'} minutes`,
  };
};

/**
 * Manually trigger sync job (for testing)
 */
export const triggerManualSync = async () => {
  if (isProcessing) {
    throw new Error('Sync job is already running');
  }

  console.log('[SYNC JOB] Manual sync triggered');
  
  isProcessing = true;
  lastRunTime = new Date();

  try {
    const result = await syncQueueProcessor.processPendingQueue();
    
    lastRunResult = {
      success: true,
      timestamp: lastRunTime,
      manual: true,
      ...result,
    };

    return lastRunResult;
  } catch (error) {
    lastRunResult = {
      success: false,
      timestamp: lastRunTime,
      manual: true,
      error: error.message,
    };

    throw error;
  } finally {
    isProcessing = false;
  }
};

export default {
  initializeSyncJob,
  getSyncJobStatus,
  triggerManualSync,
};
