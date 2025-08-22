// Model MongoDB cho cuộc trò chuyện trong hệ thống chat
const mongoose = require("mongoose") // ODM cho MongoDB

/**
 * Schema định nghĩa cấu trúc cuộc trò chuyện
 * Hỗ trợ hai loại cuộc trò chuyện:
 * - Direct: Trò chuyện 1-1 giữa 2 người
 * - Group: Trò chuyện nhóm nhiều người
 * Chứa thông tin về thành viên, quyền, tin nhắn cuối
 */

const conversationSchema = new mongoose.Schema(
  {
    // ID duy nhất của cuộc trò chuyện (dạng string)
    conversationId: {
      type: String,
      required: true,
      unique: true, // Đảm bảo không trùng lập
    },
    // Loại cuộc trò chuyện
    type: {
      type: String,
      enum: ["direct", "group"], // Chỉ cho phép 2 giá trị
      default: "direct",
    },
    // Tên cuộc trò chuyện (bắt buộc đối với nhóm)
    name: {
      type: String,
      default: null, // Direct conversation không cần tên
    },
    // Danh sách thành viên của cuộc trò chuyện
    participants: [
      {
        userId: {
          type: Number, // Sử dụng Number vì PostgreSQL user_id là integer
          required: true,
        },
        role: {
          type: String,
          enum: ["admin", "member"], // Quyền: quản trị viên hoặc thành viên
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now, // Thời điểm tham gia cuộc trò chuyện
        },
        leftAt: {
          type: Date,
          default: null, // Thời điểm rời khỏi cuộc trò chuyện (nếu có)
        },
      },
    ],
    // Thông tin tin nhắn cuối cùng (cho hiển thị trong danh sách cuộc trò chuyện)
    lastMessage: {
      content: String, // Nội dung tin nhắn cuối
      sender: Number, // Người gửi tin nhắn cuối
      timestamp: Date, // Thời điểm gửi
    },
    // Cờ đánh dấu cuộc trò chuyện còn hoạt động hay đã bị xóa
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
) // Tự động thêm createdAt và updatedAt

// Tạo các index để tối ưu hóa truy vấn
conversationSchema.index({ conversationId: 1 }, { unique: true }) // Index duy nhất cho conversationId
conversationSchema.index({ "participants.userId": 1 }) // Truy vấn cuộc trò chuyện theo người tham gia
conversationSchema.index({ updatedAt: -1 }) // Sắp xếp theo thời gian cập nhật

// Tạo model từ schema
const Conversation = mongoose.model("Conversation", conversationSchema)

// Export model để sử dụng ở các module khác
module.exports = Conversation
