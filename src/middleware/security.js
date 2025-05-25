const helmet = require('helmet');

/**
 * Security middleware configuration
 */

/**
 * Content Security Policy configuration
 */
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for some frontend frameworks
      "'unsafe-eval'",   // Required for some development tools
      "https://cdn.jsdelivr.net",
      "https://unpkg.com"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for inline styles
      "https://fonts.googleapis.com",
      "https://cdn.jsdelivr.net"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "https:",
      "blob:"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "data:"
    ],
    connectSrc: [
      "'self'",
      "ws:",
      "wss:",
      "https://api.yourdomain.com"
    ],
    mediaSrc: ["'self'", "blob:", "data:"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"]
  },
  reportOnly: process.env.NODE_ENV === 'development' // Only report in dev, enforce in prod
};

/**
 * Helmet configuration for security headers
 */
const helmetConfig = {
  // Content Security Policy
  contentSecurityPolicy: cspConfig,
  
  // X-DNS-Prefetch-Control
  dnsPrefetchControl: {
    allow: false
  },
  
  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // X-Download-Options for IE8+
  ieNoOpen: true,
  
  // X-Content-Type-Options
  noSniff: true,
  
  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: false,
  
  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  
  // X-XSS-Protection
  xssFilter: true
};

/**
 * Development helmet configuration (more permissive)
 */
const devHelmetConfig = {
  ...helmetConfig,
  contentSecurityPolicy: {
    ...cspConfig,
    directives: {
      ...cspConfig.directives,
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "*" // Allow all scripts in development
      ]
    }
  },
  hsts: false // Disable HSTS in development
};

/**
 * Production helmet configuration (more restrictive)
 */
const prodHelmetConfig = {
  ...helmetConfig,
  contentSecurityPolicy: {
    ...cspConfig,
    reportOnly: false // Enforce CSP in production
  }
};

/**
 * Get helmet configuration based on environment
 */
const getHelmetConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return prodHelmetConfig;
    case 'development':
      return devHelmetConfig;
    case 'test':
      return devHelmetConfig;
    default:
      return helmetConfig;
  }
};

/**
 * Security headers middleware
 */
const securityHeaders = helmet(getHelmetConfig());

/**
 * Custom security middleware
 */
const customSecurityMiddleware = (req, res, next) => {
  // Remove server header
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Permissions Policy (Feature Policy)
  res.setHeader('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), ' +
    'magnetometer=(), accelerometer=(), gyroscope=(), fullscreen=(self)'
  );
  
  // Only add HSTS in production with HTTPS
  if (process.env.NODE_ENV === 'production' && req.secure) {
    res.setHeader('Strict-Transport-Security', 
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  next();
};

/**
 * Request size limit middleware
 */
const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSizeBytes = parseSize(maxSize);
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        error: {
          type: 'REQUEST_TOO_LARGE',
          message: 'Request entity too large',
          maxSize: maxSize,
          receivedSize: contentLength
        }
      });
    }
    
    next();
  };
};

/**
 * Parse size string to bytes
 */
const parseSize = (size) => {
  if (typeof size === 'number') return size;
  
  const units = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * units[unit]);
};

/**
 * IP whitelist middleware
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No restrictions if no IPs specified
    }
    
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (allowedIPs.includes(clientIP) || allowedIPs.includes('*')) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      error: {
        type: 'IP_NOT_ALLOWED',
        message: 'Access denied from this IP address',
        ip: clientIP
      }
    });
  };
};

/**
 * Rate limiting by IP
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [ip, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(time => time > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, validTimestamps);
      }
    }
    
    // Check current IP
    const ipRequests = requests.get(clientIP) || [];
    const validRequests = ipRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= max) {
      return res.status(429).json({
        success: false,
        error: {
          type: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP',
          retryAfter: Math.ceil(windowMs / 1000)
        }
      });
    }
    
    // Add current request
    validRequests.push(now);
    requests.set(clientIP, validRequests);
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', max - validRequests.length);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
    
    next();
  };
};

/**
 * Security middleware stack
 */
const securityMiddlewareStack = [
  customSecurityMiddleware,
  securityHeaders,
  requestSizeLimit('50mb'), // Adjust based on your needs
];

/**
 * Apply all security middlewares
 */
const applySecurityMiddlewares = (app) => {
  securityMiddlewareStack.forEach(middleware => {
    app.use(middleware);
  });
};

module.exports = {
  securityHeaders,
  customSecurityMiddleware,
  requestSizeLimit,
  ipWhitelist,
  createRateLimiter,
  securityMiddlewareStack,
  applySecurityMiddlewares,
  getHelmetConfig,
  helmetConfig,
  devHelmetConfig,
  prodHelmetConfig
};
