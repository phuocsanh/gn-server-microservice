// Controller xử lý các chức năng liên quan đến người dùng
const userService = require("../services/user.service") // Service quản lý người dùng
const { getPool } = require("../config/postgres") // Pool kết nối PostgreSQL

/**
 * Lấy thông tin chi tiết của một người dùng
 * Chức năng:
 * - Lấy thông tin cơ bản (tên, nickname, avatar)
 * - Lấy trạng thái online/offline hiện tại
 * - Định dạng dữ liệu trả về cho client
 * @route GET /api/users/:userId
 * @param {Object} req - Request chứa userId trong params
 * @param {Object} res - Response trả về thông tin người dùng
 */
const getUserInfoController = async (req, res) => {
  try {
    const { userId } = req.params // Lấy userId từ URL parameter

    // Lấy thông tin người dùng từ database
    const userInfo = await userService.getUserInfo(parseInt(userId))

    // Kiểm tra người dùng có tồn tại không
    if (!userInfo) {
      return res.status(404).json({
        success: false,
        message: "User not found", // Không tìm thấy người dùng
      })
    }

    // Lấy trạng thái hiện tại của người dùng (online/offline)
    const status = await userService.getUserStatus(parseInt(userId))

    // Trả về thông tin đã được định dạng
    res.status(200).json({
      success: true,
      data: {
        id: userInfo.user_id, // ID người dùng
        account: userInfo.user_account, // Tên đăng nhập
        nickname: userInfo.user_nickname, // Tên hiển thị
        avatar: userInfo.user_avatar, // Ảnh đại diện
        status, // Trạng thái online/offline
      },
    })
  } catch (error) {
    console.error("Error getting user info:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get user info",
    })
  }
}

/**
 * Lấy trạng thái của một người dùng (online/offline)
 * Chức năng:
 * - Kiểm tra trạng thái hoạt động hiện tại
 * - Trả về thông tin trạng thái từ Redis cache
 * - Sử dụng cho việc hiển thị trạng thái trong danh sách bạn bè
 * @route GET /api/users/status/:userId
 * @param {Object} req - Request chứa userId trong params
 * @param {Object} res - Response trả về trạng thái người dùng
 */
const getUserStatusController = async (req, res) => {
  try {
    const { userId } = req.params // Lấy userId từ URL parameter

    // Lấy trạng thái từ Redis cache
    const status = await userService.getUserStatus(parseInt(userId))

    res.status(200).json({
      success: true,
      data: {
        userId: parseInt(userId),
        status, // "online", "offline", "away", etc.
      },
    })
  } catch (error) {
    console.error("Error getting user status:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get user status",
    })
  }
}

/**
 * Lấy trạng thái của nhiều người dùng cùng lúc
 * Chức năng:
 * - Lấy trạng thái của danh sách người dùng
 * - Tối ưu hiệu suất bằng cách gọi batch request
 * - Trả về object map với key là userId và value là status
 * - Sử dụng cho việc hiển thị trạng thái trong cuộc trò chuyện nhóm
 * @route GET /api/users/status?userIds=1,2,3
 * @param {Object} req - Request chứa userIds trong query string
 * @param {Object} res - Response trả về map trạng thái của các người dùng
 */
const getUsersStatusController = async (req, res) => {
  try {
    const { userIds } = req.query // Lấy danh sách userIds từ query string

    // Kiểm tra tham số bắt buộc
    if (!userIds) {
      return res.status(400).json({
        success: false,
        message: "User IDs are required", // Danh sách ID người dùng là bắt buộc
      })
    }

    // Chuyển đổi chuỗi thành mảng số nguyên
    const userIdArray = userIds.split(",").map((id) => parseInt(id))

    // Lấy trạng thái của tất cả người dùng trong danh sách
    const statusMap = await userService.getUsersStatus(userIdArray)

    res.status(200).json({
      success: true,
      data: statusMap, // Object dạng { userId1: "online", userId2: "offline", ... }
    })
  } catch (error) {
    console.error("Error getting users status:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get users status",
    })
  }
}

/**
 * Tìm kiếm người dùng theo tên hoặc nickname
 * Chức năng:
 * - Tìm kiếm người dùng bằng tên đăng nhập hoặc nickname
 * - Loại trừ người dùng hiện tại khỏi kết quả
 * - Chỉ trả về người dùng đang hoạt động (user_state = 1)
 * - Lấy thêm trạng thái online/offline cho mỗi người dùng
 * - Giới hạn kết quả tối đa 20 người
 * @route GET /api/users?query=search_term
 * @param {Object} req - Request chứa query trong query string và user info
 * @param {Object} res - Response trả về danh sách người dùng tìm được
 */
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query // Từ khóa tìm kiếm
    const userId = req.user.id // ID người dùng hiện tại

    // Kiểm tra từ khóa tìm kiếm
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required", // Từ khóa tìm kiếm là bắt buộc
      })
    }

    // Lấy pool kết nối PostgreSQL
    const pool = getPool()

    // Thực hiện truy vấn tìm kiếm với ILIKE (không phân biệt hoa thường)
    const result = await pool.query(
      `SELECT
        user_id,           -- ID người dùng
        user_account,      -- Tên đăng nhập
        user_nickname,     -- Tên hiển thị
        user_avatar,       -- Ảnh đại diện
        user_state         -- Trạng thái tài khoản
      FROM pre_go_acc_user_info_9999
      WHERE
        (user_account ILIKE $1 OR user_nickname ILIKE $1) -- Tìm theo account hoặc nickname
        AND user_id != $2     -- Loại trừ chính mình
        AND user_state = 1    -- Chỉ lấy người dùng đang hoạt động
      LIMIT 20`, // Giới hạn 20 kết quả
      [`%${query}%`, userId] // Pattern matching và loại trừ user hiện tại
    )

    // Lấy danh sách ID người dùng tìm được
    const userIds = result.rows.map((user) => user.user_id)

    // Lấy trạng thái online/offline của tất cả người dùng
    const statusMap = await userService.getUsersStatus(userIds)

    // Định dạng kết quả trả về cho client
    const users = result.rows.map((user) => ({
      id: user.user_id, // ID người dùng
      account: user.user_account, // Tên đăng nhập
      nickname: user.user_nickname, // Tên hiển thị
      avatar: user.user_avatar, // Ảnh đại diện
      status: statusMap[user.user_id] || "offline", // Trạng thái (mặc định offline)
    }))

    res.status(200).json({
      success: true,
      data: users, // Danh sách người dùng đã được format
    })
  } catch (error) {
    console.error("Error searching users:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to search users",
    })
  }
}

// Export các hàm controller để sử dụng trong routes
module.exports = {
  getUserInfo: getUserInfoController, // Lấy thông tin người dùng
  getUserStatus: getUserStatusController, // Lấy trạng thái một người
  getUsersStatus: getUsersStatusController, // Lấy trạng thái nhiều người
  searchUsers, // Tìm kiếm người dùng
}
