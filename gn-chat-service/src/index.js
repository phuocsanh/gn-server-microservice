const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config()

// Import routes
const chatRoutes = require("./routes/chat.routes")
const userRoutes = require("./routes/user.routes")
const fileRoutes = require("./routes/file.routes")
const healthRoutes = require("./routes/health.routes")

// Create uploads directory for file storage
const path = require("path")
const fs = require("fs")
const uploadsDir = path.join(__dirname, "../uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Import socket handler
const socketHandler = require("./socket/socketHandler")

// Import database connections
const { connectMongoDB } = require("./config/mongodb")
const { connectPostgres } = require("./config/postgres")
const { connectRedis } = require("./config/redis")

// Initialize Express app
const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check routes (no /api prefix for standard health endpoints)
app.use("/", healthRoutes)

// API Routes
app.use("/api/chat", chatRoutes)
app.use("/api/users", userRoutes)
app.use("/api/files", fileRoutes)

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")))

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "gn-chat-service",
    version: "1.0.1",
    hotReload: "working",
  })
})

// Socket.io connection
io.on("connection", socketHandler)

// Connect to databases
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB()
    console.log("MongoDB connected successfully")

    // Connect to PostgreSQL
    await connectPostgres()
    console.log("PostgreSQL connected successfully")

    // Connect to Redis
    await connectRedis()
    console.log("Redis connected successfully")

    // Start the server
    const PORT = process.env.PORT || 3000
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server")
  server.close(() => {
    console.log("HTTP server closed")
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed")
      process.exit(0)
    })
  })
})
