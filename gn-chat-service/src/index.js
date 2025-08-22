// Nhập các thư viện cần thiết cho ứng dụng chat service
const express = require("express") // Framework web Express.js
const http = require("http") // Module HTTP để tạo server
const socketIo = require("socket.io") // Thư viện Socket.IO cho real-time communication
const mongoose = require("mongoose") // ODM cho MongoDB
const cors = require("cors") // Middleware xử lý CORS
const helmet = require("helmet") // Middleware bảo mật
const dotenv = require("dotenv") // Thư viện đọc biến môi trường

// Tải các biến môi trường từ file .env
dotenv.config()

// Nhập các routes để xử lý các endpoint API
const chatRoutes = require("./routes/chat.routes") // Routes cho chức năng chat
const userRoutes = require("./routes/user.routes") // Routes cho quản lý người dùng
const fileRoutes = require("./routes/file.routes") // Routes cho upload/download file
const healthRoutes = require("./routes/health.routes") // Routes cho health check

// Tạo thư mục uploads để lưu trữ file
const path = require("path") // Module xử lý đường dẫn
const fs = require("fs") // Module xử lý file system
const uploadsDir = path.join(__dirname, "../uploads") // Đường dẫn thư mục uploads
// Kiểm tra và tạo thư mục uploads nếu chưa tồn tại
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Nhập socket handler để xử lý các sự kiện real-time
const socketHandler = require("./socket/socketHandler")

// Nhập các hàm kết nối cơ sở dữ liệu
const { connectMongoDB } = require("./config/mongodb") // Kết nối MongoDB cho lưu trữ tin nhắn
const { connectPostgres } = require("./config/postgres") // Kết nối PostgreSQL cho dữ liệu người dùng
const { connectRedis } = require("./config/redis") // Kết nối Redis cho caching và session

// Khởi tạo ứng dụng Express và Socket.IO server
const app = express() // Tạo ứng dụng Express
const server = http.createServer(app) // Tạo HTTP server từ Express app
const io = socketIo(server, {
  cors: {
    origin: "*", // Cho phép tất cả origins (nên cấu hình cụ thể trong production)
    methods: ["GET", "POST"], // Các HTTP methods được phép
  },
})

// Cấu hình các middleware cho Express app
app.use(helmet()) // Middleware bảo mật HTTP headers
app.use(cors()) // Middleware xử lý Cross-Origin Resource Sharing
app.use(express.json()) // Middleware parse JSON từ request body
app.use(express.urlencoded({ extended: true })) // Middleware parse URL-encoded data

// Cấu hình các routes cho ứng dụng
// Health check routes (không có prefix /api cho các endpoint kiểm tra sức khỏe chuẩn)
app.use("/", healthRoutes)

// API Routes với prefix /api
app.use("/api/chat", chatRoutes) // Routes cho chức năng chat
app.use("/api/users", userRoutes) // Routes cho quản lý người dùng
app.use("/api/files", fileRoutes) // Routes cho xử lý file

// Phục vụ các file tĩnh từ thư mục uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")))

// Endpoint kiểm tra sức khỏe dịch vụ
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok", // Trạng thái dịch vụ
    service: "gn-chat-service", // Tên dịch vụ
    version: "1.0.1", // Phiên bản hiện tại
    hotReload: "working", // Trạng thái hot reload
  })
})

// Xử lý kết nối Socket.IO cho real-time communication
io.on("connection", socketHandler)

// Hàm khởi động server và kết nối các cơ sở dữ liệu
const startServer = async () => {
  try {
    // Kết nối tới MongoDB để lưu trữ tin nhắn và conversation
    await connectMongoDB()
    console.log("MongoDB connected successfully")

    // Kết nối tới PostgreSQL để lưu trữ thông tin người dùng
    await connectPostgres()
    console.log("PostgreSQL connected successfully")

    // Kết nối tới Redis cho caching và session management
    await connectRedis()
    console.log("Redis connected successfully")

    // Khởi động server trên port được cấu hình hoặc mặc định 3000
    const PORT = process.env.PORT || 3000
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1) // Thoát ứng dụng nếu không thể khởi động
  }
}

// Khởi động server
startServer()

// Xử lý tắt ứng dụng một cách an toàn (graceful shutdown)
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server")
  server.close(() => {
    console.log("HTTP server closed")
    // Đóng kết nối MongoDB trước khi thoát
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed")
      process.exit(0) // Thoát ứng dụng với mã thành công
    })
  })
})
