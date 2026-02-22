import prisma from '../config/database.js';

/**
 * Get business settings including config
 */
export const getBusinessSettings = async (req, res) => {
  try {
    const { businessId } = req.user;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        config: true, // Include BusinessConfig
      },
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    // Combine business and config data for frontend
    const combinedSettings = {
      id: business.id,
      name: business.name,
      subdomain: business.subdomain,
      owner_name: business.owner_name,
      owner_email: business.owner_email,
      owner_phone: business.owner_phone,
      business_type: business.business_type,
      logoUrl: business.logo_url,
      primaryColor: business.primary_color,
      secondaryColor: business.secondary_color,
      address: business.address,
      city: business.city,
      state: business.state,
      country: business.country,
      postal_code: business.postal_code,
      is_active: business.is_active,
      subscription_tier: business.subscription_tier,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
      
      // Config settings
      config: business.config || {},
      
      // Currency settings (from config)
      currency: business.config?.default_currency || 'NGN',
      currencyCode: business.config?.default_currency || 'NGN',
      multiCurrencyEnabled: business.config?.multi_currency_enabled || false,
      supportedCurrencies: business.config?.supported_currencies || ['NGN'],
      
      // Tax settings (from config)
      taxEnabled: business.config?.tax_enabled || true,
      taxRate: business.config?.tax_rate || 0,
      
      // Feature flags (from config)
      inventoryEnabled: business.config?.inventory_enabled || false,
      loyaltyEnabled: business.config?.loyalty_enabled || true,
      rentalContracts: business.config?.rental_contracts || false,
      appointmentBooking: business.config?.appointment_booking || false,
      tableManagement: business.config?.table_management || false,
    };

    res.json({
      success: true,
      data: combinedSettings,
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
    if (primaryColor) updateData.primary_color = primaryColor;
    if (secondaryColor) updateData.secondary_color = secondaryColor;
    if (logoUrl !== undefined) updateData.logo_url = logoUrl;

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        id: true,
        name: true,
        primary_color: true,
        secondary_color: true,
        logo_url: true,
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
      name,
      owner_name,
      owner_email,
      owner_phone,
      address,
      city,
      state,
      country,
      postal_code,
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (owner_name) updateData.owner_name = owner_name;
    if (owner_email !== undefined) updateData.owner_email = owner_email;
    if (owner_phone !== undefined) updateData.owner_phone = owner_phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (postal_code !== undefined) updateData.postal_code = postal_code;

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        id: true,
        name: true,
        owner_name: true,
        owner_email: true,
        owner_phone: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postal_code: true,
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
    const { taxEnabled, taxRate, taxLabel, taxExemptServices } = req.body;

    // Get or create BusinessConfig
    let config = await prisma.businessConfig.findUnique({
      where: { business_id: businessId },
    });

    if (!config) {
      // Create config if it doesn't exist
      config = await prisma.businessConfig.create({
        data: {
          business_id: businessId,
          tax_enabled: taxEnabled !== undefined ? taxEnabled : true,
          tax_rate: taxRate !== undefined ? taxRate : 0,
          tax_exempt_services: taxExemptServices !== undefined ? taxExemptServices : false,
        },
      });
    } else {
      // Update existing config
      const updateData = {};
      if (taxEnabled !== undefined) updateData.tax_enabled = taxEnabled;
      if (taxRate !== undefined) updateData.tax_rate = taxRate;
      if (taxExemptServices !== undefined) updateData.tax_exempt_services = taxExemptServices;

      config = await prisma.businessConfig.update({
        where: { business_id: businessId },
        data: updateData,
      });
    }

    res.json({
      success: true,
      message: 'Tax settings updated successfully',
      data: {
        tax_enabled: config.tax_enabled,
        tax_rate: config.tax_rate,
        tax_exempt_services: config.tax_exempt_services,
        updatedAt: config.updatedAt,
      },
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

/**
 * Update currency settings
 * FIXED: Now updates BusinessConfig instead of Business model
 */
export const updateCurrencySettings = async (req, res) => {
  try {
    const { businessId } = req.user;
    const { 
      currency,
      currencyCode,
      multiCurrencyEnabled,
      supportedCurrencies
    } = req.body;

    // Validate required fields
    if (!currency && !currencyCode) {
      return res.status(400).json({
        success: false,
        message: 'Currency code is required',
      });
    }

    // Use currency or currencyCode (they should be the same)
    const currencyValue = (currency || currencyCode).toUpperCase();

    // Validate currency code format (3 uppercase letters)
    if (!/^[A-Z]{3}$/.test(currencyValue)) {
      return res.status(400).json({
        success: false,
        message: 'Currency code must be 3 letters (e.g., USD, NGN, ZAR, KES, GHS)',
      });
    }

    // Get or create BusinessConfig
    let config = await prisma.businessConfig.findUnique({
      where: { business_id: businessId },
    });

    if (!config) {
      // Create config if it doesn't exist
      config = await prisma.businessConfig.create({
        data: {
          business_id: businessId,
          default_currency: currencyValue,
          multi_currency_enabled: multiCurrencyEnabled || false,
          supported_currencies: supportedCurrencies || [currencyValue],
        },
      });
    } else {
      // Update existing config
      const updateData = {
        default_currency: currencyValue,
      };

      if (multiCurrencyEnabled !== undefined) {
        updateData.multi_currency_enabled = multiCurrencyEnabled;
      }

      if (supportedCurrencies !== undefined) {
        // Ensure default currency is in supported currencies
        const currencies = Array.isArray(supportedCurrencies) 
          ? supportedCurrencies 
          : [currencyValue];
        
        if (!currencies.includes(currencyValue)) {
          currencies.push(currencyValue);
        }
        
        updateData.supported_currencies = currencies;
      } else {
        // If not provided, ensure default currency is in the list
        const currentCurrencies = config.supported_currencies || [];
        if (!currentCurrencies.includes(currencyValue)) {
          updateData.supported_currencies = [...currentCurrencies, currencyValue];
        }
      }

      config = await prisma.businessConfig.update({
        where: { business_id: businessId },
        data: updateData,
      });
    }

    res.json({
      success: true,
      message: 'Currency settings updated successfully',
      data: {
        default_currency: config.default_currency,
        multi_currency_enabled: config.multi_currency_enabled,
        supported_currencies: config.supported_currencies,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating currency settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update currency settings',
      error: error.message,
    });
  }
};
