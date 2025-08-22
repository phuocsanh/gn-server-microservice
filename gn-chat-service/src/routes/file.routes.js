// Routes xử lý các chức năng upload và quản lý file
const express = require("express") // Framework Express.js
const router = express.Router() // Tạo router cho module
const fileController = require("../controllers/file.controller") // Controller xử lý logic file
const authMiddleware = require("../middlewares/auth.middleware") // Middleware xác thực JWT
const {
  upload,
  handleUploadError,
} = require("../middlewares/upload.middleware") // Middleware upload

// Áp dụng middleware xác thực cho tất cả routes (yêu cầu JWT token)
router.use(authMiddleware)

// ===== FILE UPLOAD ROUTES =====
// Routes xử lý upload, download và xóa file

// POST /api/files/upload - Upload một file (hình ảnh, video, tài liệu)
router.post(
  "/upload",
  upload.single("file"), // Upload 1 file với field name là 'file'
  handleUploadError, // Xử lý lỗi upload
  fileController.uploadFile
)

// POST /api/files/upload-multiple - Upload nhiều file cùng lúc (tối đa 10 file)
router.post(
  "/upload-multiple",
  upload.array("files", 10), // Upload array files, giới hạn 10 file
  handleUploadError, // Xử lý lỗi upload
  fileController.uploadMultipleFiles
)

// DELETE /api/files/:filePath - Xóa file theo đường dẫn
// Sử dụng (*) để cho phép filePath chứa dấu / (nhiều level directory)
router.delete("/:filePath(*)", fileController.deleteFile)

// Export router để sử dụng trong ứng dụng chính
module.exports = router
