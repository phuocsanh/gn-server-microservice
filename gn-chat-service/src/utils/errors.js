/**
 * Các class lỗi tùy chỉnh để xử lý lỗi tốt hơn
 * Cung cấp hệ thống lỗi có cấu trúc, dễ debug và maintain
 * Hỗ trợ các loại lỗi khác nhau với HTTP status code tương ứng
 */

/**
 * Base class cho tất cả các loại lỗi trong ứng dụng
 * Chứa các thuộc tính chung: message, statusCode, isOperational
 */

class BaseError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message) // Gọi constructor của Error class
    this.name = this.constructor.name // Tên class (ValidationError, AuthenticationError, etc.)
    this.statusCode = statusCode // HTTP status code để trả về client
    this.isOperational = isOperational // Lỗi có thể xử lý được hay lỗi hệ thống

    // Giữ lại stack trace cho việc debug
    Error.captureStackTrace(this, this.constructor)
  }
}

// Lỗi xác thực dữ liệu đầu vào (400 Bad Request)
class ValidationError extends BaseError {
  constructor(message, field = null) {
    super(message, 400)
    this.field = field // Field cụ thể gây lỗi (ví dụ: 'email', 'password')
    this.type = "VALIDATION_ERROR" // Loại lỗi để phân biệt
  }
}

// Lỗi xác thực người dùng (401 Unauthorized)
class AuthenticationError extends BaseError {
  constructor(message = "Authentication failed") {
    super(message, 401)
    this.type = "AUTHENTICATION_ERROR"
  }
}

// Lỗi phân quyền (403 Forbidden)
class AuthorizationError extends BaseError {
  constructor(message = "Access denied") {
    super(message, 403)
    this.type = "AUTHORIZATION_ERROR"
  }
}

// Lỗi không tìm thấy tài nguyên (404 Not Found)
class NotFoundError extends BaseError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404)
    this.type = "NOT_FOUND_ERROR"
  }
}

// Lỗi xung đột dữ liệu (409 Conflict)
class ConflictError extends BaseError {
  constructor(message = "Resource already exists") {
    super(message, 409)
    this.type = "CONFLICT_ERROR"
  }
}

class DatabaseError extends BaseError {
  constructor(message = "Database operation failed", operation = null) {
    super(message, 500)
    this.operation = operation
    this.type = "DATABASE_ERROR"
  }
}

class ExternalServiceError extends BaseError {
  constructor(service, message = "External service error") {
    super(`${service}: ${message}`, 502)
    this.service = service
    this.type = "EXTERNAL_SERVICE_ERROR"
  }
}

class RateLimitError extends BaseError {
  constructor(message = "Rate limit exceeded") {
    super(message, 429)
    this.type = "RATE_LIMIT_ERROR"
  }
}

class FileUploadError extends BaseError {
  constructor(message = "File upload failed") {
    super(message, 400)
    this.type = "FILE_UPLOAD_ERROR"
  }
}

class BusinessLogicError extends BaseError {
  constructor(message, code = "BUSINESS_ERROR") {
    super(message, 400)
    this.code = code
    this.type = "BUSINESS_LOGIC_ERROR"
  }
}

// Error codes for consistent error handling
const ERROR_CODES = {
  // Validation errors
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",

  // Authentication errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",

  // Authorization errors
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  ACCESS_DENIED: "ACCESS_DENIED",

  // Resource errors
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS",

  // Chat specific errors
  CONVERSATION_NOT_FOUND: "CONVERSATION_NOT_FOUND",
  MESSAGE_NOT_FOUND: "MESSAGE_NOT_FOUND",
  INVALID_PARTICIPANT: "INVALID_PARTICIPANT",
  CONVERSATION_FULL: "CONVERSATION_FULL",

  // File errors
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_UPLOAD_FAILED: "FILE_UPLOAD_FAILED",

  // Database errors
  DATABASE_CONNECTION_ERROR: "DATABASE_CONNECTION_ERROR",
  DATABASE_QUERY_ERROR: "DATABASE_QUERY_ERROR",
  DATABASE_TRANSACTION_ERROR: "DATABASE_TRANSACTION_ERROR",

  // External service errors
  S3_UPLOAD_ERROR: "S3_UPLOAD_ERROR",
  REDIS_CONNECTION_ERROR: "REDIS_CONNECTION_ERROR",
  POSTGRES_CONNECTION_ERROR: "POSTGRES_CONNECTION_ERROR",

  // Rate limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // General errors
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
}

// Error factory functions
const createValidationError = (message, field = null) => {
  return new ValidationError(message, field)
}

const createAuthenticationError = (message) => {
  return new AuthenticationError(message)
}

const createAuthorizationError = (message) => {
  return new AuthorizationError(message)
}

const createNotFoundError = (resource) => {
  return new NotFoundError(resource)
}

const createConflictError = (message) => {
  return new ConflictError(message)
}

const createDatabaseError = (message, operation) => {
  return new DatabaseError(message, operation)
}

const createExternalServiceError = (service, message) => {
  return new ExternalServiceError(service, message)
}

const createFileUploadError = (message) => {
  return new FileUploadError(message)
}

const createBusinessLogicError = (message, code) => {
  return new BusinessLogicError(message, code)
}

// Error checking utilities
const isOperationalError = (error) => {
  if (error instanceof BaseError) {
    return error.isOperational
  }
  return false
}

const getErrorType = (error) => {
  if (error instanceof BaseError) {
    return error.type || "UNKNOWN_ERROR"
  }
  return "SYSTEM_ERROR"
}

const getStatusCode = (error) => {
  if (error instanceof BaseError) {
    return error.statusCode
  }
  return 500
}

// Error response formatter
const formatErrorResponse = (error, includeStack = false) => {
  const response = {
    success: false,
    error: {
      type: getErrorType(error),
      message: error.message,
      statusCode: getStatusCode(error),
    },
  }

  // Add additional error properties
  if (error instanceof ValidationError && error.field) {
    response.error.field = error.field
  }

  if (error instanceof DatabaseError && error.operation) {
    response.error.operation = error.operation
  }

  if (error instanceof ExternalServiceError && error.service) {
    response.error.service = error.service
  }

  if (error instanceof BusinessLogicError && error.code) {
    response.error.code = error.code
  }

  // Include stack trace in development
  if (includeStack && error.stack) {
    response.error.stack = error.stack
  }

  return response
}

// Error logging helper
const logError = (error, context = {}) => {
  const errorInfo = {
    type: getErrorType(error),
    message: error.message,
    statusCode: getStatusCode(error),
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  }

  if (isOperationalError(error)) {
    console.warn("Operational Error:", errorInfo)
  } else {
    console.error("System Error:", errorInfo)
  }
}

// Async error wrapper
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Error middleware
const errorMiddleware = (error, req, res, next) => {
  // Log the error
  logError(error, {
    method: req.method,
    url: req.url,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
  })

  // Send error response
  const statusCode = getStatusCode(error)
  const errorResponse = formatErrorResponse(
    error,
    process.env.NODE_ENV === "development"
  )

  res.status(statusCode).json(errorResponse)
}

module.exports = {
  // Error classes
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  FileUploadError,
  BusinessLogicError,

  // Error codes
  ERROR_CODES,

  // Factory functions
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createConflictError,
  createDatabaseError,
  createExternalServiceError,
  createFileUploadError,
  createBusinessLogicError,

  // Utilities
  isOperationalError,
  getErrorType,
  getStatusCode,
  formatErrorResponse,
  logError,
  asyncErrorHandler,
  errorMiddleware,
}
