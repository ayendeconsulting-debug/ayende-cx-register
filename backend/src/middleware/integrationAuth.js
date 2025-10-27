/**
 * Integration Authentication Middleware
 * Validates JWT tokens from CRM system for system-to-system communication
 */

import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

const INTEGRATION_SECRET = process.env.INTEGRATION_SECRET;

/**
 * Verify integration JWT token from CRM
 */
export const verifyIntegrationToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Integration token required', 401);
    }

    const token = authHeader.substring(7);

    if (!INTEGRATION_SECRET) {
      throw new AppError('Integration secret not configured', 500);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, INTEGRATION_SECRET);

    // Validate issuer
    if (decoded.iss !== 'ayende-crm') {
      throw new AppError('Invalid token issuer', 401);
    }

    // Validate scope
    if (decoded.scope !== 'integration') {
      throw new AppError('Invalid token scope', 401);
    }

    // Add decoded token to request
    req.integration = {
      tenantId: decoded.tenantId,
      issuer: decoded.iss,
      scope: decoded.scope,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid integration token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Integration token expired', 401));
    }
    next(error);
  }
};

/**
 * Validate tenant ID matches
 */
export const validateTenantAccess = (req, res, next) => {
  try {
    const tenantIdFromHeader = req.headers['x-tenant-id'];
    const tenantIdFromToken = req.integration?.tenantId;

    if (!tenantIdFromHeader) {
      throw new AppError('Tenant ID header required', 400);
    }

    if (tenantIdFromToken && tenantIdFromHeader !== tenantIdFromToken) {
      throw new AppError('Tenant ID mismatch', 403);
    }

    req.tenantId = tenantIdFromHeader;
    next();
  } catch (error) {
    next(error);
  }
};

export default {
  verifyIntegrationToken,
  validateTenantAccess,
};
