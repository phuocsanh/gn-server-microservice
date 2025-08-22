// Middleware xác thực người dùng bằng JWT token
const jwt = require("jsonwebtoken") // Thư viện xử lý JWT
const { getUserInfo } = require("../services/user.service") // Service lấy thông tin người dùng

/**
 * Middleware xác thực (Authentication middleware)
 * Chức năng:
 * - Kiểm tra và xác thực JWT token từ header Authorization
 * - Giải mã token để lấy thông tin người dùng
 * - Kiểm tra trạng thái tài khoản người dùng
 * - Gắn thông tin người dùng vào request object (req.user)
 * - Xử lý các lỗi liên quan đến token (hết hạn, không hợp lệ)
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @param {Function} next - Next middleware function
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Lấy token từ Authorization header (format: "Bearer <token>")
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing", // Token xác thực bị thiếu
      })
    }

    // Tách token ra khỏi header (loại bỏ "Bearer " prefix)
    const token = authHeader.split(" ")[1]

    // Xác thực token bằng JWT secret
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error("JWT_SECRET environment variable is not set")
      return res.status(500).json({
        success: false,
        message: "Server configuration error", // Lỗi cấu hình server
      })
    }

    // Giải mã token để lấy thông tin người dùng
    const decoded = jwt.verify(token, jwtSecret)

    // Lấy thông tin chi tiết người dùng từ database
    const user = await getUserInfo(decoded.user_id)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found", // Không tìm thấy người dùng
      })
    }

    // Kiểm tra trạng thái tài khoản người dùng (chỉ cho phép tài khoản đang hoạt động)
    if (user.user_state !== 1) {
      return res.status(403).json({
        success: false,
        message: "User account is not active", // Tài khoản người dùng không hoạt động
      })
    }

    // Gắn thông tin người dùng vào request object để sử dụng ọ các middleware/controller tiếp theo
    req.user = {
      id: user.user_id, // ID người dùng
      account: user.user_account, // Tên đăng nhập
      nickname: user.user_nickname, // Tên hiển thị
      avatar: user.user_avatar, // Ảnh đại diện
      email: user.user_email, // Email
      mobile: user.user_mobile, // Số điện thoại
    }

    next() // Chuyển điển điều khiển cho middleware/controller tiếp theo
  } catch (error) {
    // Xử lý các lỗi liên quan đến JWT
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token", // Token không hợp lệ
      })
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired", // Token đã hết hạn
      })
    }

    // Xử lý các lỗi khác
    console.error("Authentication error:", error)
    return res.status(500).json({
      success: false,
      message: "Internal server error", // Lỗi nội bộ server
    })
  }
}

// Export middleware để sử dụng trong routes
module.exports = authMiddleware
