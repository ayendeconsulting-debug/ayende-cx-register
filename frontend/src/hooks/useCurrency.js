import { useSelector } from 'react-redux';
import { useMemo } from 'react';

// Currency definitions with symbols and formatting
const CURRENCY_CONFIG = {
  // African currencies
  NGN: { symbol: '₦', name: 'Nigerian Naira', position: 'before', decimals: 2 },
  ZAR: { symbol: 'R', name: 'South African Rand', position: 'before', decimals: 2 },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling', position: 'before', decimals: 2 },
  GHS: { symbol: '₵', name: 'Ghanaian Cedi', position: 'before', decimals: 2 },
  TZS: { symbol: 'TSh', name: 'Tanzanian Shilling', position: 'before', decimals: 2 },
  UGX: { symbol: 'USh', name: 'Ugandan Shilling', position: 'before', decimals: 0 },
  XOF: { symbol: 'CFA', name: 'West African CFA Franc', position: 'before', decimals: 0 },
  XAF: { symbol: 'FCFA', name: 'Central African CFA Franc', position: 'before', decimals: 0 },
  EGP: { symbol: 'E£', name: 'Egyptian Pound', position: 'before', decimals: 2 },
  MAD: { symbol: 'د.م.', name: 'Moroccan Dirham', position: 'before', decimals: 2 },
  RWF: { symbol: 'FRw', name: 'Rwandan Franc', position: 'before', decimals: 0 },
  
  // Major currencies
  USD: { symbol: '$', name: 'US Dollar', position: 'before', decimals: 2 },
  EUR: { symbol: '€', name: 'Euro', position: 'before', decimals: 2 },
  GBP: { symbol: '£', name: 'British Pound', position: 'before', decimals: 2 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', position: 'before', decimals: 2 },
  BRL: { symbol: 'R$', name: 'Brazilian Real', position: 'before', decimals: 2 },
  MXN: { symbol: 'Mex$', name: 'Mexican Peso', position: 'before', decimals: 2 },
};

/**
 * Custom hook for currency formatting using business settings
 * Reads from Redux auth state (business object with config)
 */
export const useCurrency = () => {
  const { business } = useSelector((state) => state.auth);

  const currencySettings = useMemo(() => {
    // Get currency code from business config
    const currencyCode = business?.currency || business?.currencyCode || 'NGN';
    const currencyDef = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG['NGN'];

    return {
      code: currencyCode,
      symbol: currencyDef.symbol,
      name: currencyDef.name,
      position: currencyDef.position,
      decimalSeparator: '.',
      thousandsSeparator: ',',
      decimalPlaces: currencyDef.decimals,
      multiCurrencyEnabled: business?.multiCurrencyEnabled || false,
      supportedCurrencies: business?.supportedCurrencies || [currencyCode],
    };
  }, [business]);

  /**
   * Format a number as currency using business settings
   * @param {number|string} amount - The amount to format
   * @param {boolean} showSymbol - Whether to show the currency symbol (default: true)
   * @param {string} currencyCode - Optional specific currency code to use
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount, showSymbol = true, currencyCode = null) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Use specific currency or default
    const code = currencyCode || currencySettings.code;
    const currencyDef = CURRENCY_CONFIG[code] || CURRENCY_CONFIG[currencySettings.code];
    const decimals = currencyDef.decimals;
    
    if (isNaN(numAmount)) {
      return showSymbol 
        ? (currencyDef.position === 'before' 
            ? `${currencyDef.symbol}0${currencySettings.decimalSeparator}${'0'.repeat(decimals)}`
            : `0${currencySettings.decimalSeparator}${'0'.repeat(decimals)}${currencyDef.symbol}`)
        : `0${currencySettings.decimalSeparator}${'0'.repeat(decimals)}`;
    }

    // Format the number
    const parts = Math.abs(numAmount).toFixed(decimals).split('.');
    
    // Add thousands separator
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currencySettings.thousandsSeparator);
    
    // Combine integer and decimal parts
    const formatted = decimals > 0 
      ? `${integerPart}${currencySettings.decimalSeparator}${parts[1]}`
      : integerPart;

    // Add negative sign if needed
    const signedFormatted = numAmount < 0 ? `-${formatted}` : formatted;

    // Add currency symbol
    if (!showSymbol) {
      return signedFormatted;
    }

    if (currencyDef.position === 'before') {
      return `${currencyDef.symbol}${signedFormatted}`;
    } else {
      return `${signedFormatted}${currencyDef.symbol}`;
    }
  };

  /**
   * Parse a currency string back to number
   * @param {string} currencyString - The formatted currency string
   * @returns {number} The numeric value
   */
  const parseCurrency = (currencyString) => {
    if (!currencyString) return 0;
    
    // Remove currency symbol and thousands separators
    const cleaned = currencyString
      .replace(currencySettings.symbol, '')
      .replace(new RegExp(`\\${currencySettings.thousandsSeparator}`, 'g'), '')
      .replace(currencySettings.decimalSeparator, '.')
      .trim();
    
    return parseFloat(cleaned) || 0;
  };

  /**
   * Get currency info for a specific currency code
   * @param {string} code - Currency code
   * @returns {object} Currency configuration
   */
  const getCurrencyInfo = (code) => {
    return CURRENCY_CONFIG[code] || CURRENCY_CONFIG['NGN'];
  };

  /**
   * Get list of supported currencies for multi-currency businesses
   * @returns {array} Array of currency objects
   */
  const getSupportedCurrencies = () => {
    return currencySettings.supportedCurrencies.map(code => ({
      code,
      ...CURRENCY_CONFIG[code],
    }));
  };

  return {
    formatCurrency,
    parseCurrency,
    getCurrencyInfo,
    getSupportedCurrencies,
    currencySettings,
    symbol: currencySettings.symbol,
    code: currencySettings.code,
    name: currencySettings.name,
  };
};

/**
 * Standalone format function for use outside React components
 * Uses provided settings or defaults
 */
export const formatCurrencyStandalone = (amount, currencyCode = 'NGN') => {
  const currencyDef = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG['NGN'];
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return currencyDef.position === 'before' 
      ? `${currencyDef.symbol}0.${'0'.repeat(currencyDef.decimals)}`
      : `0.${'0'.repeat(currencyDef.decimals)}${currencyDef.symbol}`;
  }

  const parts = Math.abs(numAmount).toFixed(currencyDef.decimals).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = currencyDef.decimals > 0 
    ? `${integerPart}.${parts[1]}`
    : integerPart;

  const signedFormatted = numAmount < 0 ? `-${formatted}` : formatted;

  if (currencyDef.position === 'before') {
    return `${currencyDef.symbol}${signedFormatted}`;
  } else {
    return `${signedFormatted}${currencyDef.symbol}`;
  }
};

export default useCurrency;
