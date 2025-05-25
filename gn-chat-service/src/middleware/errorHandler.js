const { 
  formatErrorResponse, 
  logError, 
  isOperationalError,
  getStatusCode 
} = require('../utils/errors');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error with context
  logError(err, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Get status code
  const statusCode = getStatusCode(err);
  
  // Format error response
  const errorResponse = formatErrorResponse(err, process.env.NODE_ENV === 'development');
  
  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper to catch async errors
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  const error = {
    success: false,
    error: {
      type: 'NOT_FOUND_ERROR',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      statusCode: 404
    }
  };
  
  res.status(404).json(error);
};

/**
 * Validation error handler
 */
const validationErrorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));

    return res.status(400).json({
      success: false,
      error: {
        type: 'VALIDATION_ERROR',
        message: 'Validation failed',
        statusCode: 400,
        details: errors
      }
    });
  }
  
  next(err);
};

/**
 * MongoDB error handler
 */
const mongoErrorHandler = (err, req, res, next) => {
  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: {
        type: 'DUPLICATE_ERROR',
        message: `${field} already exists`,
        statusCode: 400,
        field: field
      }
    });
  }

  // Cast error
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        type: 'CAST_ERROR',
        message: 'Invalid ID format',
        statusCode: 400
      }
    });
  }

  next(err);
};

/**
 * JWT error handler
 */
const jwtErrorHandler = (err, req, res, next) => {
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        type: 'JWT_ERROR',
        message: 'Invalid token',
        statusCode: 401
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        type: 'TOKEN_EXPIRED_ERROR',
        message: 'Token expired',
        statusCode: 401
      }
    });
  }

  next(err);
};

/**
 * Multer error handler (for file uploads)
 */
const multerErrorHandler = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: {
        type: 'FILE_SIZE_ERROR',
        message: 'File too large',
        statusCode: 400
      }
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      error: {
        type: 'FILE_COUNT_ERROR',
        message: 'Too many files',
        statusCode: 400
      }
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: {
        type: 'UNEXPECTED_FILE_ERROR',
        message: 'Unexpected file field',
        statusCode: 400
      }
    });
  }

  next(err);
};

/**
 * Rate limit error handler
 */
const rateLimitErrorHandler = (err, req, res, next) => {
  if (err.type === 'RATE_LIMIT_ERROR') {
    return res.status(429).json({
      success: false,
      error: {
        type: 'RATE_LIMIT_ERROR',
        message: 'Too many requests, please try again later',
        statusCode: 429,
        retryAfter: err.retryAfter || 60
      }
    });
  }

  next(err);
};

/**
 * CORS error handler
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: {
        type: 'CORS_ERROR',
        message: 'CORS policy violation',
        statusCode: 403
      }
    });
  }

  next(err);
};

/**
 * Timeout error handler
 */
const timeoutErrorHandler = (err, req, res, next) => {
  if (err.code === 'TIMEOUT' || err.message.includes('timeout')) {
    return res.status(408).json({
      success: false,
      error: {
        type: 'TIMEOUT_ERROR',
        message: 'Request timeout',
        statusCode: 408
      }
    });
  }

  next(err);
};

/**
 * Database connection error handler
 */
const dbConnectionErrorHandler = (err, req, res, next) => {
  if (err.name === 'MongoNetworkError' || err.name === 'MongoServerError') {
    return res.status(503).json({
      success: false,
      error: {
        type: 'DATABASE_CONNECTION_ERROR',
        message: 'Database connection failed',
        statusCode: 503
      }
    });
  }

  next(err);
};

/**
 * Syntax error handler (for malformed JSON)
 */
const syntaxErrorHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'SYNTAX_ERROR',
        message: 'Invalid JSON format',
        statusCode: 400
      }
    });
  }

  next(err);
};

/**
 * Security error handler
 */
const securityErrorHandler = (err, req, res, next) => {
  // Handle potential security threats
  if (err.message && (
    err.message.includes('script') ||
    err.message.includes('injection') ||
    err.message.includes('xss')
  )) {
    return res.status(403).json({
      success: false,
      error: {
        type: 'SECURITY_ERROR',
        message: 'Security violation detected',
        statusCode: 403
      }
    });
  }

  next(err);
};

/**
 * Business logic error handler
 */
const businessLogicErrorHandler = (err, req, res, next) => {
  if (err.type === 'BUSINESS_LOGIC_ERROR') {
    return res.status(400).json({
      success: false,
      error: {
        type: 'BUSINESS_LOGIC_ERROR',
        message: err.message,
        statusCode: 400,
        code: err.code
      }
    });
  }

  next(err);
};

/**
 * External service error handler
 */
const externalServiceErrorHandler = (err, req, res, next) => {
  if (err.type === 'EXTERNAL_SERVICE_ERROR') {
    return res.status(502).json({
      success: false,
      error: {
        type: 'EXTERNAL_SERVICE_ERROR',
        message: 'External service unavailable',
        statusCode: 502,
        service: err.service
      }
    });
  }

  next(err);
};

/**
 * Error metrics collector
 */
const errorMetrics = {
  total: 0,
  byType: {},
  byStatusCode: {},
  byEndpoint: {}
};

const collectErrorMetrics = (err, req, res, next) => {
  errorMetrics.total++;
  
  const errorType = err.type || 'UNKNOWN_ERROR';
  errorMetrics.byType[errorType] = (errorMetrics.byType[errorType] || 0) + 1;
  
  const statusCode = getStatusCode(err);
  errorMetrics.byStatusCode[statusCode] = (errorMetrics.byStatusCode[statusCode] || 0) + 1;
  
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  errorMetrics.byEndpoint[endpoint] = (errorMetrics.byEndpoint[endpoint] || 0) + 1;
  
  next(err);
};

/**
 * Get error metrics
 */
const getErrorMetrics = () => {
  return errorMetrics;
};

/**
 * Reset error metrics
 */
const resetErrorMetrics = () => {
  errorMetrics.total = 0;
  errorMetrics.byType = {};
  errorMetrics.byStatusCode = {};
  errorMetrics.byEndpoint = {};
};

module.exports = {
  errorHandler,
  asyncErrorHandler,
  notFoundHandler,
  validationErrorHandler,
  mongoErrorHandler,
  jwtErrorHandler,
  multerErrorHandler,
  rateLimitErrorHandler,
  corsErrorHandler,
  timeoutErrorHandler,
  dbConnectionErrorHandler,
  syntaxErrorHandler,
  securityErrorHandler,
  businessLogicErrorHandler,
  externalServiceErrorHandler,
  collectErrorMetrics,
  getErrorMetrics,
  resetErrorMetrics
};
