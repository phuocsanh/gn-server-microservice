// Routes xử lý các chức năng liên quan đến người dùng
const express = require("express") // Framework Express.js
const router = express.Router() // Tạo router cho module
const userController = require("../controllers/user.controller") // Controller xử lý logic người dùng
const authMiddleware = require("../middlewares/auth.middleware") // Middleware xác thực JWT

// Áp dụng middleware xác thực cho tất cả routes (yêu cầu JWT token)
router.use(authMiddleware)

// ===== USER ROUTES =====
// Routes quản lý thông tin người dùng, trạng thái và tìm kiếm

// GET /api/users/status/:userId - Lấy trạng thái của một người dùng cụ thể
router.get("/status/:userId", userController.getUserStatus)

// GET /api/users/status?userIds=1,2,3 - Lấy trạng thái của nhiều người dùng
router.get("/status", userController.getUsersStatus)

// GET /api/users/:userId - Lấy thông tin chi tiết của người dùng
router.get("/:userId", userController.getUserInfo)

// GET /api/users?query=search_term - Tìm kiếm người dùng theo tên hoặc nickname
router.get("/", userController.searchUsers)

// Export router để sử dụng trong ứng dụng chính
module.exports = router
