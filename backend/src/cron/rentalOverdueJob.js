import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendRentalOverdueNotification, sendRentalReminderNotification } from '../services/emailService.js';

const prisma = new PrismaClient();

/**
 * Update rental contracts to OVERDUE status
 */
const updateOverdueContracts = async () => {
  const now = new Date();
  
  try {
    const result = await prisma.rentalContract.updateMany({
      where: {
        status: 'ACTIVE',
        expectedReturnDate: { lt: now }
      },
      data: { status: 'OVERDUE' }
    });

    if (result.count > 0) {
      console.log(`[RENTAL CRON] Marked ${result.count} contracts as OVERDUE`);
    }

    return result.count;
  } catch (error) {
    console.error('[RENTAL CRON] Error updating overdue status:', error);
    return 0;
  }
};

/**
 * Send notifications for overdue rentals
 */
const sendOverdueNotifications = async () => {
  try {
    // Find overdue contracts that haven't been notified today
    const overdueContracts = await prisma.rentalContract.findMany({
      where: {
        status: 'OVERDUE',
        overdueNotified: false
      },
      include: {
        customer: true,
        business: true,
        items: {
          include: { product: true }
        }
      }
    });

    console.log(`[RENTAL CRON] Found ${overdueContracts.length} contracts needing overdue notification`);

    for (const contract of overdueContracts) {
      try {
        // Calculate overdue days
        const overdueDays = Math.ceil(
          (new Date() - new Date(contract.expectedReturnDate)) / (1000 * 60 * 60 * 24)
        );

        // Calculate estimated penalty
        let estimatedPenalty = 0;
        contract.items.forEach(item => {
          const penaltyRate = Number(item.product.latePenaltyRate || Number(item.dailyRate) * 0.1);
          const unreturned = item.quantity - item.returnedQuantity;
          estimatedPenalty += penaltyRate * unreturned * overdueDays;
        });

        // Send email notification
        if (contract.customer.email || contract.contactEmail) {
          await sendRentalOverdueNotification({
            to: contract.contactEmail || contract.customer.email,
            customerName: `${contract.customer.firstName} ${contract.customer.lastName}`,
            contractNumber: contract.contractNumber,
            businessName: contract.business.businessName,
            businessPhone: contract.business.businessPhone,
            expectedReturnDate: contract.expectedReturnDate,
            overdueDays,
            estimatedPenalty,
            currency: contract.currency,
            items: contract.items.map(item => ({
              name: item.productName,
              quantity: item.quantity - item.returnedQuantity
            }))
          });
        }

        // Mark as notified
        await prisma.rentalContract.update({
          where: { id: contract.id },
          data: {
            overdueNotified: true,
            overdueNotifiedAt: new Date()
          }
        });

        console.log(`[RENTAL CRON] Sent overdue notification for contract ${contract.contractNumber}`);
      } catch (emailError) {
        console.error(`[RENTAL CRON] Failed to send notification for ${contract.contractNumber}:`, emailError.message);
      }
    }

    return overdueContracts.length;
  } catch (error) {
    console.error('[RENTAL CRON] Error sending overdue notifications:', error);
    return 0;
  }
};

/**
 * Send reminder notifications for rentals due tomorrow
 */
const sendReminderNotifications = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find contracts due tomorrow that haven't received a reminder
    const contractsDueSoon = await prisma.rentalContract.findMany({
      where: {
        status: 'ACTIVE',
        expectedReturnDate: {
          gte: today,
          lte: tomorrow
        },
        reminderSent: false
      },
      include: {
        customer: true,
        business: true,
        items: {
          include: { product: true }
        }
      }
    });

    console.log(`[RENTAL CRON] Found ${contractsDueSoon.length} contracts needing return reminder`);

    for (const contract of contractsDueSoon) {
      try {
        if (contract.customer.email || contract.contactEmail) {
          await sendRentalReminderNotification({
            to: contract.contactEmail || contract.customer.email,
            customerName: `${contract.customer.firstName} ${contract.customer.lastName}`,
            contractNumber: contract.contractNumber,
            businessName: contract.business.businessName,
            businessPhone: contract.business.businessPhone,
            businessAddress: contract.business.businessAddress,
            expectedReturnDate: contract.expectedReturnDate,
            items: contract.items.map(item => ({
              name: item.productName,
              quantity: item.quantity - item.returnedQuantity
            }))
          });
        }

        // Mark reminder as sent
        await prisma.rentalContract.update({
          where: { id: contract.id },
          data: {
            reminderSent: true,
            reminderSentAt: new Date()
          }
        });

        console.log(`[RENTAL CRON] Sent reminder for contract ${contract.contractNumber}`);
      } catch (emailError) {
        console.error(`[RENTAL CRON] Failed to send reminder for ${contract.contractNumber}:`, emailError.message);
      }
    }

    return contractsDueSoon.length;
  } catch (error) {
    console.error('[RENTAL CRON] Error sending reminders:', error);
    return 0;
  }
};

/**
 * Get dashboard notifications for overdue rentals
 */
export const getOverdueDashboardNotifications = async (businessId) => {
  try {
    const overdueContracts = await prisma.rentalContract.findMany({
      where: {
        businessId,
        status: { in: ['ACTIVE', 'OVERDUE'] },
        expectedReturnDate: { lt: new Date() }
      },
      include: {
        customer: {
          select: { firstName: true, lastName: true, phone: true }
        }
      },
      orderBy: { expectedReturnDate: 'asc' },
      take: 10
    });

    return overdueContracts.map(contract => {
      const overdueDays = Math.ceil(
        (new Date() - new Date(contract.expectedReturnDate)) / (1000 * 60 * 60 * 24)
      );
      return {
        id: contract.id,
        contractNumber: contract.contractNumber,
        customerName: `${contract.customer.firstName} ${contract.customer.lastName}`,
        customerPhone: contract.customer.phone,
        expectedReturnDate: contract.expectedReturnDate,
        overdueDays,
        status: contract.status
      };
    });
  } catch (error) {
    console.error('[RENTAL] Error getting dashboard notifications:', error);
    return [];
  }
};

/**
 * Initialize rental overdue cron jobs
 */
export const initializeRentalOverdueJob = () => {
  // Run every hour to update overdue status
  cron.schedule('0 * * * *', async () => {
    console.log('[RENTAL CRON] Running hourly overdue status check...');
    await updateOverdueContracts();
  });

  // Run at 8 AM daily to send overdue notifications
  cron.schedule('0 8 * * *', async () => {
    console.log('[RENTAL CRON] Running daily overdue notifications...');
    await updateOverdueContracts();
    await sendOverdueNotifications();
  });

  // Run at 10 AM daily to send return reminders
  cron.schedule('0 10 * * *', async () => {
    console.log('[RENTAL CRON] Running daily return reminders...');
    await sendReminderNotifications();
  });

  console.log('  ✓ Rental overdue job initialized');
};

export default {
  initializeRentalOverdueJob,
  updateOverdueContracts,
  sendOverdueNotifications,
  sendReminderNotifications,
  getOverdueDashboardNotifications
};
