const jwt = require("jsonwebtoken")
const { getRedisClient, isRedisConnected } = require("../config/redis")
const Message = require("../models/message.model")
const Conversation = require("../models/conversation.model")
const { getUserInfo } = require("../services/user.service")
const s3Service = require("../services/s3-storage.service")

// Store active connections with last activity timestamp
const activeUsers = new Map()

// Cache for user info to reduce database queries
const userInfoCache = new Map()
const USER_CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

// Cleanup interval for user cache (every 15 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of userInfoCache.entries()) {
    if (now - value.timestamp > USER_CACHE_TTL) {
      userInfoCache.delete(key)
    }
  }
}, 15 * 60 * 1000)

/**
 * Socket.io connection handler
 * Manages user authentication, real-time messaging, and presence tracking
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} io - Socket.io server instance (optional)
 */
const socketHandler = async (socket, io) => {
  console.log("New client connected:", socket.id)

  // Authenticate user
  try {
    const token = socket.handshake.auth.token
    if (!token) {
      throw new Error("Authentication token is missing")
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET environment variable is not set")
      throw new Error("Server configuration error")
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.user_id

    if (!userId) {
      throw new Error("Invalid authentication token: missing user_id")
    }

    // Check cache first before querying database
    let user = null
    const cacheKey = `user:${userId}`
    const cachedUser = userInfoCache.get(cacheKey)

    if (cachedUser && Date.now() - cachedUser.timestamp < USER_CACHE_TTL) {
      user = cachedUser.data
    } else {
      // Get user info from PostgreSQL
      user = await getUserInfo(userId)
      if (!user) {
        throw new Error("User not found")
      }

      // Update cache
      userInfoCache.set(cacheKey, {
        data: user,
        timestamp: Date.now(),
      })
    }

    // Store user connection
    socket.userId = userId
    activeUsers.set(userId, socket.id)

    // Update user status in Redis
    try {
      if (isRedisConnected()) {
        const redisClient = getRedisClient()
        await Promise.all([
          redisClient.set(`user:${userId}:status`, "online"),
          redisClient.set(`user:${userId}:socketId`, socket.id),
          redisClient.set(`user:${userId}:lastActive`, Date.now().toString()),
        ])
      } else {
        console.warn(
          `Redis not connected, skipping status update for user ${userId}`
        )
      }
    } catch (redisError) {
      console.error("Redis error when updating user status:", redisError)
      // Continue execution - Redis errors shouldn't disconnect the user
    }

    // Join user to their conversation rooms
    const conversations = await Conversation.find({
      "participants.userId": userId,
      isActive: true,
    })

    conversations.forEach((conversation) => {
      socket.join(`conversation:${conversation.conversationId}`)
    })

    // Emit user online status to relevant users
    socket.broadcast.emit("user:status", { userId, status: "online" })

    console.log(`User ${userId} authenticated and connected`)

    // Handle join conversation
    socket.on("conversation:join", async (data) => {
      try {
        const { conversationId } = data

        // Check if user is part of the conversation
        const conversation = await Conversation.findOne({
          conversationId,
          "participants.userId": userId,
          isActive: true,
        })

        if (!conversation) {
          socket.emit("error", {
            message: "Conversation not found or you are not a participant",
          })
          return
        }

        socket.join(`conversation:${conversationId}`)
        socket.emit("conversation:joined", { conversationId })

        // Mark messages as read
        // This will be handled by a separate event
      } catch (error) {
        console.error("Error joining conversation:", error)
        socket.emit("error", { message: "Failed to join conversation" })
      }
    })

    // Handle new message
    socket.on("message:send", async (data) => {
      try {
        const { conversationId, content, attachments = [] } = data

        // Check if user is part of the conversation
        const conversation = await Conversation.findOne({
          conversationId,
          "participants.userId": userId,
          isActive: true,
        })

        if (!conversation) {
          socket.emit("error", {
            message: "Conversation not found or you are not a participant",
          })
          return
        }

        // Create new message
        const newMessage = new Message({
          conversationId: conversation._id,
          sender: userId,
          content,
          attachments,
          readBy: [{ userId, readAt: new Date() }],
        })

        await newMessage.save()

        // Update conversation with last message
        conversation.lastMessage = {
          content,
          sender: userId,
          timestamp: new Date(),
        }

        await conversation.save()

        // Broadcast message to all participants in the conversation
        socket.to(`conversation:${conversationId}`).emit("message:new", {
          messageId: newMessage._id,
          conversationId,
          sender: userId,
          senderInfo: {
            id: userId,
            name: user.user_nickname || user.user_account,
            avatar: user.user_avatar,
          },
          content,
          attachments,
          createdAt: newMessage.createdAt,
        })

        // Confirm message sent to sender
        socket.emit("message:sent", {
          messageId: newMessage._id,
          conversationId,
          content,
          attachments,
          createdAt: newMessage.createdAt,
        })
      } catch (error) {
        console.error("Error sending message:", error)
        socket.emit("error", { message: "Failed to send message" })
      }
    })

    // Handle message read
    socket.on("message:read", async (data) => {
      try {
        const { conversationId, messageId } = data

        // Update message read status
        await Message.updateOne(
          { _id: messageId, "readBy.userId": { $ne: userId } },
          { $push: { readBy: { userId, readAt: new Date() } } }
        )

        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit("message:read", {
          conversationId,
          messageId,
          userId,
        })
      } catch (error) {
        console.error("Error marking message as read:", error)
        socket.emit("error", { message: "Failed to mark message as read" })
      }
    })

    // Handle typing status
    socket.on("user:typing", (data) => {
      const { conversationId, isTyping } = data

      socket.to(`conversation:${conversationId}`).emit("user:typing", {
        conversationId,
        userId,
        isTyping,
      })
    })

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log(`User ${userId} disconnected`)

      try {
        // Update user status in Redis if connected
        if (isRedisConnected()) {
          const redisClient = getRedisClient()
          const now = new Date()

          await Promise.all([
            redisClient.set(`user:${userId}:status`, "offline"),
            redisClient.set(`user:${userId}:lastSeen`, now.toISOString()),
            redisClient.del(`user:${userId}:socketId`),
          ])
        } else {
          console.warn(
            `Redis not connected, skipping status update for disconnected user ${userId}`
          )
        }

        // Remove from active users
        activeUsers.delete(userId)

        // Notify other users
        socket.broadcast.emit("user:status", {
          userId,
          status: "offline",
          lastSeen: new Date().toISOString(),
        })

        // Clean up user cache after disconnect
        userInfoCache.delete(`user:${userId}`)
      } catch (error) {
        console.error(`Error handling disconnect for user ${userId}:`, error)
        // Even if there's an error, we should still clean up local state
        activeUsers.delete(userId)
        userInfoCache.delete(`user:${userId}`)
      }
    })
  } catch (error) {
    console.error("Socket authentication error:", error)

    // Send appropriate error message based on error type
    if (error.name === "JsonWebTokenError") {
      socket.emit("error", { message: "Invalid authentication token" })
    } else if (error.name === "TokenExpiredError") {
      socket.emit("error", { message: "Authentication token expired" })
    } else {
      socket.emit("error", {
        message: "Authentication failed: " + error.message,
      })
    }

    // Disconnect socket
    socket.disconnect(true)
  }
}

module.exports = socketHandler
