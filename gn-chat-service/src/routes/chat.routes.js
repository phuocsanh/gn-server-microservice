const express = require("express")
const router = express.Router()
const chatController = require("../controllers/chat.controller")
const authMiddleware = require("../middlewares/auth.middleware")
const {
  upload,
  handleUploadError,
} = require("../middlewares/upload.middleware")

// Apply authentication middleware to all routes
router.use(authMiddleware)

// Conversation routes
router.post("/conversations", chatController.createConversation)
router.get("/conversations", chatController.getUserConversations)
router.get(
  "/conversations/:conversationId",
  chatController.getConversationDetails
)
router.post(
  "/conversations/:conversationId/users",
  chatController.addUserToConversation
)
router.delete(
  "/conversations/:conversationId/users/:userId",
  chatController.removeUserFromConversation
)

// Message routes
router.get(
  "/conversations/:conversationId/messages",
  chatController.getConversationMessages
)
router.post(
  "/conversations/:conversationId/messages",
  chatController.sendMessage
)
router.post(
  "/conversations/:conversationId/messages/with-attachments",
  upload.array("files", 10),
  handleUploadError,
  chatController.sendMessageWithAttachments
)
router.delete("/messages/:messageId", chatController.deleteMessage)

module.exports = router
