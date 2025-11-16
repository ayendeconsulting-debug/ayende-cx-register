/**
 * Security Middleware Suite
 * Comprehensive security layers for Ayende-CX POS Backend
 * 
 * Features:
 * - Input sanitization (XSS prevention)
 * - Suspicious activity detection (SQL injection, XSS, path traversal)
 * - Parameter pollution prevention
 * - Business access validation (multi-tenant security)
 * - UUID validation
 * - Password strength validation
 * - Security event logging
 */

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Recursively sanitize objects
 */
function sanitizeObject(obj) {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Sanitize string input to prevent XSS
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  // Remove potentially dangerous characters while preserving normal text
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove inline event handlers
    .trim();
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: 8+ chars, 1 uppercase, 1 lowercase, 1 number
 */
export function isStrongPassword(password) {
  if (!password || typeof password !== 'string') return false;
  
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return minLength && hasUppercase && hasLowercase && hasNumber;
}

// ============================================
// LOGGING
// ============================================

/**
 * Log security events for monitoring
 */
export function logSecurityEvent(eventType, details) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type: eventType,
    ...details
  };
  
  // In production, send to security logging service (e.g., Datadog, Sentry)
  console.log(`[SECURITY] ${JSON.stringify(logEntry)}`);
}

// ============================================
// MIDDLEWARE FUNCTIONS
// ============================================

/**
 * Sanitize all user input to prevent XSS attacks
 */
export function sanitizeInput(req, res, next) {
  try {
    // Sanitize body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    next();
  } catch (error) {
    console.error('[SECURITY] Error in sanitizeInput:', error);
    next(); // Don't block request on sanitization error
  }
}

/**
 * Validate UUID format to prevent injection attacks
 */
export function validateUUID(paramName) {
  return (req, res, next) => {
    const uuid = req.params[paramName] || req.body[paramName] || req.query[paramName];
    
    if (!uuid) {
      return next(); // Let validation middleware handle missing params
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(uuid)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
        error: 'INVALID_UUID'
      });
    }
    
    next();
  };
}

/**
 * Validate businessId matches authenticated user's business
 * CRITICAL for multi-tenant security - prevents cross-tenant data access
 */
export function validateBusinessAccess(req, res, next) {
  const userBusinessId = req.user?.businessId;
  const requestBusinessId = req.body?.businessId || req.params?.businessId || req.query?.businessId;
  
  // If no business ID in request, allow (will be added by controller)
  if (!requestBusinessId) {
    return next();
  }
  
  // If user is not authenticated, let auth middleware handle it
  if (!userBusinessId) {
    return next();
  }
  
  // Check if business IDs match
  if (userBusinessId !== requestBusinessId) {
    logSecurityEvent('CROSS_TENANT_ACCESS_ATTEMPT', {
      userId: req.user?.id,
      userBusinessId,
      requestedBusinessId: requestBusinessId,
      ip: req.ip,
      path: req.path
    });
    
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own business data.',
      error: 'BUSINESS_ACCESS_DENIED'
    });
  }
  
  next();
}

/**
 * Detect and block suspicious attack patterns
 * Detects: SQL injection, XSS, path traversal
 */
export function detectSuspiciousActivity(req, res, next) {
  const suspiciousPatterns = [
    { pattern: /(\bSELECT\b.*\bFROM\b.*\bWHERE\b)/i, type: 'SQL_INJECTION' },
    { pattern: /(\bUNION\b.*\bSELECT\b)/i, type: 'SQL_INJECTION' },
    { pattern: /(\bDROP\b.*\bTABLE\b)/i, type: 'SQL_INJECTION' },
    { pattern: /(\bINSERT\b.*\bINTO\b)/i, type: 'SQL_INJECTION' },
    { pattern: /(\bDELETE\b.*\bFROM\b)/i, type: 'SQL_INJECTION' },
    { pattern: /<script[^>]*>.*<\/script>/gi, type: 'XSS' },
    { pattern: /javascript:/gi, type: 'XSS' },
    { pattern: /onerror\s*=/gi, type: 'XSS' },
    { pattern: /onload\s*=/gi, type: 'XSS' },
    { pattern: /\.\.\/\.\.\//g, type: 'PATH_TRAVERSAL' },
  ];
  
  const checkString = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  for (const { pattern, type } of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      logSecurityEvent('SUSPICIOUS_PATTERN_DETECTED', {
        type,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        path: req.path,
        method: req.method,
        pattern: pattern.toString()
      });
      
      return res.status(403).json({
        success: false,
        message: 'Suspicious activity detected. Request blocked for security.',
        error: 'SECURITY_VIOLATION'
      });
    }
  }
  
  next();
}

/**
 * Prevent HTTP parameter pollution attacks
 */
export function preventParameterPollution(req, res, next) {
  // Whitelist of parameters allowed to be arrays
  const allowedArrayParams = ['ids', 'statuses', 'roles', 'categories'];
  
  if (req.query) {
    for (const key in req.query) {
      if (Array.isArray(req.query[key]) && !allowedArrayParams.includes(key)) {
        // Take only the first value if not in whitelist
        req.query[key] = req.query[key][0];
      }
    }
  }
  
  next();
}

/**
 * Add additional security headers to responses
 */
export function addSecurityHeaders(req, res, next) {
  // Remove server identification
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
}

/**
 * Validate password strength on registration/password change
 */
export function validatePasswordStrength(req, res, next) {
  const password = req.body?.password;
  
  if (!password) {
    return next(); // Let other validation middleware handle missing password
  }
  
  if (!isStrongPassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters and contain uppercase, lowercase, and numbers',
      error: 'WEAK_PASSWORD'
    });
  }
  
  next();
}