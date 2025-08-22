// Cấu hình kết nối Redis cho caching và session management
const redis = require("redis") // Thư viện Redis client

// Các biến quản lý trạng thái kết nối
let redisClient // Client Redis hiện tại
let isConnecting = false // Cờ đang kết nối
let connectionAttempts = 0 // Số lần thử kết nối
const MAX_RECONNECT_ATTEMPTS = 10 // Số lần kết nối lại tối đa
const RECONNECT_INTERVAL = 5000 // Khoảng thời gian giữa các lần kết nối lại (5 giây)

/**
 * Kết nối tới Redis với tính năng tự động kết nối lại
 * Sử dụng cho:
 * - Caching dữ liệu để tăng tốc độ truy vấn
 * - Lưu trữ session người dùng
 * - Quản lý trạng thái online/offline
 * - Queue cho các tác vụ bất đồng bộ
 * @returns {Promise<Object>} Redis client
 */
const connectRedis = async () => {
  // Kiểm tra nếu đang trong quá trình kết nối
  if (isConnecting) {
    console.log("Redis connection already in progress")
    return
  }

  isConnecting = true
  connectionAttempts++

  try {
    // Tạo Redis client với chiến lược retry thông minh
    redisClient = redis.createClient({
      url: `redis://${process.env.REDIS_HOST || "redis_gn_farm"}:${
        process.env.REDIS_PORT || 6379
      }`,
      password: process.env.REDIS_PASSWORD || "", // Mật khẩu Redis (nếu có)
      socket: {
        // Chiến lược kết nối lại với exponential backoff
        reconnectStrategy: (retries) => {
          if (retries > MAX_RECONNECT_ATTEMPTS) {
            console.error(
              `Redis max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`
            )
            return new Error("Redis max reconnection attempts reached")
          }
          // Tăng thời gian chờ theo cấp số nhân với ngẫu nhiên
          const delay = Math.min(Math.pow(2, retries) * 1000, 30000)
          return delay + Math.floor(Math.random() * 1000)
        },
      },
    })

    // Các event handlers cho Redis client
    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err) // Xử lý lỗi kết nối
    })

    redisClient.on("reconnecting", () => {
      console.log("Attempting to reconnect to Redis...") // Thông báo đang kết nối lại
    })

    redisClient.on("ready", () => {
      console.log("Redis client ready") // Thông báo client sẵn sàng
      connectionAttempts = 0 // Reset số lần thử kết nối
    })

    await redisClient.connect() // Thực hiện kết nối

    console.log("Redis connected successfully")
    isConnecting = false
    return redisClient
  } catch (error) {
    console.error("Redis connection error:", error)
    isConnecting = false

    // Thử kết nối lại nếu chưa vượt quá số lần tối đa
    if (connectionAttempts <= MAX_RECONNECT_ATTEMPTS) {
      console.log(
        `Retrying Redis connection in ${RECONNECT_INTERVAL / 1000} seconds...`
      )
      setTimeout(connectRedis, RECONNECT_INTERVAL)
    } else {
      console.error("Max Redis connection attempts reached. Exiting process.")
      process.exit(1) // Thoát ứng dụng nếu không thể kết nối
    }
  }
}

/**
 * Lấy Redis client với kiểm tra kết nối
 * @returns {Object} Redis client
 * @throws {Error} Nếu chưa khởi tạo kết nối
 */
const getRedisClient = () => {
  if (!redisClient) {
    throw new Error("Redis has not been initialized. Call connectRedis first.")
  }

  // Kiểm tra trạng thái kết nối và thử kết nối lại nếu cần
  if (!redisClient.isOpen) {
    console.warn("Redis client disconnected, attempting to reconnect...")
    connectRedis().catch((err) => {
      console.error("Failed to reconnect to Redis:", err)
    })
  }

  return redisClient
}

/**
 * Kiểm tra xem Redis đã kết nối hay chưa
 * @returns {boolean} Trạng thái kết nối
 */
const isRedisConnected = () => {
  return redisClient && redisClient.isOpen
}

/**
 * Đóng kết nối Redis một cách an toàn
 * Gọi khi ứng dụng kết thúc để giải phóng tài nguyên
 */
const closeRedisConnection = async () => {
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.quit() // Đóng kết nối một cách an toàn
      console.log("Redis connection closed gracefully")
    } catch (error) {
      console.error("Error closing Redis connection:", error)
    }
  }
}

// Export các hàm để sử dụng ở các module khác
module.exports = {
  connectRedis, // Kết nối Redis
  getRedisClient, // Lấy Redis client
  isRedisConnected, // Kiểm tra trạng thái kết nối
  closeRedisConnection, // Đóng kết nối
}
