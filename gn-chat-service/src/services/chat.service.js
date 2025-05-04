const { getPool } = require("../config/postgres")
const Message = require("../models/message.model")
const Conversation = require("../models/conversation.model")
const { getUsersInfo } = require("./user.service")

/**
 * Create a new conversation
 * @param {Object} data - Conversation data
 * @param {string} data.type - Conversation type ('direct' or 'group')
 * @param {string} data.name - Conversation name (for group chats)
 * @param {Array} data.participants - Array of participant user IDs
 * @param {number} creatorId - User ID of the conversation creator
 * @returns {Promise<Object>} - Created conversation
 */
const createConversation = async (data, creatorId) => {
  try {
    const { type, name, participants } = data

    // Ensure creator is included in participants
    if (!participants.includes(creatorId)) {
      participants.push(creatorId)
    }

    // For direct conversations, ensure there are at least 1 participant (plus creator)
    if (type === "direct" && participants.length < 1) {
      throw new Error("Direct conversations must have at least one participant")
    }

    // Check if direct conversation already exists
    if (type === "direct") {
      const existingConversation = await Conversation.findOne({
        type: "direct",
        "participants.userId": { $all: participants },
        isActive: true,
      })

      if (existingConversation) {
        return existingConversation
      }
    }

    // Generate a unique conversation ID
    const conversationId = `conv_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`

    // Format participants with roles
    const formattedParticipants = participants.map((userId) => ({
      userId,
      role: userId === creatorId ? "admin" : "member",
      joinedAt: new Date(),
    }))

    // Create new conversation
    const newConversation = new Conversation({
      conversationId,
      type,
      name: type === "group" ? name : null,
      participants: formattedParticipants,
      isActive: true,
    })

    await newConversation.save()

    // Get participant user info
    const usersInfo = await getUsersInfo(participants)

    return {
      ...newConversation.toObject(),
      participants: formattedParticipants.map((p) => {
        const userInfo = usersInfo.find((u) => u.user_id === p.userId) || {}
        return {
          ...p,
          userInfo: {
            id: userInfo.user_id,
            name: userInfo.user_nickname || userInfo.user_account,
            avatar: userInfo.user_avatar,
          },
        }
      }),
    }
  } catch (error) {
    console.error("Error creating conversation:", error)
    throw error
  }
}

/**
 * Get conversations for a user
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of conversations to return
 * @param {number} options.offset - Number of conversations to skip
 * @returns {Promise<Object[]>} - Array of conversations
 */
const getUserConversations = async (userId, options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options

    // Get conversations where user is a participant
    const conversations = await Conversation.find({
      "participants.userId": userId,
      isActive: true,
    })
      .sort({ updatedAt: -1 })
      .skip(offset)
      .limit(limit)

    if (!conversations.length) {
      return []
    }

    // Get all participant IDs from all conversations
    const participantIds = new Set()
    conversations.forEach((conv) => {
      conv.participants.forEach((p) => {
        participantIds.add(p.userId)
      })
    })

    // Get user info for all participants
    const usersInfo = await getUsersInfo([...participantIds])

    // Format conversations with user info
    return conversations.map((conv) => {
      const formattedParticipants = conv.participants.map((p) => {
        const userInfo = usersInfo.find((u) => u.user_id === p.userId) || {}
        return {
          ...p.toObject(),
          userInfo: {
            id: userInfo.user_id,
            name: userInfo.user_nickname || userInfo.user_account,
            avatar: userInfo.user_avatar,
          },
        }
      })

      return {
        ...conv.toObject(),
        participants: formattedParticipants,
      }
    })
  } catch (error) {
    console.error("Error getting user conversations:", error)
    throw error
  }
}

/**
 * Get messages for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} userId - User ID requesting the messages
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of messages to return
 * @param {number} options.before - Get messages before this timestamp
 * @returns {Promise<Object[]>} - Array of messages
 */
const getConversationMessages = async (
  conversationId,
  userId,
  options = {}
) => {
  try {
    const { limit = 50, before } = options

    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      conversationId,
      "participants.userId": userId,
      isActive: true,
    })

    if (!conversation) {
      throw new Error("Conversation not found or you are not a participant")
    }

    // Build query
    const query = {
      conversationId: conversation._id,
      isDeleted: false,
    }

    if (before) {
      query.createdAt = { $lt: new Date(before) }
    }

    // Get messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)

    // Get sender info for all messages
    const senderIds = [...new Set(messages.map((m) => m.sender))]
    const sendersInfo = await getUsersInfo(senderIds)

    // Format messages with sender info
    return messages
      .map((msg) => {
        const senderInfo =
          sendersInfo.find((u) => u.user_id === msg.sender) || {}

        return {
          ...msg.toObject(),
          senderInfo: {
            id: senderInfo.user_id,
            name: senderInfo.user_nickname || senderInfo.user_account,
            avatar: senderInfo.user_avatar,
          },
        }
      })
      .reverse() // Return in chronological order
  } catch (error) {
    console.error("Error getting conversation messages:", error)
    throw error
  }
}

/**
 * Add user to a group conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} userId - User ID to add
 * @param {number} adminId - User ID of the admin adding the user
 * @returns {Promise<Object>} - Updated conversation
 */
const addUserToConversation = async (conversationId, userId, adminId) => {
  try {
    // Check if conversation exists and is a group
    const conversation = await Conversation.findOne({
      conversationId,
      type: "group",
      isActive: true,
    })

    if (!conversation) {
      throw new Error("Conversation not found or is not a group conversation")
    }

    // Check if admin is an admin of the group
    const adminParticipant = conversation.participants.find(
      (p) => p.userId === adminId && p.role === "admin" && !p.leftAt
    )

    if (!adminParticipant) {
      throw new Error(
        "You do not have permission to add users to this conversation"
      )
    }

    // Check if user is already in the conversation
    const existingParticipant = conversation.participants.find(
      (p) => p.userId === userId
    )

    if (existingParticipant) {
      if (!existingParticipant.leftAt) {
        throw new Error("User is already a participant in this conversation")
      }

      // If user left, update their status
      existingParticipant.leftAt = null
      existingParticipant.joinedAt = new Date()
    } else {
      // Add user to conversation
      conversation.participants.push({
        userId,
        role: "member",
        joinedAt: new Date(),
      })
    }

    await conversation.save()

    // Get updated user info
    const usersInfo = await getUsersInfo(
      conversation.participants.map((p) => p.userId)
    )

    return {
      ...conversation.toObject(),
      participants: conversation.participants.map((p) => {
        const userInfo = usersInfo.find((u) => u.user_id === p.userId) || {}
        return {
          ...p.toObject(),
          userInfo: {
            id: userInfo.user_id,
            name: userInfo.user_nickname || userInfo.user_account,
            avatar: userInfo.user_avatar,
          },
        }
      }),
    }
  } catch (error) {
    console.error("Error adding user to conversation:", error)
    throw error
  }
}

/**
 * Remove user from a group conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} userId - User ID to remove
 * @param {number} adminId - User ID of the admin removing the user
 * @returns {Promise<Object>} - Updated conversation
 */
const removeUserFromConversation = async (conversationId, userId, adminId) => {
  try {
    // Check if conversation exists and is a group
    const conversation = await Conversation.findOne({
      conversationId,
      type: "group",
      isActive: true,
    })

    if (!conversation) {
      throw new Error("Conversation not found or is not a group conversation")
    }

    // Check if admin is an admin of the group or if user is removing themselves
    const isAdmin = conversation.participants.some(
      (p) => p.userId === adminId && p.role === "admin" && !p.leftAt
    )

    const isSelfRemoval = userId === adminId

    if (!isAdmin && !isSelfRemoval) {
      throw new Error(
        "You do not have permission to remove users from this conversation"
      )
    }

    // Find the participant to remove
    const participantIndex = conversation.participants.findIndex(
      (p) => p.userId === userId && !p.leftAt
    )

    if (participantIndex === -1) {
      throw new Error("User is not an active participant in this conversation")
    }

    // Update participant status
    conversation.participants[participantIndex].leftAt = new Date()

    await conversation.save()

    // Get updated user info
    const usersInfo = await getUsersInfo(
      conversation.participants.map((p) => p.userId)
    )

    return {
      ...conversation.toObject(),
      participants: conversation.participants.map((p) => {
        const userInfo = usersInfo.find((u) => u.user_id === p.userId) || {}
        return {
          ...p.toObject(),
          userInfo: {
            id: userInfo.user_id,
            name: userInfo.user_nickname || userInfo.user_account,
            avatar: userInfo.user_avatar,
          },
        }
      }),
    }
  } catch (error) {
    console.error("Error removing user from conversation:", error)
    throw error
  }
}

module.exports = {
  createConversation,
  getUserConversations,
  getConversationMessages,
  addUserToConversation,
  removeUserFromConversation,
}
