// Routes xử lý các chức năng chat và quản lý cuộc trò chuyện
const express = require("express") // Framework Express.js
const router = express.Router() // Tạo router cho module
const chatController = require("../controllers/chat.controller") // Controller xử lý logic chat
const authMiddleware = require("../middlewares/auth.middleware") // Middleware xác thực
const {
  upload, // Multer instance để upload file
  handleUploadError, // Error handler cho upload
} = require("../middlewares/upload.middleware")

// Áp dụng middleware xác thực cho tất cả routes (yêu cầu JWT token)
router.use(authMiddleware)

// ===== CONVERSATION ROUTES =====
// Routes quản lý cuộc trò chuyện (tạo, lấy thông tin, quản lý thành viên)

// POST /api/chat/conversations - Tạo cuộc trò chuyện mới (direct hoặc group)
router.post("/conversations", chatController.createConversation)

// GET /api/chat/conversations - Lấy danh sách cuộc trò chuyện của user hiện tại
router.get("/conversations", chatController.getUserConversations)

// GET /api/chat/conversations/:conversationId - Lấy thông tin chi tiết cuộc trò chuyện
router.get(
  "/conversations/:conversationId",
  chatController.getConversationDetails
)

// POST /api/chat/conversations/:conversationId/users - Thêm user vào cuộc trò chuyện group
router.post(
  "/conversations/:conversationId/users",
  chatController.addUserToConversation
)

// DELETE /api/chat/conversations/:conversationId/users/:userId - Xóa user khỏi cuộc trò chuyện group
router.delete(
  "/conversations/:conversationId/users/:userId",
  chatController.removeUserFromConversation
)

// ===== MESSAGE ROUTES =====
// Routes quản lý tin nhắn (gửi, nhận, xóa)

// GET /api/chat/conversations/:conversationId/messages - Lấy danh sách tin nhắn trong cuộc trò chuyện
router.get(
  "/conversations/:conversationId/messages",
  chatController.getConversationMessages
)

// POST /api/chat/conversations/:conversationId/messages - Gửi tin nhắn văn bản
router.post(
  "/conversations/:conversationId/messages",
  chatController.sendMessage
)

// POST /api/chat/conversations/:conversationId/messages/with-attachments - Gửi tin nhắn kèm file đính kèm
router.post(
  "/conversations/:conversationId/messages/with-attachments",
  upload.array("files", 10), // Upload tối đa 10 files cùng lúc
  handleUploadError, // Xử lý lỗi upload
  chatController.sendMessageWithAttachments
)

// DELETE /api/chat/messages/:messageId - Xóa tin nhắn (chỉ người gửi mới có thể xóa)
router.delete("/messages/:messageId", chatController.deleteMessage)

// Export router để sử dụng trong ứng dụng chính
module.exports = router
