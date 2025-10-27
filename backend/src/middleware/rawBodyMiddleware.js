// src/middleware/rawBodyMiddleware.js
/**
 * Raw Body Middleware
 * Captures raw request body for webhook signature verification
 * Must be applied before body-parser middleware
 */

export function rawBodyMiddleware(req, res, next) {
  if (req.path.startsWith('/api/integration/webhook/')) {
    let data = '';
    
    req.on('data', (chunk) => {
      data += chunk;
    });
    
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
}
