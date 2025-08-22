// Middleware xử lý upload file sử dụng Multer
const multer = require("multer") // Thư viện xử lý multipart/form-data
const path = require("path") // Thư viện xử lý đường dẫn
const fs = require("fs") // Thư viện xử lý file system
const crypto = require("crypto") // Thư viện mã hóa cho tạo tên file ngẫu nhiên

// Tạo thư mục temp để lưu trữ file tạm thời nếu chưa tồn tại
const tempDir = path.join(__dirname, "../../temp")
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true })
}

// Cấu hình storage cho Multer (nơi lưu file và cách đặt tên)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir) // Lưu vào thư mục temp
  },
  filename: (req, file, cb) => {
    // Tạo tên file duy nhất để tránh trùng lập
    const uniqueSuffix = crypto.randomBytes(16).toString("hex")
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

// Hàm lọc file theo loại MIME type
const fileFilter = (req, file, cb) => {
  // Định nghĩa các loại file được phép
  const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ] // Hình ảnh
  const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"] // Video
  const allowedAudioTypes = ["audio/mpeg", "audio/wav", "audio/ogg"] // Âm thanh
  const allowedDocumentTypes = [
    // Tài liệu
    "application/pdf", // PDF
    "application/msword", // Word cũ
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // Word mới
    "application/vnd.ms-excel", // Excel cũ
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // Excel mới
    "application/vnd.ms-powerpoint", // PowerPoint cũ
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PowerPoint mới
    "text/plain", // File text
  ]

  // Gộp tất cả các loại file được phép
  const allowedTypes = [
    ...allowedImageTypes,
    ...allowedVideoTypes,
    ...allowedAudioTypes,
    ...allowedDocumentTypes,
  ]

  // Kiểm tra MIME type của file
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true) // Chấp nhận file
  } else {
    cb(
      new Error(
        "Invalid file type. Only images, videos, audio, and documents are allowed."
      ),
      false
    )
  }
}

// Tạo instance Multer với các cấu hình đã định nghĩa
const upload = multer({
  storage, // Sử dụng storage đã cấu hình
  fileFilter, // Sử dụng file filter đã định nghĩa
  limits: {
    fileSize: 100 * 1024 * 1024, // Giới hạn kích thước file tối đa 100MB
  },
})

/**
 * Middleware xử lý lỗi upload file
 * Xử lý các lỗi của Multer và trả về thông báo lỗi phù hợp
 * @param {Error} err - Lỗi xảy ra trong quá trình upload
 * @param {Object} req - HTTP request
 * @param {Object} res - HTTP response
 * @param {Function} next - Next middleware function
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Xử lý các lỗi của Multer
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 100MB.", // File quá lớn
      })
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`, // Lỗi upload khác
    })
  } else if (err) {
    // Xử lý các lỗi khác (ví dụ: loại file không hợp lệ)
    return res.status(400).json({
      success: false,
      message: err.message,
    })
  }
  next() // Tiếp tục nếu không có lỗi
}

// Export các hàm và middleware để sử dụng
module.exports = {
  upload, // Multer upload instance
  handleUploadError, // Middleware xử lý lỗi
}
