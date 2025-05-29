const redis = require("redis")

let redisClient
let isConnecting = false
let connectionAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10
const RECONNECT_INTERVAL = 5000 // 5 seconds

/**
 * Connect to Redis with automatic reconnection
 * @returns {Promise<Object>} Redis client
 */
const connectRedis = async () => {
  if (isConnecting) {
    console.log("Redis connection already in progress")
    return
  }

  isConnecting = true
  connectionAttempts++

  try {
    // Create Redis client with retry strategy
    redisClient = redis.createClient({
      url: `redis://${process.env.REDIS_HOST || "redis_gn_farm"}:${
        process.env.REDIS_PORT || 6379
      }`,
      password: process.env.REDIS_PASSWORD || "",
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > MAX_RECONNECT_ATTEMPTS) {
            console.error(
              `Redis max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`
            )
            return new Error("Redis max reconnection attempts reached")
          }
          // Exponential backoff with jitter
          const delay = Math.min(Math.pow(2, retries) * 1000, 30000)
          return delay + Math.floor(Math.random() * 1000)
        },
      },
    })

    // Event handlers
    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err)
    })

    redisClient.on("reconnecting", () => {
      console.log("Attempting to reconnect to Redis...")
    })

    redisClient.on("ready", () => {
      console.log("Redis client ready")
      connectionAttempts = 0
    })

    await redisClient.connect()

    console.log("Redis connected successfully")
    isConnecting = false
    return redisClient
  } catch (error) {
    console.error("Redis connection error:", error)
    isConnecting = false

    // Attempt to reconnect if not exceeding max attempts
    if (connectionAttempts <= MAX_RECONNECT_ATTEMPTS) {
      console.log(
        `Retrying Redis connection in ${RECONNECT_INTERVAL / 1000} seconds...`
      )
      setTimeout(connectRedis, RECONNECT_INTERVAL)
    } else {
      console.error("Max Redis connection attempts reached. Exiting process.")
      process.exit(1)
    }
  }
}

/**
 * Get Redis client with connection check
 * @returns {Object} Redis client
 */
const getRedisClient = () => {
  if (!redisClient) {
    throw new Error("Redis has not been initialized. Call connectRedis first.")
  }

  if (!redisClient.isOpen) {
    console.warn("Redis client disconnected, attempting to reconnect...")
    connectRedis().catch((err) => {
      console.error("Failed to reconnect to Redis:", err)
    })
  }

  return redisClient
}

/**
 * Check if Redis is connected
 * @returns {boolean} Connection status
 */
const isRedisConnected = () => {
  return redisClient && redisClient.isOpen
}

/**
 * Gracefully close Redis connection
 */
const closeRedisConnection = async () => {
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.quit()
      console.log("Redis connection closed gracefully")
    } catch (error) {
      console.error("Error closing Redis connection:", error)
    }
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisConnected,
  closeRedisConnection,
}
