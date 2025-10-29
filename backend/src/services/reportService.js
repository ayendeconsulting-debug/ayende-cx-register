/**
 * Report Generation Service
 * PHASE 2F: Generate business reports
 * 
 * Location: src/services/reportService.js
 */

import prisma from '../config/database.js';

/**
 * Generate end-of-day report for a business
 * @param {string} businessId - Business ID
 * @param {Date} date - Date for report (defaults to today)
 * @returns {Promise<Object>} Report data
 */
export const generateEndOfDayReport = async (businessId, date = new Date()) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`[REPORT] Generating end-of-day report for business ${businessId}`);
    console.log(`[REPORT] Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    // Get all transactions for the day
    const transactions = await prisma.transaction.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    // Calculate totals
    const totalSales = transactions.reduce((sum, txn) => sum + parseFloat(txn.total), 0);
    const totalTransactions = transactions.length;
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const totalTax = transactions.reduce((sum, txn) => sum + parseFloat(txn.taxAmount || 0), 0);
    const totalDiscount = transactions.reduce((sum, txn) => sum + parseFloat(txn.discountAmount || 0), 0);

    // Payment method breakdown
    const cashSales = transactions
      .filter(txn => txn.paymentMethod === 'CASH')
      .reduce((sum, txn) => sum + parseFloat(txn.total), 0);
    
    const cardSales = transactions
      .filter(txn => txn.paymentMethod === 'CARD' || txn.paymentMethod === 'CREDIT_CARD' || txn.paymentMethod === 'DEBIT_CARD')
      .reduce((sum, txn) => sum + parseFloat(txn.total), 0);

    // New customers today
    const newCustomers = await prisma.customer.count({
      where: {
        businessId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isAnonymous: false,
      },
    });

    // Top selling products
    const productSales = {};
    transactions.forEach(txn => {
      txn.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += parseFloat(item.total);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        quantity: p.quantity,
        revenue: p.revenue.toFixed(2),
      }));

    const report = {
      date: date.toISOString(),
      totalSales: totalSales.toFixed(2),
      totalTransactions,
      averageTransaction: averageTransaction.toFixed(2),
      totalTax: totalTax.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      cashSales: cashSales.toFixed(2),
      cardSales: cardSales.toFixed(2),
      newCustomers,
      topProducts,
    };

    console.log(`[REPORT] Report generated: ${totalTransactions} transactions, $${totalSales.toFixed(2)} total sales`);

    return report;
  } catch (error) {
    console.error('[REPORT] Error generating end-of-day report:', error);
    throw error;
  }
};

/**
 * Get low stock products
 * @param {string} businessId - Business ID
 * @returns {Promise<Array>} Array of low stock products
 */
export const getLowStockProducts = async (businessId) => {
  try {
    console.log(`[REPORT] Checking low stock products for business ${businessId}`);

    const lowStockProducts = await prisma.product.findMany({
      where: {
        businessId,
        isActive: true,
        stockQuantity: {
          lte: prisma.raw('COALESCE("lowStockAlert", 0)'),
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        lowStockAlert: true,
      },
      orderBy: {
        stockQuantity: 'asc',
      },
    });

    console.log(`[REPORT] Found ${lowStockProducts.length} low stock products`);

    return lowStockProducts;
  } catch (error) {
    console.error('[REPORT] Error getting low stock products:', error);
    throw error;
  }
};

export default {
  generateEndOfDayReport,
  getLowStockProducts,
};
