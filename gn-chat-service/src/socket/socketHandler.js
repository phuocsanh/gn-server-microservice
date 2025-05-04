const jwt = require("jsonwebtoken")
const { getRedisClient } = require("../config/redis")
const Message = require("../models/message.model")
const Conversation = require("../models/conversation.model")
const { getUserInfo } = require("../services/user.service")
const s3Service = require("../services/s3-storage.service")

// Store active connections
const activeUsers = new Map()

// Socket.io handler
const socketHandler = async (socket) => {
  console.log("New client connected:", socket.id)

  // Authenticate user
  try {
    const token = socket.handshake.auth.token
    if (!token) {
      throw new Error("Authentication token is missing")
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "xxx.yyy.zzz")
    const userId = decoded.user_id

    // Get user info from PostgreSQL
    const user = await getUserInfo(userId)
    if (!user) {
      throw new Error("User not found")
    }

    // Store user connection
    socket.userId = userId
    activeUsers.set(userId, socket.id)

    // Update user status in Redis
    const redisClient = getRedisClient()
    await redisClient.set(`user:${userId}:status`, "online")
    await redisClient.set(`user:${userId}:socketId`, socket.id)

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

      // Update user status in Redis
      const redisClient = getRedisClient()
      await redisClient.set(`user:${userId}:status`, "offline")
      await redisClient.set(`user:${userId}:lastSeen`, new Date().toISOString())
      await redisClient.del(`user:${userId}:socketId`)

      // Remove from active users
      activeUsers.delete(userId)

      // Notify other users
      socket.broadcast.emit("user:status", { userId, status: "offline" })
    })
  } catch (error) {
    console.error("Socket authentication error:", error)
    socket.emit("error", { message: "Authentication failed" })
    socket.disconnect(true)
  }
}

module.exports = socketHandler
