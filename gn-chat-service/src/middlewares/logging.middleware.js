const morgan = require('morgan');
const winston = require('winston');

/**
 * Create Winston logger instance
 */
const createLogger = () => {
  const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'gn-chat-service' },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });

  // Add file transport in production
  if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }));
    logger.add(new winston.transports.File({
      filename: 'logs/combined.log'
    }));
  }

  return logger;
};

const logger = createLogger();

/**
 * Custom Morgan token for user ID
 */
morgan.token('user-id', (req) => {
  return req.user?.id || 'anonymous';
});

/**
 * Custom Morgan token for request ID
 */
morgan.token('request-id', (req) => {
  return req.requestId || 'unknown';
});

/**
 * Custom Morgan token for response time in ms
 */
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '';
  }
  
  const ms = (res._startAt[0] - req._startAt[0]) * 1000 +
             (res._startAt[1] - req._startAt[1]) * 1e-6;
  return ms.toFixed(3);
});

/**
 * Custom Morgan format for structured logging
 */
const morganFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  contentLength: ':res[content-length]',
  responseTime: ':response-time-ms ms',
  userAgent: ':user-agent',
  ip: ':remote-addr',
  userId: ':user-id',
  requestId: ':request-id',
  timestamp: ':date[iso]'
});

/**
 * Request logging middleware using Morgan
 */
const requestLogging = morgan(morganFormat, {
  stream: {
    write: (message) => {
      try {
        const logData = JSON.parse(message.trim());
        const statusCode = parseInt(logData.status);
        
        // Log based on status code
        if (statusCode >= 500) {
          logger.error('HTTP Request', logData);
        } else if (statusCode >= 400) {
          logger.warn('HTTP Request', logData);
        } else {
          logger.info('HTTP Request', logData);
        }
      } catch (error) {
        logger.error('Failed to parse log message', { message, error: error.message });
      }
    }
  },
  skip: (req) => {
    // Skip logging for health checks and static files
    const skipPaths = ['/health', '/favicon.ico', '/robots.txt'];
    return skipPaths.includes(req.path);
  }
});

/**
 * Detailed request/response logging middleware
 */
const detailedLogging = (options = {}) => {
  const {
    logRequestBody = false,
    logResponseBody = false,
    maxBodySize = 1024,
    sensitiveFields = ['password', 'token', 'secret', 'key']
  } = options;

  return (req, res, next) => {
    const startTime = Date.now();
    
    // Generate request ID if not present
    if (!req.requestId) {
      req.requestId = generateRequestId();
    }

    // Log request
    const requestLog = {
      type: 'request',
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers, sensitiveFields),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    };

    // Add request body if enabled
    if (logRequestBody && req.body) {
      requestLog.body = sanitizeObject(req.body, sensitiveFields, maxBodySize);
    }

    logger.info('Request received', requestLog);

    // Capture response
    const originalSend = res.send;
    let responseBody;

    res.send = function(data) {
      responseBody = data;
      return originalSend.call(this, data);
    };

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      const responseLog = {
        type: 'response',
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('Content-Length'),
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      };

      // Add response body if enabled
      if (logResponseBody && responseBody) {
        try {
          const parsedBody = typeof responseBody === 'string' 
            ? JSON.parse(responseBody) 
            : responseBody;
          responseLog.body = sanitizeObject(parsedBody, sensitiveFields, maxBodySize);
        } catch (error) {
          responseLog.body = responseBody.toString().substring(0, maxBodySize);
        }
      }

      // Log based on status code
      if (res.statusCode >= 500) {
        logger.error('Response sent', responseLog);
      } else if (res.statusCode >= 400) {
        logger.warn('Response sent', responseLog);
      } else {
        logger.info('Response sent', responseLog);
      }
    });

    next();
  };
};

/**
 * Security event logging middleware
 */
const securityLogging = (req, res, next) => {
  // Log authentication attempts
  if (req.path.includes('/auth/') || req.path.includes('/login')) {
    logger.info('Authentication attempt', {
      type: 'security',
      event: 'auth_attempt',
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }

  // Log failed authentication on response
  res.on('finish', () => {
    if ((req.path.includes('/auth/') || req.path.includes('/login')) && res.statusCode >= 400) {
      logger.warn('Authentication failed', {
        type: 'security',
        event: 'auth_failed',
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }
  });

  next();
};

/**
 * Performance logging middleware
 */
const performanceLogging = (threshold = 1000) => {
  return (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      if (duration > threshold) {
        logger.warn('Slow request detected', {
          type: 'performance',
          method: req.method,
          url: req.url,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          ip: req.ip,
          userId: req.user?.id,
          timestamp: new Date().toISOString()
        });
      }
    });

    next();
  };
};

/**
 * Error logging middleware
 */
const errorLogging = (err, req, res, next) => {
  logger.error('Request error', {
    type: 'error',
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    },
    request: {
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers, ['authorization', 'cookie']),
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    },
    timestamp: new Date().toISOString()
  });

  next(err);
};

/**
 * Database operation logging
 */
const dbLogger = {
  log: (message, level = 'info') => {
    logger[level]('Database operation', {
      type: 'database',
      message,
      timestamp: new Date().toISOString()
    });
  },
  info: (message) => dbLogger.log(message, 'info'),
  warn: (message) => dbLogger.log(message, 'warn'),
  error: (message) => dbLogger.log(message, 'error')
};

/**
 * Generate unique request ID
 */
const generateRequestId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
};

/**
 * Sanitize headers to remove sensitive information
 */
const sanitizeHeaders = (headers, sensitiveFields = []) => {
  const sanitized = { ...headers };
  
  sensitiveFields.forEach(field => {
    Object.keys(sanitized).forEach(key => {
      if (key.toLowerCase().includes(field.toLowerCase()) && sanitized[key]) {
        sanitized[key] = '***REDACTED***';
      }
    });
  });
  
  return sanitized;
};

/**
 * Sanitize object to remove sensitive information and truncate if too large
 */
const sanitizeObject = (obj, sensitiveFields = [], maxSize = 1024) => {
  if (!obj) return obj;
  
  // Convert to string if not an object
  if (typeof obj !== 'object') {
    return String(obj).substring(0, maxSize);
  }
  
  // Clone the object to avoid modifying the original
  const sanitized = JSON.parse(JSON.stringify(obj));
  
  // Recursive function to sanitize nested objects
  const sanitizeRecursive = (object, fields) => {
    if (!object || typeof object !== 'object') return;
    
    Object.keys(object).forEach(key => {
      // Check if key contains any sensitive field
      const isSensitive = fields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      );
      
      if (isSensitive && object[key]) {
        object[key] = '***REDACTED***';
      } else if (typeof object[key] === 'object') {
        sanitizeRecursive(object[key], fields);
      }
    });
  };
  
  sanitizeRecursive(sanitized, sensitiveFields);
  
  // Truncate if JSON representation is too large
  const jsonString = JSON.stringify(sanitized);
  if (jsonString.length > maxSize) {
    return {
      _truncated: true,
      _originalSize: jsonString.length,
      _message: 'Object was truncated due to size limits',
      ...JSON.parse(jsonString.substring(0, maxSize) + '"}')
    };
  }
  
  return sanitized;
};

/**
 * Logging middleware stack
 */
const loggingMiddlewareStack = [
  requestLogging,
  securityLogging,
  performanceLogging(1000), // Log requests taking more than 1 second
  errorLogging
];

/**
 * Apply all logging middlewares
 */
const applyLoggingMiddlewares = (app) => {
  loggingMiddlewareStack.forEach(middleware => {
    app.use(middleware);
  });
};

module.exports = {
  logger,
  requestLogging,
  detailedLogging,
  securityLogging,
  performanceLogging,
  errorLogging,
  dbLogger,
  loggingMiddlewareStack,
  applyLoggingMiddlewares,
  sanitizeHeaders,
  sanitizeObject,
  generateRequestId
};
