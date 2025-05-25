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
const dbLogging = {
  logQuery: (operation, collection, query, duration) => {
    logger.debug('Database query', {
      type: 'database',
      operation,
      collection,
      query: sanitizeObject(query, ['password'], 200),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  },

  logError: (operation, collection, error) => {
    logger.error('Database error', {
      type: 'database',
      operation,
      collection,
      error: {
        name: error.name,
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Utility functions
 */
const generateRequestId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

const sanitizeHeaders = (headers, sensitiveFields) => {
  const sanitized = { ...headers };
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  return sanitized;
};

const sanitizeObject = (obj, sensitiveFields, maxSize = 1024) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = JSON.parse(JSON.stringify(obj));
  
  // Remove sensitive fields
  const removeSensitiveFields = (object) => {
    if (Array.isArray(object)) {
      return object.map(removeSensitiveFields);
    } else if (object && typeof object === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(object)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          cleaned[key] = '[REDACTED]';
        } else {
          cleaned[key] = removeSensitiveFields(value);
        }
      }
      return cleaned;
    }
    return object;
  };

  const cleaned = removeSensitiveFields(sanitized);
  
  // Truncate if too large
  const stringified = JSON.stringify(cleaned);
  if (stringified.length > maxSize) {
    return stringified.substring(0, maxSize) + '... [TRUNCATED]';
  }
  
  return cleaned;
};

/**
 * Request ID middleware
 */
const requestId = (req, res, next) => {
  req.requestId = req.get('X-Request-ID') || generateRequestId();
  res.set('X-Request-ID', req.requestId);
  next();
};

module.exports = {
  logger,
  requestLogging,
  detailedLogging,
  securityLogging,
  performanceLogging,
  errorLogging,
  dbLogging,
  requestId,
  generateRequestId,
  sanitizeHeaders,
  sanitizeObject
};
