/**
 * CORS (Cross-Origin Resource Sharing) middleware
 * Xử lý các yêu cầu từ các domain khác nhau
 * Đảm bảo bảo mật và kiểm soát truy cập API
 */

const cors = require("cors") // Thư viện xử lý CORS

/**
 * Cấu hình CORS cơ bản
 * Quy định các domain nào được phép truy cập API
 */
const corsOptions = {
  // Hàm xác định origin nào được phép
  origin: function (origin, callback) {
    // Cho phép các request không có origin (như mobile app hoặc curl)
    if (!origin) return callback(null, true)

    // Danh sách các domain được phép
    const allowedOrigins = [
      "http://localhost:3000", // React development server
      "http://localhost:3001", // Alternative development port
      "http://127.0.0.1:3000", // Local IP alternative
      "http://127.0.0.1:3001",
      "https://localhost:3000", // HTTPS local development
      "https://localhost:3001",
      // Thêm các domain production ở đây
      // 'https://yourdomain.com',
      // 'https://www.yourdomain.com'
    ]

    // Kiểm tra origin có trong whitelist không
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true) // Cho phép
    } else {
      console.warn(`CORS: Origin ${origin} not allowed`)
      callback(new Error("Not allowed by CORS")) // Từ chối
    }
  },

  // Các HTTP methods được phép
  methods: [
    "GET", // Đọc dữ liệu
    "POST", // Tạo mới
    "PUT", // Cập nhật toàn bộ
    "DELETE", // Xóa
    "OPTIONS", // Preflight request
    "PATCH", // Cập nhật một phần
  ],

  // Các headers được phép gửi từ client
  allowedHeaders: [
    "Origin", // Nguồn gốc request
    "X-Requested-With", // AJAX request header
    "Content-Type", // Loại nội dung
    "Accept", // Loại response mong muốn
    "Authorization", // Token xác thực
    "X-API-Key", // API key
    "X-Request-ID", // ID theo dõi request
  ],

  // Các headers mà client có thể đọc từ response
  exposedHeaders: [
    "X-Request-ID", // ID request để debug
    "X-RateLimit-Limit", // Giới hạn rate limit
    "X-RateLimit-Remaining", // Số request còn lại
    "X-RateLimit-Reset", // Thời điểm reset rate limit
  ],

  credentials: true, // Cho phép gửi cookies và credentials

  maxAge: 86400, // 24 giờ - thời gian browser cache preflight response

  optionsSuccessStatus: 200, // Một số browser cũ không hỗ trợ status 204
}

/**
 * Cấu hình CORS cho development (cho phép tất cả)
 * Sử dụng khi phát triển để không bị chặn bởi CORS
 */
const devCorsOptions = {
  origin: true, // Cho phép tất cả origin trong development
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["*"], // Cho phép tất cả headers
  credentials: true,
  maxAge: 86400,
}

/**
 * Cấu hình CORS cho production (chặt chẽ hơn)
 * Chỉ cho phép các domain cụ thể để bảo mật
 */
const prodCorsOptions = {
  origin: [
    // Thêm các domain production ở đây
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    "https://api.yourdomain.com",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
  credentials: true,
  maxAge: 86400,
}

/**
 * Lấy cấu hình CORS dựa trên môi trường
 * Tự động chọn cấu hình phù hợp
 */
const getCorsOptions = () => {
  const env = process.env.NODE_ENV || "development"

  switch (env) {
    case "production":
      return prodCorsOptions
    case "development":
      return devCorsOptions
    case "test":
      return devCorsOptions
    default:
      return corsOptions
  }
}

/**
 * Custom CORS middleware with additional security
 */
const customCorsMiddleware = (req, res, next) => {
  const origin = req.headers.origin

  // Log CORS requests for monitoring
  if (origin) {
    console.log(`CORS request from origin: ${origin}`)
  }

  // Add security headers
  res.header("X-Content-Type-Options", "nosniff")
  res.header("X-Frame-Options", "DENY")
  res.header("X-XSS-Protection", "1; mode=block")

  // Continue with CORS processing
  next()
}

/**
 * CORS middleware factory
 */
const createCorsMiddleware = (options = null) => {
  const corsConfig = options || getCorsOptions()
  return [customCorsMiddleware, cors(corsConfig)]
}

/**
 * Default CORS middleware
 */
const corsMiddleware = createCorsMiddleware()

/**
 * Preflight handler for complex CORS requests
 */
const handlePreflight = (req, res, next) => {
  if (req.method === "OPTIONS") {
    // Handle preflight request
    const origin = req.headers.origin
    const allowedOrigins = getCorsOptions().origin

    if (typeof allowedOrigins === "function") {
      allowedOrigins(origin, (err, allowed) => {
        if (err || !allowed) {
          return res.status(403).json({
            success: false,
            error: "CORS policy violation",
          })
        }

        res.header("Access-Control-Allow-Origin", origin)
        res.header(
          "Access-Control-Allow-Methods",
          "GET,POST,PUT,DELETE,OPTIONS,PATCH"
        )
        res.header(
          "Access-Control-Allow-Headers",
          "Origin,X-Requested-With,Content-Type,Accept,Authorization,X-API-Key"
        )
        res.header("Access-Control-Allow-Credentials", "true")
        res.header("Access-Control-Max-Age", "86400")

        return res.status(200).end()
      })
    } else {
      // Simple origin check
      if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin)
      } else if (allowedOrigins === true) {
        res.header("Access-Control-Allow-Origin", origin)
      }

      res.header(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,OPTIONS,PATCH"
      )
      res.header(
        "Access-Control-Allow-Headers",
        "Origin,X-Requested-With,Content-Type,Accept,Authorization,X-API-Key"
      )
      res.header("Access-Control-Allow-Credentials", "true")
      res.header("Access-Control-Max-Age", "86400")

      return res.status(200).end()
    }
  } else {
    next()
  }
}

/**
 * CORS error handler
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      error: {
        type: "CORS_ERROR",
        message: "CORS policy violation",
        statusCode: 403,
        origin: req.headers.origin,
      },
    })
  }
  next(err)
}

/**
 * Validate origin against whitelist
 */
const validateOrigin = (origin, whitelist) => {
  if (!origin) return true // Allow requests with no origin

  if (Array.isArray(whitelist)) {
    return whitelist.includes(origin)
  }

  if (typeof whitelist === "string") {
    return whitelist === origin
  }

  if (whitelist === true) {
    return true
  }

  return false
}

/**
 * Dynamic CORS based on request
 */
const dynamicCors = (req, res, next) => {
  const origin = req.headers.origin
  const userAgent = req.headers["user-agent"]

  // Different CORS rules based on user agent or other factors
  let corsConfig = getCorsOptions()

  // Example: More restrictive for certain user agents
  if (userAgent && userAgent.includes("bot")) {
    corsConfig = {
      ...corsConfig,
      credentials: false,
      methods: ["GET"],
    }
  }

  cors(corsConfig)(req, res, next)
}

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
  prodCorsOptions,
}
