import prisma from '../config/database.js';

/**
 * Middleware to ensure user has an open shift before processing transactions
 * This prevents transactions from being created without proper shift tracking
 */
export const requireOpenShift = async (req, res, next) => {
  try {
    const { id: userId, businessId } = req.user;

    // Check if user has an open shift
    const openShift = await prisma.shift.findFirst({
      where: {
        userId,
        businessId,
        status: 'OPEN'
      },
      orderBy: {
        openedAt: 'desc'
      },
      select: {
        id: true,
        shiftNumber: true,
        openedAt: true,
        openingCash: true
      }
    });

    if (!openShift) {
      return res.status(403).json({
        success: false,
        message: 'You must have an open shift to process transactions. Please open a shift first.',
        error: 'NO_OPEN_SHIFT',
        data: {
          requiresShift: true,
          action: 'OPEN_SHIFT'
        }
      });
    }

    // Attach shift to request for use in transaction controller
    req.currentShift = openShift;
    next();
  } catch (error) {
    console.error('Shift guard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking shift status',
      error: error.message
    });
  }
};

/**
 * Optional: Middleware to attach current shift info without requiring it
 * Use this for endpoints that benefit from shift context but don't require it
 */
export const attachCurrentShift = async (req, res, next) => {
  try {
    const { id: userId, businessId } = req.user;

    const openShift = await prisma.shift.findFirst({
      where: {
        userId,
        businessId,
        status: 'OPEN'
      },
      orderBy: {
        openedAt: 'desc'
      },
      select: {
        id: true,
        shiftNumber: true,
        openedAt: true,
        openingCash: true
      }
    });

    req.currentShift = openShift || null;
    next();
  } catch (error) {
    console.error('Attach shift error:', error);
    req.currentShift = null;
    next(); // Continue even if error
  }
};