import { useSelector } from 'react-redux';
import { useMemo } from 'react';

/**
 * Custom hook for currency formatting using business settings
 * Uses settings from Redux auth state (business object)
 */
export const useCurrency = () => {
  const { business } = useSelector((state) => state.auth);

  const currencySettings = useMemo(() => ({
    symbol: business?.currency || '$',
    code: business?.currencyCode || 'USD',
    position: business?.currencyPosition || 'before',
    decimalSeparator: business?.decimalSeparator || '.',
    thousandsSeparator: business?.thousandsSeparator || ',',
    decimalPlaces: business?.decimalPlaces ?? 2,
  }), [business]);

  /**
   * Format a number as currency using business settings
   * @param {number|string} amount - The amount to format
   * @param {boolean} showSymbol - Whether to show the currency symbol (default: true)
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount, showSymbol = true) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) {
      return showSymbol 
        ? (currencySettings.position === 'before' 
            ? `${currencySettings.symbol}0${currencySettings.decimalSeparator}${'0'.repeat(currencySettings.decimalPlaces)}`
            : `0${currencySettings.decimalSeparator}${'0'.repeat(currencySettings.decimalPlaces)}${currencySettings.symbol}`)
        : `0${currencySettings.decimalSeparator}${'0'.repeat(currencySettings.decimalPlaces)}`;
    }

    // Format the number
    const parts = Math.abs(numAmount).toFixed(currencySettings.decimalPlaces).split('.');
    
    // Add thousands separator
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currencySettings.thousandsSeparator);
    
    // Combine integer and decimal parts
    const formatted = currencySettings.decimalPlaces > 0 
      ? `${integerPart}${currencySettings.decimalSeparator}${parts[1]}`
      : integerPart;

    // Add negative sign if needed
    const signedFormatted = numAmount < 0 ? `-${formatted}` : formatted;

    // Add currency symbol
    if (!showSymbol) {
      return signedFormatted;
    }

    if (currencySettings.position === 'before') {
      return `${currencySettings.symbol}${signedFormatted}`;
    } else {
      return `${signedFormatted}${currencySettings.symbol}`;
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

  return {
    formatCurrency,
    parseCurrency,
    currencySettings,
    symbol: currencySettings.symbol,
    code: currencySettings.code,
  };
};

/**
 * Standalone format function for use outside React components
 * Uses provided settings or defaults
 */
export const formatCurrencyStandalone = (amount, settings = {}) => {
  const {
    symbol = '$',
    position = 'before',
    decimalSeparator = '.',
    thousandsSeparator = ',',
    decimalPlaces = 2,
  } = settings;

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return position === 'before' 
      ? `${symbol}0${decimalSeparator}${'0'.repeat(decimalPlaces)}`
      : `0${decimalSeparator}${'0'.repeat(decimalPlaces)}${symbol}`;
  }

  const parts = Math.abs(numAmount).toFixed(decimalPlaces).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
  const formatted = decimalPlaces > 0 
    ? `${integerPart}${decimalSeparator}${parts[1]}`
    : integerPart;

  const signedFormatted = numAmount < 0 ? `-${formatted}` : formatted;

  if (position === 'before') {
    return `${symbol}${signedFormatted}`;
  } else {
    return `${signedFormatted}${symbol}`;
  }
};

export default useCurrency;