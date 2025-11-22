import prisma from '../config/database.js';

/**
 * Get all users for the authenticated user's business
 */
export const getUsers = async (req, res) => {
  try {
    const { businessId } = req.user;

    const users = await prisma.user.findMany({
      where: { businessId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

/**
 * Get single user by ID
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { businessId } = req.user;

    const user = await prisma.user.findFirst({
      where: {
        id,
        businessId,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
};

/**
 * Toggle user active status (activate/deactivate)
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { businessId, id: currentUserId } = req.user;

    // Prevent user from deactivating themselves
    if (id === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account',
      });
    }

    // Check if user exists and belongs to the same business
    const user = await prisma.user.findFirst({
      where: {
        id,
        businessId,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Toggle the isActive status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: !user.isActive,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message,
    });
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const { businessId, id: currentUserId } = req.user;

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'CASHIER', 'INVENTORY_MANAGER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified',
      });
    }

    // Prevent user from changing their own role
    if (id === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role',
      });
    }

    // Check if user exists and belongs to the same business
    const user = await prisma.user.findFirst({
      where: {
        id,
        businessId,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message,
    });
  }
};

/**
 * Delete user (soft delete by deactivating)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { businessId, id: currentUserId } = req.user;

    // Prevent user from deleting themselves
    if (id === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    // Check if user exists and belongs to the same business
    const user = await prisma.user.findFirst({
      where: {
        id,
        businessId,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Soft delete by deactivating
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
};