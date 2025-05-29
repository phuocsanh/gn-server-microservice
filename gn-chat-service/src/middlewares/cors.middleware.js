/**
 * CORS (Cross-Origin Resource Sharing) middleware
 */

const cors = require('cors');

/**
 * CORS configuration
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://localhost:3000',
      'https://localhost:3001',
      // Add your production domains here
      // 'https://yourdomain.com',
      // 'https://www.yourdomain.com'
    ];
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origin ${origin} not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  methods: [
    'GET',
    'POST', 
    'PUT',
    'DELETE',
    'OPTIONS',
    'PATCH'
  ],
  
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Request-ID'
  ],
  
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  
  credentials: true, // Allow cookies and credentials
  
  maxAge: 86400, // 24 hours - how long browser can cache preflight response
  
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

/**
 * Development CORS configuration (more permissive)
 */
const devCorsOptions = {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['*'],
  credentials: true,
  maxAge: 86400
};

/**
 * Production CORS configuration (more restrictive)
 */
const prodCorsOptions = {
  origin: [
    // Add your production domains here
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'https://api.yourdomain.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization'
  ],
  credentials: true,
  maxAge: 86400
};

/**
 * Get CORS options based on environment
 */
const getCorsOptions = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return prodCorsOptions;
    case 'development':
      return devCorsOptions;
    case 'test':
      return devCorsOptions;
    default:
      return corsOptions;
  }
};

/**
 * Custom CORS middleware with additional security
 */
const customCorsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Log CORS requests for monitoring
  if (origin) {
    console.log(`CORS request from origin: ${origin}`);
  }
  
  // Add security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  
  // Continue with CORS processing
  next();
};

/**
 * CORS middleware factory
 */
const createCorsMiddleware = (options = null) => {
  const corsConfig = options || getCorsOptions();
  return [
    customCorsMiddleware,
    cors(corsConfig)
  ];
};

/**
 * Default CORS middleware
 */
const corsMiddleware = createCorsMiddleware();

/**
 * Preflight handler for complex CORS requests
 */
const handlePreflight = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    // Handle preflight request
    const origin = req.headers.origin;
    const allowedOrigins = getCorsOptions().origin;
    
    if (typeof allowedOrigins === 'function') {
      allowedOrigins(origin, (err, allowed) => {
        if (err || !allowed) {
          return res.status(403).json({
            success: false,
            error: 'CORS policy violation'
          });
        }
        
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
        res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-API-Key');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400');
        
        return res.status(200).end();
      });
    } else {
      // Simple origin check
      if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
      } else if (allowedOrigins === true) {
        res.header('Access-Control-Allow-Origin', origin);
      }
      
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
      res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-API-Key');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
      
      return res.status(200).end();
    }
  } else {
    next();
  }
};

/**
 * CORS error handler
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: {
        type: 'CORS_ERROR',
        message: 'CORS policy violation',
        statusCode: 403,
        origin: req.headers.origin
      }
    });
  }
  next(err);
};

/**
 * Validate origin against whitelist
 */
const validateOrigin = (origin, whitelist) => {
  if (!origin) return true; // Allow requests with no origin
  
  if (Array.isArray(whitelist)) {
    return whitelist.includes(origin);
  }
  
  if (typeof whitelist === 'string') {
    return whitelist === origin;
  }
  
  if (whitelist === true) {
    return true;
  }
  
  return false;
};

/**
 * Dynamic CORS based on request
 */
const dynamicCors = (req, res, next) => {
  const origin = req.headers.origin;
  const userAgent = req.headers['user-agent'];
  
  // Different CORS rules based on user agent or other factors
  let corsConfig = getCorsOptions();
  
  // Example: More restrictive for certain user agents
  if (userAgent && userAgent.includes('bot')) {
    corsConfig = {
      ...corsConfig,
      credentials: false,
      methods: ['GET']
    };
  }
  
  cors(corsConfig)(req, res, next);
};

module.exports = {
  corsMiddleware,
  createCorsMiddleware,
  handlePreflight,
  corsErrorHandler,
  customCorsMiddleware,
  dynamicCors,
  validateOrigin,
  getCorsOptions,
  corsOptions,
  devCorsOptions,
  prodCorsOptions
};
