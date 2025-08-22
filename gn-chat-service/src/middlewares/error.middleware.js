// Import các utility function xử lý lỗi từ errors module
const {
  formatErrorResponse, // Định dạng response lỗi
  logError, // Ghi log lỗi
  isOperationalError, // Kiểm tra lỗi có thể xử lý được
  getStatusCode, // Lấy HTTP status code từ lỗi
} = require("../utils/errors")

/**
 * Middleware xử lý lỗi toàn cục (Global error handling middleware)
 * Đây là middleware cuối cùng để bắt tất cả lỗi chưa được xử lý
 * @param {Error} err - Lỗi xảy ra
 * @param {Object} req - HTTP request
 * @param {Object} res - HTTP response
 * @param {Function} next - Next middleware
 */
const errorHandler = (err, req, res, next) => {
  // Ghi log lỗi kèm thông tin context để debug
  logError(err, {
    method: req.method, // HTTP method (GET, POST, etc.)
    url: req.url, // URL được gọi
    userAgent: req.get("User-Agent"), // Thông tin trình duyệt
    ip: req.ip, // Địa chỉ IP client
    userId: req.user?.id, // ID người dùng (nếu đã login)
    body: req.body, // Request body
    params: req.params, // URL parameters
    query: req.query, // Query string parameters
  })

  // Lấy HTTP status code phù hợp cho lỗi
  const statusCode = getStatusCode(err)

  // Định dạng error response cho client
  const errorResponse = formatErrorResponse(
    err,
    process.env.NODE_ENV === "development"
  )

  // Gửi error response về client
  res.status(statusCode).json(errorResponse)
}

/**
 * Wrapper cho async functions để bắt lỗi async
 * Tự động chuyển async errors đến error handler
 * @param {Function} fn - Async function cần wrap
 * @returns {Function} Wrapped function
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Xử lý 404 Not Found cho các route không tồn tại
 * Được gọi khi không có route nào khớp với request
 */
const notFoundHandler = (req, res, next) => {
  const error = {
    success: false,
    error: {
      type: "NOT_FOUND_ERROR",
      message: `Route ${req.method} ${req.originalUrl} not found`, // Route không tồn tại
      statusCode: 404,
    },
  }

  res.status(404).json(error)
}

/**
 * Xử lý lỗi validation (kiểm tra dữ liệu đầu vào)
 * Chức năng xử lý các lỗi validation từ Mongoose hoặc Joi
 */
const validationErrorHandler = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    // Trích xuất các lỗi validation thành mảng
    const errors = Object.values(err.errors).map((error) => ({
      field: error.path, // Tên field bị lỗi
      message: error.message, // Thông điệp lỗi
    }))

    return res.status(400).json({
      success: false,
      error: {
        type: "VALIDATION_ERROR",
        message: "Validation failed", // Xác thực thất bại
        statusCode: 400,
        details: errors, // Chi tiết các lỗi
      },
    })
  }

  next(err) // Chuyển cho error handler tiếp theo
}

/**
 * MongoDB error handler
 */
const mongoErrorHandler = (err, req, res, next) => {
  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(400).json({
      success: false,
      error: {
        type: "DUPLICATE_ERROR",
        message: `${field} already exists`,
        statusCode: 400,
        field: field,
      },
    })
  }

  // Cast error
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: {
        type: "CAST_ERROR",
        message: "Invalid ID format",
        statusCode: 400,
      },
    })
  }

  next(err)
}

/**
 * JWT error handler
 */
const jwtErrorHandler = (err, req, res, next) => {
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: {
        type: "JWT_ERROR",
        message: "Invalid token",
        statusCode: 401,
      },
    })
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: {
        type: "TOKEN_EXPIRED_ERROR",
        message: "Token expired",
        statusCode: 401,
      },
    })
  }

  next(err)
}

/**
 * Multer error handler (for file uploads)
 */
const multerErrorHandler = (err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      error: {
        type: "FILE_SIZE_ERROR",
        message: "File too large",
        statusCode: 400,
      },
    })
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      success: false,
      error: {
        type: "FILE_COUNT_ERROR",
        message: "Too many files",
        statusCode: 400,
      },
    })
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      error: {
        type: "UNEXPECTED_FILE_ERROR",
        message: "Unexpected file field",
        statusCode: 400,
      },
    })
  }

  next(err)
}

/**
 * Rate limit error handler
 */
const rateLimitErrorHandler = (err, req, res, next) => {
  if (err.type === "RATE_LIMIT_ERROR") {
    return res.status(429).json({
      success: false,
      error: {
        type: "RATE_LIMIT_ERROR",
        message: "Too many requests, please try again later",
        statusCode: 429,
        retryAfter: err.retryAfter || 60,
      },
    })
  }

  next(err)
}

/**
 * CORS error handler
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      success: false,
      error: {
        type: "CORS_ERROR",
        message: "CORS policy violation",
        statusCode: 403,
      },
    })
  }

  next(err)
}

/**
 * Timeout error handler
 */
const timeoutErrorHandler = (err, req, res, next) => {
  if (err.code === "TIMEOUT" || err.message.includes("timeout")) {
    return res.status(408).json({
      success: false,
      error: {
        type: "TIMEOUT_ERROR",
        message: "Request timeout",
        statusCode: 408,
      },
    })
  }

  next(err)
}

/**
 * Database connection error handler
 */
const dbConnectionErrorHandler = (err, req, res, next) => {
  if (err.name === "MongoNetworkError" || err.name === "MongoServerError") {
    return res.status(503).json({
      success: false,
      error: {
        type: "DATABASE_CONNECTION_ERROR",
        message: "Database connection failed",
        statusCode: 503,
      },
    })
  }

  next(err)
}

/**
 * Error handler middleware stack
 */
const errorHandlerStack = [
  corsErrorHandler,
  jwtErrorHandler,
  validationErrorHandler,
  mongoErrorHandler,
  multerErrorHandler,
  timeoutErrorHandler,
  dbConnectionErrorHandler,
  rateLimitErrorHandler,
  errorHandler,
]

/**
 * Apply all error handlers
 */
const applyErrorHandlers = (app) => {
  // Apply 404 handler for undefined routes
  app.use("*", notFoundHandler)

  // Apply error handler stack
  errorHandlerStack.forEach((handler) => {
    app.use(handler)
  })
}

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
  errorHandlerStack,
  applyErrorHandlers,
}
