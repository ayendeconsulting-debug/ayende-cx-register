import prisma from '../config/database.js';

/**
 * Get business settings/theme
 */
export const getBusinessSettings = async (req, res) => {
  try {
    const { businessId } = req.user;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        businessName: true,
        subdomain: true,
        businessEmail: true,
        businessPhone: true,
        businessAddress: true,
        businessCity: true,
        businessState: true,
        businessZipCode: true,
        businessCountry: true,
        businessWebsite: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        currency: true,
        currencyCode: true,
        timezone: true,
        dateFormat: true,
        timeFormat: true,
        taxEnabled: true,
        taxRate: true,
        taxLabel: true,
        taxNumber: true,
        receiptHeader: true,
        receiptFooter: true,
        loyaltyEnabled: true,
        isActive: true,
        subscriptionTier: true,
        subscriptionExpiry: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    res.json({
      success: true,
      data: business,
    });
  } catch (error) {
    console.error('Error fetching business settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business settings',
      error: error.message,
    });
  }
};

/**
 * Update business theme
 */
export const updateBusinessTheme = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { primaryColor, secondaryColor, logoUrl } = req.body;

    // Validate color format (hex)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    
    if (primaryColor && !hexColorRegex.test(primaryColor)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid primary color format. Use hex format (e.g., #667eea)',
      });
    }

    if (secondaryColor && !hexColorRegex.test(secondaryColor)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid secondary color format. Use hex format (e.g., #764ba2)',
      });
    }

    const updateData = {};
    if (primaryColor) updateData.primaryColor = primaryColor;
    if (secondaryColor) updateData.secondaryColor = secondaryColor;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        id: true,
        businessName: true,
        primaryColor: true,
        secondaryColor: true,
        logoUrl: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Business theme updated successfully',
      data: updatedBusiness,
    });
  } catch (error) {
    console.error('Error updating business theme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update business theme',
      error: error.message,
    });
  }
};

/**
 * Update business information
 */
export const updateBusinessInfo = async (req, res) => {
  try {
    const { businessId } = req.user;
    const {
      businessName,
      businessEmail,
      businessPhone,
      businessAddress,
      businessCity,
      businessState,
      businessZipCode,
      businessCountry,
      businessWebsite,
      receiptHeader,
      receiptFooter,
    } = req.body;

    const updateData = {};
    if (businessName) updateData.businessName = businessName;
    if (businessEmail !== undefined) updateData.businessEmail = businessEmail;
    if (businessPhone !== undefined) updateData.businessPhone = businessPhone;
    if (businessAddress !== undefined) updateData.businessAddress = businessAddress;
    if (businessCity !== undefined) updateData.businessCity = businessCity;
    if (businessState !== undefined) updateData.businessState = businessState;
    if (businessZipCode !== undefined) updateData.businessZipCode = businessZipCode;
    if (businessCountry !== undefined) updateData.businessCountry = businessCountry;
    if (businessWebsite !== undefined) updateData.businessWebsite = businessWebsite;
    if (receiptHeader !== undefined) updateData.receiptHeader = receiptHeader;
    if (receiptFooter !== undefined) updateData.receiptFooter = receiptFooter;

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        id: true,
        businessName: true,
        businessEmail: true,
        businessPhone: true,
        businessAddress: true,
        businessCity: true,
        businessState: true,
        businessZipCode: true,
        businessCountry: true,
        businessWebsite: true,
        receiptHeader: true,
        receiptFooter: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Business information updated successfully',
      data: updatedBusiness,
    });
  } catch (error) {
    console.error('Error updating business info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update business information',
      error: error.message,
    });
  }
};

/**
 * Update tax settings
 */
export const updateTaxSettings = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { taxEnabled, taxRate, taxLabel, taxNumber } = req.body;

    const updateData = {};
    if (taxEnabled !== undefined) updateData.taxEnabled = taxEnabled;
    if (taxRate !== undefined) updateData.taxRate = taxRate;
    if (taxLabel !== undefined) updateData.taxLabel = taxLabel;
    if (taxNumber !== undefined) updateData.taxNumber = taxNumber;

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        id: true,
        taxEnabled: true,
        taxRate: true,
        taxLabel: true,
        taxNumber: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Tax settings updated successfully',
      data: updatedBusiness,
    });
  } catch (error) {
    console.error('Error updating tax settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tax settings',
      error: error.message,
    });
  }
};