// Routes kiểm tra sức khỏe hệ thống (health check endpoints)
const express = require("express") // Framework Express.js
const healthController = require("../controllers/health.controller") // Controller xử lý health check

const router = express.Router() // Tạo router cho module

// ===== HEALTH CHECK ENDPOINTS =====
// Các endpoint kiểm tra sức khỏe hệ thống (không cần xác thực)

// GET /health - Kiểm tra sức khỏe tổng thể (các dịch vụ kết nối, uptime, version)
router.get("/health", healthController.healthCheck.bind(healthController))

// GET /ready - Kiểm tra ứng dụng sẵn sàng phục vụ (readiness probe cho Kubernetes)
router.get("/ready", healthController.readinessCheck.bind(healthController))

// GET /live - Kiểm tra ứng dụng còn sống (liveness probe cho Kubernetes)
router.get("/live", healthController.livenessCheck.bind(healthController))

// Export router để sử dụng trong ứng dụng chính
module.exports = router
