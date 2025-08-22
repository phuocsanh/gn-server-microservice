// Xử lý Socket.IO cho real-time communication
const jwt = require("jsonwebtoken") // Xác thực JWT token
const { getRedisClient, isRedisConnected } = require("../config/redis") // Redis cho trạng thái user
const Message = require("../models/message.model") // Model tin nhắn
const Conversation = require("../models/conversation.model") // Model cuộc trò chuyện
const { getUserInfo } = require("../services/user.service") // Lấy thông tin user
const s3Service = require("../services/s3-storage.service") // Xử lý file

// Lưu trữ các kết nối đang hoạt động với timestamp hoạt động cuối
const activeUsers = new Map() // Map<userId, socketId>

// Cache thông tin người dùng để giảm truy vấn database
const userInfoCache = new Map() // Map<cacheKey, {data, timestamp}>
const USER_CACHE_TTL = 5 * 60 * 1000 // Thời gian sống cache: 5 phút

// Dọn dẹp cache người dùng mỗi 15 phút
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of userInfoCache.entries()) {
    if (now - value.timestamp > USER_CACHE_TTL) {
      userInfoCache.delete(key) // Xóa cache hết hạn
    }
  }
}, 15 * 60 * 1000)

/**
 * Xử lý kết nối Socket.IO
 * Quản lý:
 * - Xác thực người dùng qua JWT token
 * - Nhắn tin real-time giữa các người dùng
 * - Theo dõi trạng thái online/offline
 * - Quản lý các phòng chat (conversation rooms)
 * - Xử lý các sự kiện: gửi tin, đọc tin, typing, v.v.
 * @param {Object} socket - Socket.IO socket instance cho mỗi client
 * @param {Object} io - Socket.IO server instance (không bắt buộc)
 */
const socketHandler = async (socket, io) => {
  console.log("New client connected:", socket.id) // Ghi log kết nối mới

  // Xác thực người dùng qua JWT token
  try {
    // Lấy token từ handshake authentication
    const token = socket.handshake.auth.token
    if (!token) {
      throw new Error("Authentication token is missing")
    }

    // Kiểm tra JWT secret
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET environment variable is not set")
      throw new Error("Server configuration error")
    }

    // Giải mã và xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.user_id

    if (!userId) {
      throw new Error("Invalid authentication token: missing user_id")
    }

    // Kiểm tra cache trước khi truy vấn database (tối ưu hiệu suất)
    let user = null
    const cacheKey = `user:${userId}`
    const cachedUser = userInfoCache.get(cacheKey)

    if (cachedUser && Date.now() - cachedUser.timestamp < USER_CACHE_TTL) {
      user = cachedUser.data // Sử dụng dữ liệu từ cache
    } else {
      // Lấy thông tin người dùng từ PostgreSQL
      user = await getUserInfo(userId)
      if (!user) {
        throw new Error("User not found")
      }

      // Cập nhật cache
      userInfoCache.set(cacheKey, {
        data: user,
        timestamp: Date.now(),
      })
    }

    // Lưu trữ thông tin kết nối người dùng
    socket.userId = userId
    activeUsers.set(userId, socket.id)

    // Cập nhật trạng thái người dùng trong Redis
    try {
      if (isRedisConnected()) {
        const redisClient = getRedisClient()
        await Promise.all([
          redisClient.set(`user:${userId}:status`, "online"), // Trạng thái online
          redisClient.set(`user:${userId}:socketId`, socket.id), // Socket ID hiện tại
          redisClient.set(`user:${userId}:lastActive`, Date.now().toString()), // Thời điểm hoạt động cuối
        ])
      } else {
        console.warn(
          `Redis not connected, skipping status update for user ${userId}`
        )
      }
    } catch (redisError) {
      console.error("Redis error when updating user status:", redisError)
      // Tiếp tục thực thi - lỗi Redis không nên ngắt kết nối người dùng
    }

    // Tham gia các phòng chat mà người dùng đang tham gia
    const conversations = await Conversation.find({
      "participants.userId": userId, // Tìm các cuộc trò chuyện có người dùng này
      isActive: true, // Chỉ lấy những cuộc trò chuyện đang hoạt động
    })

    // Tham gia tất cả các phòng chat tương ứng
    conversations.forEach((conversation) => {
      socket.join(`conversation:${conversation.conversationId}`)
    })

    // Thông báo cho các người dùng khác rằng người này đã online
    socket.broadcast.emit("user:status", { userId, status: "online" })

    console.log(`User ${userId} authenticated and connected`)

    // Xử lý sự kiện tham gia cuộc trò chuyện
    socket.on("conversation:join", async (data) => {
      try {
        const { conversationId } = data

        // Kiểm tra người dùng có quyền tham gia cuộc trò chuyện này không
        const conversation = await Conversation.findOne({
          conversationId,
          "participants.userId": userId, // Phải là thành viên
          isActive: true, // Cuộc trò chuyện phải hoạt động
        })

        if (!conversation) {
          socket.emit("error", {
            message: "Conversation not found or you are not a participant",
          })
          return
        }

        // Tham gia phòng chat
        socket.join(`conversation:${conversationId}`)
        socket.emit("conversation:joined", { conversationId })

        // Đánh dấu tin nhắn đã đọc sẽ được xử lý bằng sự kiện riêng biệt
      } catch (error) {
        console.error("Error joining conversation:", error)
        socket.emit("error", { message: "Failed to join conversation" })
      }
    })

    // Xử lý sự kiện gửi tin nhắn mới
    socket.on("message:send", async (data) => {
      try {
        const { conversationId, content, attachments = [] } = data

        // Kiểm tra người dùng có quyền gửi tin trong cuộc trò chuyện này
        const conversation = await Conversation.findOne({
          conversationId,
          "participants.userId": userId, // Phải là thành viên
          isActive: true, // Cuộc trò chuyện phải hoạt động
        })

        if (!conversation) {
          socket.emit("error", {
            message: "Conversation not found or you are not a participant",
          })
          return
        }

        // Tạo tin nhắn mới trong MongoDB
        const newMessage = new Message({
          conversationId: conversation._id, // Liên kết với cuộc trò chuyện
          sender: userId, // Người gửi
          content, // Nội dung tin nhắn
          attachments, // Các file đính kèm
          readBy: [{ userId, readAt: new Date() }], // Tự động đánh dấu đã đọc cho người gửi
        })

        await newMessage.save()

        // Cập nhật tin nhắn cuối cùng của cuộc trò chuyện
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
