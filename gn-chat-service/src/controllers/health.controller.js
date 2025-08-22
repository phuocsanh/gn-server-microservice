// Controller kiểm tra sức khỏe hệ thống và các dịch vụ liên kết
const mongoose = require("mongoose") // MongoDB ODM
const { Pool } = require("pg") // PostgreSQL pool
const redis = require("../config/redis") // Redis client

/**
 * Class quản lý các endpoint kiểm tra sức khỏe của ứng dụng
 * Cung cấp các endpoint:
 * - Health check: Kiểm tra tổng thể sức khỏe hệ thống
 * - Readiness check: Kiểm tra ứng dụng sẵn sàng phục vụ
 * - Liveness check: Kiểm tra ứng dụng còn hoạt động
 */

class HealthController {
  constructor() {
    this.startTime = Date.now() // Lưu thời điểm khởi động để tính uptime
  }

  /**
   * Kiểm tra sức khỏe tổng thể của hệ thống
   * Kiểm tra tất cả các dịch vụ: MongoDB, PostgreSQL, Redis
   * Trả về thông tin chi tiết về trạng thái của từng dịch vụ
   * @param {Object} req - HTTP request
   * @param {Object} res - HTTP response
   */
  async healthCheck(req, res) {
    try {
      // Khởi tạo thông tin sức khỏe cơ bản
      const healthStatus = {
        status: "healthy", // Trạng thái tổng thể
        timestamp: new Date().toISOString(), // Thời điểm kiểm tra
        version: process.env.npm_package_version || "1.0.0", // Phiên bản ứng dụng
        uptime: this.getUptime(), // Thời gian hoạt động
        services: {}, // Trạng thái các dịch vụ
      }

      // Kiểm tra tất cả các dịch vụ song song để tối ưu thời gian
      const [mongoStatus, postgresStatus, redisStatus] =
        await Promise.allSettled([
          this.checkMongoDB(), // Kiểm tra MongoDB
          this.checkPostgreSQL(), // Kiểm tra PostgreSQL
          this.checkRedis(), // Kiểm tra Redis
        ])

      // Xử lý kết quả kiểm tra của từng dịch vụ
      healthStatus.services.mongodb = this.getServiceResult(mongoStatus)
      healthStatus.services.postgresql = this.getServiceResult(postgresStatus)
      healthStatus.services.redis = this.getServiceResult(redisStatus)

      // Xác định trạng thái tổng thể dựa trên trạng thái của tất cả dịch vụ
      const allHealthy = Object.values(healthStatus.services).every(
        (service) => service.status === "healthy"
      )

      healthStatus.status = allHealthy ? "healthy" : "unhealthy"

      // Trả về HTTP status code phù hợp
      const statusCode = allHealthy ? 200 : 503
      res.status(statusCode).json(healthStatus)
    } catch (error) {
      // Xử lý lỗi không mong muốn
      res.status(500).json({
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message,
      })
    }
  }

  /**
   * Kiểm tra ứng dụng sẵn sàng phục vụ request
   * Chỉ trả về ready khi tất cả các dịch vụ cần thiết hoạt động bình thường
   */
  async readinessCheck(req, res) {
    try {
      const [mongoStatus, postgresStatus, redisStatus] =
        await Promise.allSettled([
          this.checkMongoDB(),
          this.checkPostgreSQL(),
          this.checkRedis(),
        ])

      const mongoHealthy =
        mongoStatus.status === "fulfilled" &&
        mongoStatus.value.status === "healthy"
      const postgresHealthy =
        postgresStatus.status === "fulfilled" &&
        postgresStatus.value.status === "healthy"
      const redisHealthy =
        redisStatus.status === "fulfilled" &&
        redisStatus.value.status === "healthy"

      if (mongoHealthy && postgresHealthy && redisHealthy) {
        res.status(200).json({
          status: "ready",
          timestamp: new Date().toISOString(),
        })
      } else {
        res.status(503).json({
          status: "not ready",
          timestamp: new Date().toISOString(),
          services: {
            mongodb: mongoHealthy,
            postgresql: postgresHealthy,
            redis: redisHealthy,
          },
        })
      }
    } catch (error) {
      res.status(503).json({
        status: "not ready",
        timestamp: new Date().toISOString(),
        error: error.message,
      })
    }
  }

  /**
   * Kiểm tra ứng dụng còn sống (liveness check)
   * Endpoint đơn giản để kiểm tra process còn hoạt động
   */
  async livenessCheck(req, res) {
    res.status(200).json({
      status: "alive",
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      pid: process.pid,
      memory: process.memoryUsage(),
      nodeVersion: process.version,
    })
  }

  /**
   * Kiểm tra kết nối MongoDB
   * Thực hiện ping để kiểm tra kết nối và đo response time
   */
  async checkMongoDB() {
    const start = Date.now()

    try {
      if (mongoose.connection.readyState !== 1) {
        throw new Error("MongoDB not connected")
      }

      // Perform a simple operation to test connection
      await mongoose.connection.db.admin().ping()

      const responseTime = Date.now() - start

      return {
        status: "healthy",
        responseTime: `${responseTime}ms`,
        details: {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
        },
      }
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: `${Date.now() - start}ms`,
        error: error.message,
      }
    }
  }

  /**
   * Kiểm tra kết nối PostgreSQL
   * Tạo kết nối mới và thực hiện query test
   */
  async checkPostgreSQL() {
    const start = Date.now()

    try {
      const pool = new Pool({
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
        max: 1, // Only one connection for health check
        idleTimeoutMillis: 1000,
        connectionTimeoutMillis: 2000,
      })

      const client = await pool.connect()
      const result = await client.query("SELECT NOW()")
      client.release()
      await pool.end()

      const responseTime = Date.now() - start

      return {
        status: "healthy",
        responseTime: `${responseTime}ms`,
        details: {
          serverTime: result.rows[0].now,
        },
      }
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: `${Date.now() - start}ms`,
        error: error.message,
      }
    }
  }

  /**
   * Kiểm tra kết nối Redis
   * Sử dụng Redis client đã có để thực hiện ping
   */
  async checkRedis() {
    const start = Date.now()

    try {
      // Lấy Redis client từ module redis
      const redisClient = redis.getRedisClient() // Sửa tên hàm từ getClient thành getRedisClient

      if (!redisClient || !redisClient.isOpen) {
        throw new Error("Redis client not connected")
      }

      await redisClient.ping()

      const responseTime = Date.now() - start

      return {
        status: "healthy",
        responseTime: `${responseTime}ms`,
        details: {
          connected: redisClient.isOpen,
          ready: redisClient.isReady,
        },
      }
    } catch (error) {
      return {
        status: "unhealthy",
        responseTime: `${Date.now() - start}ms`,
        error: error.message,
      }
    }
  }

  // Xử lý kết quả từ Promise.allSettled
  getServiceResult(settledResult) {
    if (settledResult.status === "fulfilled") {
      return settledResult.value
    } else {
      return {
        status: "unhealthy",
        error: settledResult.reason.message,
      }
    }
  }

  // Tính toán và định dạng uptime thành chuỗi dễ đọc
  getUptime() {
    const uptimeMs = Date.now() - this.startTime
    const uptimeSeconds = Math.floor(uptimeMs / 1000)
    const hours = Math.floor(uptimeSeconds / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    const seconds = uptimeSeconds % 60

    return `${hours}h ${minutes}m ${seconds}s`
  }
}

// Export instance duy nhất của HealthController (Singleton pattern)
module.exports = new HealthController()
