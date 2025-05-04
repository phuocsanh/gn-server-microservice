const chatService = require("../services/chat.service")
const Message = require("../models/message.model")
const Conversation = require("../models/conversation.model")
const { upload } = require("../middlewares/upload.middleware")
const s3Service = require("../services/s3-storage.service")

/**
 * Create a new conversation
 * @route POST /api/chat/conversations
 */
const createConversation = async (req, res) => {
  try {
    const { type, name, participants } = req.body
    const userId = req.user.id

    // Validate input
    if (!type || !["direct", "group"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation type",
      })
    }

    if (type === "group" && !name) {
      return res.status(400).json({
        success: false,
        message: "Group conversations require a name",
      })
    }

    if (
      !participants ||
      !Array.isArray(participants) ||
      participants.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Participants are required",
      })
    }

    // Create conversation
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
 * Get conversations for the current user
 * @route GET /api/chat/conversations
 */
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id
    const { limit, offset } = req.query

    const conversations = await chatService.getUserConversations(userId, {
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
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
 * Get conversation details
 * @route GET /api/chat/conversations/:conversationId
 */
const getConversationDetails = async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.id

    // Find conversation
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

    // Get participant details
    const participantIds = conversation.participants.map((p) => p.userId)
    const { getUsersInfo, getUsersStatus } = require("../services/user.service")

    const [usersInfo, usersStatus] = await Promise.all([
      getUsersInfo(participantIds),
      getUsersStatus(participantIds),
    ])

    // Format response
    const formattedParticipants = conversation.participants.map((p) => {
      const userInfo = usersInfo.find((u) => u.user_id === p.userId) || {}
      return {
        ...p.toObject(),
        userInfo: {
          id: userInfo.user_id,
          name: userInfo.user_nickname || userInfo.user_account,
          avatar: userInfo.user_avatar,
        },
        status: usersStatus[p.userId] || "offline",
      }
    })

    res.status(200).json({
      success: true,
      data: {
        ...conversation.toObject(),
        participants: formattedParticipants,
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
 * Get messages for a conversation
 * @route GET /api/chat/conversations/:conversationId/messages
 */
const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params
    const userId = req.user.id
    const { limit, before } = req.query

    const messages = await chatService.getConversationMessages(
      conversationId,
      userId,
      {
        limit: limit ? parseInt(limit) : 50,
        before,
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
 * Send a message to a conversation
 * @route POST /api/chat/conversations/:conversationId/messages
 */
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params
    const { content, attachments } = req.body
    const userId = req.user.id

    // Validate input
    if (!content && (!attachments || attachments.length === 0)) {
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
