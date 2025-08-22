// Service xử lý các chức năng liên quan đến người dùng
const { getPool } = require("../config/postgres") // Pool kết nối PostgreSQL
const { getRedisClient } = require("../config/redis") // Redis client cho cache và trạng thái

/**
 * Lấy thông tin người dùng từ cơ sở dữ liệu PostgreSQL
 * Sử dụng cho:
 * - Xác thực người dùng trong auth middleware
 * - Hiển thị thông tin profile trong chat
 * - Lấy thông tin người gửi tin nhắn
 * @param {number} userId - ID người dùng
 * @returns {Promise<Object|null>} - Thông tin người dùng hoặc null nếu không tìm thấy
 */
const getUserInfo = async (userId) => {
  try {
    const pool = getPool() // Lấy pool kết nối PostgreSQL

    // Truy vấn thông tin người dùng từ bảng user
    const result = await pool.query(
      `SELECT 
        user_id,        -- ID người dùng
        user_account,   -- Tên đăng nhập
        user_nickname,  -- Tên hiển thị
        user_avatar,    -- Ảnh đại diện
        user_state,     -- Trạng thái tài khoản (1: active, 0: inactive)
        user_mobile,    -- Số điện thoại
        user_email      -- Email
      FROM pre_go_acc_user_info_9999 
      WHERE user_id = $1`,
      [userId]
    )

    // Kiểm tra kết quả truy vấn
    if (result.rows.length === 0) {
      return null // Không tìm thấy người dùng
    }

    return result.rows[0] // Trả về thông tin người dùng đầu tiên
  } catch (error) {
    console.error("Error getting user info:", error)
    throw error // Throw lại lỗi để controller xử lý
  }
}

/**
 * Lấy thông tin của nhiều người dùng cùng lúc
 * Tối ưu hóa hiệu suất bằng cách sử dụng batch query
 * Sử dụng cho:
 * - Hiển thị danh sách thành viên trong cuộc trò chuyện nhóm
 * - Lấy thông tin người gửi trong danh sách tin nhắn
 * @param {number[]} userIds - Mảng các ID người dùng
 * @returns {Promise<Object[]>} - Mảng thông tin người dùng
 */
const getUsersInfo = async (userIds) => {
  try {
    // Kiểm tra input hợp lệ
    if (!userIds || userIds.length === 0) {
      return [] // Trả về mảng rỗng nếu không có ID nào
    }

    const pool = getPool()

    // Sử dụng ANY() để truy vấn nhiều user cùng lúc
    const result = await pool.query(
      `SELECT 
        user_id,        -- ID người dùng
        user_account,   -- Tên đăng nhập
        user_nickname,  -- Tên hiển thị
        user_avatar,    -- Ảnh đại diện
        user_state      -- Trạng thái tài khoản
      FROM pre_go_acc_user_info_9999 
      WHERE user_id = ANY($1)`, // ANY() cho phép query với array
      [userIds]
    )

    return result.rows // Trả về tất cả kết quả
  } catch (error) {
    console.error("Error getting users info:", error)
    throw error
  }
}

/**
 * Lấy trạng thái online/offline của người dùng từ Redis
 * Trạng thái được cập nhật real-time qua Socket.IO
 * Sử dụng cho:
 * - Hiển thị trạng thái trong danh sách bạn bè
 * - Hiển thị trạng thái trong cuộc trò chuyện
 * @param {number} userId - ID người dùng
 * @returns {Promise<string>} - Trạng thái ('online', 'offline', 'away')
 */
const getUserStatus = async (userId) => {
  try {
    const redisClient = getRedisClient() // Lấy Redis client

    // Lấy trạng thái từ Redis cache
    const status = await redisClient.get(`user:${userId}:status`)

    return status || "offline" // Mặc định offline nếu không có dữ liệu
  } catch (error) {
    console.error("Error getting user status:", error)
    return "offline" // Trả về offline khi có lỗi (fail-safe)
  }
}

/**
 * Lấy trạng thái của nhiều người dùng cùng lúc
 * Sử dụng Redis pipeline để tối ưu hóa hiệu suất
 * Sử dụng cho:
 * - Hiển thị trạng thái trong cuộc trò chuyện nhóm
 * - Cập nhật bulk trạng thái trong UI
 * @param {number[]} userIds - Mảng các ID người dùng
 * @returns {Promise<Object>} - Object với key là userId, value là trạng thái
 */
const getUsersStatus = async (userIds) => {
  try {
    // Kiểm tra input hợp lệ
    if (!userIds || userIds.length === 0) {
      return {} // Trả về object rỗng nếu không có ID nào
    }

    const redisClient = getRedisClient()

    // Sử dụng Redis pipeline để thực hiện nhiều lệnh cùng lúc
    const pipeline = redisClient.multi()

    // Thêm tất cả các lệnh GET vào pipeline
    userIds.forEach((userId) => {
      pipeline.get(`user:${userId}:status`)
    })

    // Thực thi tất cả lệnh cùng lúc
    const results = await pipeline.exec()

    // Tạo object map kết quả
    const statusMap = {}
    userIds.forEach((userId, index) => {
      statusMap[userId] = results[index] || "offline" // Mặc định offline
    })

    return statusMap
  } catch (error) {
    console.error("Error getting users status:", error)

    // Trả về tất cả user là offline khi có lỗi (fail-safe)
    const statusMap = {}
    userIds.forEach((userId) => {
      statusMap[userId] = "offline"
    })

    return statusMap
  }
}

// Export các hàm service để sử dụng trong controller
module.exports = {
  getUserInfo, // Lấy thông tin 1 người dùng
  getUsersInfo, // Lấy thông tin nhiều người dùng
  getUserStatus, // Lấy trạng thái 1 người dùng
  getUsersStatus, // Lấy trạng thái nhiều người dùng
}
