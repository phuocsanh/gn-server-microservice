// Model MongoDB cho tin nhắn trong hệ thống chat
const mongoose = require("mongoose") // ODM cho MongoDB

/**
 * Schema định nghĩa cấu trúc tin nhắn
 * Chứa thông tin:
 * - Nội dung tin nhắn
 * - Người gửi
 * - File đính kèm (hình ảnh, video, tài liệu)
 * - Trạng thái đã đọc
 * - Thông tin xóa tin nhắn
 */

const messageSchema = new mongoose.Schema(
  {
    // Liên kết đến cuộc trò chuyện chứa tin nhắn này
    conversationId: {
      type: mongoose.Schema.Types.ObjectId, // Reference đến Conversation model
      ref: "Conversation",
      required: true,
    },
    // ID người gửi (từ PostgreSQL)
    sender: {
      type: Number, // Sử dụng Number vì PostgreSQL user_id là integer
      required: true,
    },
    // Nội dung tin nhắn
    content: {
      type: String,
      required: true,
    },
    // Danh sách các file đính kèm
    attachments: [
      {
        fileName: String, // Tên file trên server
        originalName: String, // Tên file gốc do người dùng upload
        url: String, // Đường dẫn URL để truy cập file
        fileType: String, // Loại file: 'image', 'video', 'audio', 'document'
        mimeType: String, // MIME type của file (ví dụ: 'image/jpeg')
        size: Number, // Kích thước file tính bằng byte
        width: Number, // Chiều rộng (cho hình ảnh và video)
        height: Number, // Chiều cao (cho hình ảnh và video)
        duration: Number, // Thời lượng (cho video và audio, tính bằng giây)
        thumbnailUrl: String, // URL hình thu nhỏ (cho video)
      },
    ],
    // Danh sách người dùng đã đọc tin nhắn này
    readBy: [
      {
        userId: Number, // ID người dùng đã đọc
        readAt: Date, // Thời điểm đọc tin nhắn
      },
    ],
    // Cờ đánh dấu tin nhắn đã bị xóa (soft delete)
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // Tự động thêm createdAt và updatedAt
)

// Tạo các index để tối ưu hóa truy vấn
messageSchema.index({ conversationId: 1, createdAt: -1 }) // Truy vấn tin nhắn theo conversation, sắp xếp theo thời gian
messageSchema.index({ sender: 1 }) // Truy vấn tin nhắn theo người gửi

// Tạo model từ schema
const Message = mongoose.model("Message", messageSchema)

// Export model để sử dụng ở các module khác
module.exports = Message
