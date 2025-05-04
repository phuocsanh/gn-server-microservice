const userService = require("../services/user.service")
const { getPool } = require("../config/postgres")

/**
 * Get user information
 * @route GET /api/users/:userId
 */
const getUserInfoController = async (req, res) => {
  try {
    const { userId } = req.params

    const userInfo = await userService.getUserInfo(parseInt(userId))

    if (!userInfo) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Get user status
    const status = await userService.getUserStatus(parseInt(userId))

    res.status(200).json({
      success: true,
      data: {
        id: userInfo.user_id,
        account: userInfo.user_account,
        nickname: userInfo.user_nickname,
        avatar: userInfo.user_avatar,
        status,
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
 * Get user status
 * @route GET /api/users/status/:userId
 */
const getUserStatusController = async (req, res) => {
  try {
    const { userId } = req.params

    const status = await userService.getUserStatus(parseInt(userId))

    res.status(200).json({
      success: true,
      data: {
        userId: parseInt(userId),
        status,
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
 * Get multiple users status
 * @route GET /api/users/status?userIds=1,2,3
 */
const getUsersStatusController = async (req, res) => {
  try {
    const { userIds } = req.query

    if (!userIds) {
      return res.status(400).json({
        success: false,
        message: "User IDs are required",
      })
    }

    const userIdArray = userIds.split(",").map((id) => parseInt(id))

    const statusMap = await userService.getUsersStatus(userIdArray)

    res.status(200).json({
      success: true,
      data: statusMap,
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
 * Search users
 * @route GET /api/users?query=search_term
 */
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query
    const userId = req.user.id

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      })
    }

    const pool = getPool()
    const result = await pool.query(
      `SELECT
        user_id,
        user_account,
        user_nickname,
        user_avatar,
        user_state
      FROM pre_go_acc_user_info_9999
      WHERE
        (user_account ILIKE $1 OR user_nickname ILIKE $1)
        AND user_id != $2
        AND user_state = 1
      LIMIT 20`,
      [`%${query}%`, userId]
    )

    // Get status for found users
    const userIds = result.rows.map((user) => user.user_id)
    const statusMap = await userService.getUsersStatus(userIds)

    // Format response
    const users = result.rows.map((user) => ({
      id: user.user_id,
      account: user.user_account,
      nickname: user.user_nickname,
      avatar: user.user_avatar,
      status: statusMap[user.user_id] || "offline",
    }))

    res.status(200).json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error("Error searching users:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to search users",
    })
  }
}

module.exports = {
  getUserInfo: getUserInfoController,
  getUserStatus: getUserStatusController,
  getUsersStatus: getUsersStatusController,
  searchUsers,
}
