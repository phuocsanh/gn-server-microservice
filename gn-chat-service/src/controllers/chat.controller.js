// Controller xử lý các chức năng liên quan đến chat và conversation
const chatService = require("../services/chat.service") // Service xử lý logic chat
const Message = require("../models/message.model") // Model tin nhắn
const Conversation = require("../models/conversation.model") // Model cuộc trò chuyện
const { upload } = require("../middlewares/upload.middleware") // Middleware upload file
const s3Service = require("../services/s3-storage.service") // Service quản lý file storage

/**
 * Tạo cuộc trò chuyện mới (direct hoặc group)
 * Chức năng:
 * - Tạo cuộc trò chuyện 1-1 (direct) hoặc nhóm (group)
 * - Kiểm tra và xác thực dữ liệu đầu vào
 * - Thêm các thành viên vào cuộc trò chuyện
 * @route POST /api/chat/conversations
 * @param {Object} req - Request chứa type, name, participants
 * @param {Object} res - Response trả về thông tin cuộc trò chuyện mới
 */
const createConversation = async (req, res) => {
  try {
    const { type, name, participants } = req.body
    const userId = req.user.id // ID người dùng từ JWT token

    // Kiểm tra và xác thực dữ liệu đầu vào
    if (!type || !["direct", "group"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation type", // Loại cuộc trò chuyện không hợp lệ
      })
    }

    // Cuộc trò chuyện nhóm phải có tên
    if (type === "group" && !name) {
      return res.status(400).json({
        success: false,
        message: "Group conversations require a name", // Cuộc trò chuyện nhóm yêu cầu tên
      })
    }

    // Kiểm tra danh sách thành viên
    if (
      !participants ||
      !Array.isArray(participants) ||
      participants.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Participants are required", // Danh sách thành viên là bắt buộc
      })
    }

    // Tạo cuộc trò chuyện thông qua service
    const conversation = await chatService.createConversation(
      { type, name, participants },
      userId
    )

    res.status(201).json({
      success: true,
      data: conversation,
    })
  } catch (error) {
    console.error("Error creating conversation:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create conversation",
    })
  }
}

/**
 * Lấy danh sách các cuộc trò chuyện của người dùng hiện tại
 * Chức năng:
 * - Lấy tất cả cuộc trò chuyện mà người dùng tham gia
 * - Hỗ trợ phân trang (limit, offset)
 * - Sắp xếp theo thời gian hoạt động gần nhất
 * @route GET /api/chat/conversations
 * @param {Object} req - Request chứa query parameters (limit, offset)
 * @param {Object} res - Response trả về danh sách cuộc trò chuyện
 */
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id // ID người dùng từ JWT token
    const { limit, offset } = req.query // Tham số phân trang

    // Gọi service để lấy danh sách cuộc trò chuyện
    const conversations = await chatService.getUserConversations(userId, {
      limit: limit ? parseInt(limit) : 20, // Mặc định 20 cuộc trò chuyện
      offset: offset ? parseInt(offset) : 0, // Bắt đầu từ vị trí 0
    })

    res.status(200).json({
      success: true,
      data: conversations,
    })
  } catch (error) {
    console.error("Error getting user conversations:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get conversations",
    })
  }
}

/**
 * Lấy thông tin chi tiết của một cuộc trò chuyện
 * Chức năng:
 * - Lấy thông tin cuộc trò chuyện (tên, loại, thành viên)
 * - Lấy thông tin chi tiết của các thành viên
 * - Lấy trạng thái online/offline của các thành viên
 * - Kiểm tra quyền truy cập của người dùng
 * @route GET /api/chat/conversations/:conversationId
 * @param {Object} req - Request chứa conversationId trong params
 * @param {Object} res - Response trả về thông tin chi tiết cuộc trò chuyện
 */
const getConversationDetails = async (req, res) => {
  try {
    const { conversationId } = req.params // ID cuộc trò chuyện từ URL
    const userId = req.user.id // ID người dùng hiện tại

    // Tìm cuộc trò chuyện và kiểm tra quyền truy cập
    const conversation = await Conversation.findOne({
      conversationId,
      "participants.userId": userId, // Kiểm tra người dùng có trong danh sách thành viên
      isActive: true, // Chỉ lấy cuộc trò chuyện đang hoạt động
    })

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you are not a participant",
      })
    }

    // Lấy danh sách ID của các thành viên
    const participantIds = conversation.participants.map((p) => p.userId)
    const { getUsersInfo, getUsersStatus } = require("../services/user.service")

    // Lấy thông tin và trạng thái của các thành viên song song
    const [usersInfo, usersStatus] = await Promise.all([
      getUsersInfo(participantIds), // Thông tin cơ bản (tên, avatar)
      getUsersStatus(participantIds), // Trạng thái online/offline
    ])

    // Định dạng lại dữ liệu thành viên với thông tin chi tiết
    const formattedParticipants = conversation.participants.map((p) => {
      const userInfo = usersInfo.find((u) => u.user_id === p.userId) || {}
      return {
        ...p.toObject(),
        userInfo: {
          id: userInfo.user_id,
          name: userInfo.user_nickname || userInfo.user_account, // Ưu tiên nickname, nếu không có thì dùng account
          avatar: userInfo.user_avatar,
        },
        status: usersStatus[p.userId] || "offline", // Mặc định offline nếu không có thông tin
      }
    })

    // Trả về kết quả với thông tin cuộc trò chuyện và thành viên đã được format
    res.status(200).json({
      success: true,
      data: {
        ...conversation.toObject(),
        participants: formattedParticipants, // Thành viên với thông tin chi tiết
      },
    })
  } catch (error) {
    console.error("Error getting conversation details:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get conversation details",
    })
  }
}

/**
 * Lấy danh sách tin nhắn của một cuộc trò chuyện
 * Chức năng:
 * - Lấy tin nhắn theo thời gian (mới nhất trước)
 * - Hỗ trợ phân trang với before (cursor-based pagination)
 * - Kiểm tra quyền truy cập của người dùng
 * - Lấy thông tin người gửi cho mỗi tin nhắn
 * @route GET /api/chat/conversations/:conversationId/messages
 * @param {Object} req - Request chứa conversationId và query params (limit, before)
 * @param {Object} res - Response trả về danh sách tin nhắn
 */
const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params // ID cuộc trò chuyện
    const userId = req.user.id // ID người dùng hiện tại
    const { limit, before } = req.query // Tham số phân trang

    // Gọi service để lấy tin nhắn với kiểm tra quyền
    const messages = await chatService.getConversationMessages(
      conversationId,
      userId,
      {
        limit: limit ? parseInt(limit) : 50, // Mặc định 50 tin nhắn
        before, // Timestamp để lấy tin nhắn cũ hơn
      }
    )

    res.status(200).json({
      success: true,
      data: messages,
    })
  } catch (error) {
    console.error("Error getting conversation messages:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get messages",
    })
  }
}

/**
 * Gửi tin nhắn vào cuộc trò chuyện
 * Chức năng:
 * - Gửi tin nhắn văn bản hoặc file đính kèm
 * - Kiểm tra quyền tham gia cuộc trò chuyện
 * - Tự động đánh dấu đã đọc cho người gửi
 * - Cập nhật tin nhắn cuối cùng của cuộc trò chuyện
 * - Lấy thông tin người gửi để trả về
 * @route POST /api/chat/conversations/:conversationId/messages
 * @param {Object} req - Request chứa conversationId, content, attachments
 * @param {Object} res - Response trả về thông tin tin nhắn đã gửi
 */
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params // ID cuộc trò chuyện
    const { content, attachments } = req.body // Nội dung và file đính kèm
    const userId = req.user.id // ID người gửi

    // Kiểm tra tin nhắn phải có nội dung hoặc file đính kèm
    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Message content or attachments are required",
      })
    }

    // Kiểm tra người dùng có phải là thành viên của cuộc trò chuyện
    const conversation = await Conversation.findOne({
      conversationId,
      "participants.userId": userId,
      isActive: true,
    })

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you are not a participant",
      })
    }

    // Create message
    const newMessage = new Message({
      conversationId: conversation._id,
      sender: userId,
      content: content || "",
      attachments: attachments || [],
      readBy: [{ userId, readAt: new Date() }],
    })

    await newMessage.save()

    // Update conversation with last message
    conversation.lastMessage = {
      content: content || "Attachment",
      sender: userId,
      timestamp: new Date(),
    }

    await conversation.save()

    // Get sender info
    const { getUserInfo } = require("../services/user.service")
    const userInfo = await getUserInfo(userId)

    // Format response
    const messageResponse = {
      ...newMessage.toObject(),
      senderInfo: {
        id: userInfo.user_id,
        name: userInfo.user_nickname || userInfo.user_account,
        avatar: userInfo.user_avatar,
      },
    }

    res.status(201).json({
      success: true,
      data: messageResponse,
    })
  } catch (error) {
    console.error("Error sending message:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send message",
    })
  }
}

/**
 * Delete a message
 * @route DELETE /api/chat/messages/:messageId
 */
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params
    const userId = req.user.id

    // Find message
    const message = await Message.findById(messageId)

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      })
    }

    // Check if user is the sender
    if (message.sender !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      })
    }

    // Delete attachments if any
    if (message.attachments && message.attachments.length > 0) {
      for (const attachment of message.attachments) {
        if (attachment.url) {
          try {
            await s3Service.deleteFile(attachment.url)
          } catch (error) {
            console.error("Error deleting attachment:", error)
            // Continue with message deletion even if attachment deletion fails
          }
        }
      }
    }

    // Soft delete message
    message.isDeleted = true
    message.content = "This message has been deleted"
    message.attachments = []

    await message.save()

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting message:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete message",
    })
  }
}

/**
 * Add user to a group conversation
 * @route POST /api/chat/conversations/:conversationId/users
 */
const addUserToConversation = async (req, res) => {
  try {
    const { conversationId } = req.params
    const { userId } = req.body
    const adminId = req.user.id

    // Validate input
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      })
    }

    const updatedConversation = await chatService.addUserToConversation(
      conversationId,
      userId,
      adminId
    )

    res.status(200).json({
      success: true,
      data: updatedConversation,
    })
  } catch (error) {
    console.error("Error adding user to conversation:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add user to conversation",
    })
  }
}

/**
 * Remove user from a group conversation
 * @route DELETE /api/chat/conversations/:conversationId/users/:userId
 */
const removeUserFromConversation = async (req, res) => {
  try {
    const { conversationId, userId } = req.params
    const adminId = req.user.id

    const updatedConversation = await chatService.removeUserFromConversation(
      conversationId,
      parseInt(userId),
      adminId
    )

    res.status(200).json({
      success: true,
      data: updatedConversation,
    })
  } catch (error) {
    console.error("Error removing user from conversation:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to remove user from conversation",
    })
  }
}

/**
 * Send a message with attachments to a conversation
 * @route POST /api/chat/conversations/:conversationId/messages/with-attachments
 */
const sendMessageWithAttachments = async (req, res) => {
  try {
    const { conversationId } = req.params
    const { content } = req.body
    const userId = req.user.id
    const files = req.files

    // Validate input
    if (!content && (!files || files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Message content or attachments are required",
      })
    }

    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      conversationId,
      "participants.userId": userId,
      isActive: true,
    })

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you are not a participant",
      })
    }

    // Process attachments
    let attachments = []
    if (files && files.length > 0) {
      const filePromises = files.map((file) => s3Service.uploadFile(file))
      attachments = await Promise.all(filePromises)
    }

    // Create message
    const newMessage = new Message({
      conversationId: conversation._id,
      sender: userId,
      content: content || "",
      attachments,
      readBy: [{ userId, readAt: new Date() }],
    })

    await newMessage.save()

    // Update conversation with last message
    const messagePreview =
      content ||
      (attachments.length > 0
        ? `${attachments.length} attachment${attachments.length > 1 ? "s" : ""}`
        : "Message")

    conversation.lastMessage = {
      content: messagePreview,
      sender: userId,
      timestamp: new Date(),
    }

    await conversation.save()

    // Get sender info
    const { getUserInfo } = require("../services/user.service")
    const userInfo = await getUserInfo(userId)

    // Format response
    const messageResponse = {
      ...newMessage.toObject(),
      senderInfo: {
        id: userInfo.user_id,
        name: userInfo.user_nickname || userInfo.user_account,
        avatar: userInfo.user_avatar,
      },
    }

    res.status(201).json({
      success: true,
      data: messageResponse,
    })
  } catch (error) {
    console.error("Error sending message with attachments:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send message with attachments",
    })
  }
}

module.exports = {
  createConversation,
  getUserConversations,
  getConversationDetails,
  getConversationMessages,
  sendMessage,
  sendMessageWithAttachments,
  deleteMessage,
  addUserToConversation,
  removeUserFromConversation,
}
