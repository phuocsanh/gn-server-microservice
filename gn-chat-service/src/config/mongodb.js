// Cấu hình kết nối MongoDB cho việc lưu trữ tin nhắn và conversation
const mongoose = require("mongoose") // ODM (Object Document Mapper) cho MongoDB

/**
 * Hàm kết nối tới cơ sở dữ liệu MongoDB
 * Sử dụng cho việc lưu trữ:
 * - Tin nhắn chat
 * - Thông tin các cuộc trò chuyện
 * - Metadata và lịch sử chat
 * @returns {Promise<void>} Promise kết nối
 */
const connectMongoDB = async () => {
  try {
    // Lấy URI kết nối từ biến môi trường hoặc sử dụng giá trị mặc định
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://mongo_gn_farm:27017/gn_chat"

    // Kết nối tới MongoDB với các tùy chọn tối ưu
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true, // Sử dụng parser URL mới
      useUnifiedTopology: true, // Sử dụng engine topology mới
    })

    console.log("MongoDB connected") // Thông báo kết nối thành công
  } catch (error) {
    console.error("MongoDB connection error:", error) // Ghi lại lỗi kết nối
    process.exit(1) // Thoát ứng dụng nếu không thể kết nối
  }
}

// Export hàm kết nối để sử dụng ở các module khác
module.exports = { connectMongoDB }
