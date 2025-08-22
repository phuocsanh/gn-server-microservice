// Service xử lý các chức năng lưu trữ và quản lý file local
const fs = require("fs") // File system operations
const path = require("path") // Path utilities
const crypto = require("crypto") // Cryptographic functions
const { promisify } = require("util") // Convert callback to promise
const { getMetadata } = require("../utils/file-utils") // Utility để lấy metadata file

// Tạo thư mục uploads chính nếu chưa tồn tại
const uploadsDir = path.join(__dirname, "../../uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Tạo các thư mục con cho từng loại file (tổ chức file có hệ thống)
const imageDir = path.join(uploadsDir, "images") // Thư mục hình ảnh
const videoDir = path.join(uploadsDir, "videos") // Thư mục video
const audioDir = path.join(uploadsDir, "audio") // Thư mục âm thanh
const documentDir = path.join(uploadsDir, "documents") // Thư mục tài liệu

// Tạo tất cả các thư mục con nếu chưa có
;[imageDir, videoDir, audioDir, documentDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

/**
 * Lưu file vào thư mục phù hợp dựa trên loại file
 * Chức năng:
 * - Tạo tên file duy nhất để tránh trùng lập
 * - Phân loại file theo MIME type
 * - Lưu vào thư mục tương ứng
 * - Lấy metadata (kích thước, resolution, duration)
 * - Trả về thông tin đầy đủ của file
 * @param {Object} file - File object từ multer middleware
 * @returns {Promise<Object>} - Metadata của file đã lưu
 */
const saveFile = async (file) => {
  try {
    // Tạo tên file duy nhất với extension gốc
    const fileExtension = path.extname(file.originalname)
    const fileName = `${crypto.randomBytes(16).toString("hex")}${fileExtension}`

    // Xác định loại file và thư mục đích dựa trên MIME type
    let fileType = "document" // Mặc định là document
    let destDir = documentDir

    if (file.mimetype.startsWith("image/")) {
      fileType = "image"
      destDir = imageDir
    } else if (file.mimetype.startsWith("video/")) {
      fileType = "video"
      destDir = videoDir
    } else if (file.mimetype.startsWith("audio/")) {
      fileType = "audio"
      destDir = audioDir
    }

    // Tạo đường dẫn đích cuối cùng
    const destPath = path.join(destDir, fileName)

    // Di chuyển file từ temp location đến vị trí cuối cùng
    const rename = promisify(fs.rename) // Convert callback thành promise
    await rename(file.path, destPath)

    // Lấy metadata bổ sung dựa trên loại file (width, height, duration, etc.)
    const metadata = await getMetadata(destPath, fileType)

    // Tạo object chứa đầy đủ thông tin file để trả về
    const fileObject = {
      fileName, // Tên file đã được mã hóa
      originalName: file.originalname, // Tên gốc do người dùng upload
      url: `/uploads/${fileType}s/${fileName}`, // URL để truy cập file
      fileType, // Loại file (image, video, audio, document)
      mimeType: file.mimetype, // MIME type gốc
      size: file.size, // Kích thước file (bytes)
      ...metadata, // Metadata bổ sung (width, height, duration, etc.)
    }

    return fileObject
  } catch (error) {
    console.error("Error saving file:", error)
    throw error // Throw lại lỗi để controller xử lý
  }
}

/**
 * Xóa file khỏi hệ thống tập tin
 * Bao gồm các biện pháp bảo mật:
 * - Kiểm tra đường dẫn nằm trong thư mục cho phép
 * - Kiểm tra file tồn tại trước khi xóa
 * - Xử lý lỗi an toàn
 * @param {string} filePath - Đường dẫn tương đối của file (ví dụ: /uploads/images/abc.jpg)
 * @returns {Promise<boolean>} - True nếu xóa thành công, False nếu không tìm thấy file
 */
const deleteFile = async (filePath) => {
  try {
    // Đảm bảo đường dẫn nằm trong thư mục uploads để bảo mật
    const fullPath = path.join(__dirname, "../../", filePath)
    if (!fullPath.startsWith(uploadsDir)) {
      throw new Error("Invalid file path") // Ngăn chặn path traversal attack
    }

    // Kiểm tra file có tồn tại không trước khi xóa
    if (fs.existsSync(fullPath)) {
      await promisify(fs.unlink)(fullPath) // Xóa file
      return true // Xóa thành công
    }

    return false // File không tồn tại
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error // Throw lại lỗi để controller xử lý
  }
}

// Export các hàm service để sử dụng trong controller và các module khác
module.exports = {
  saveFile, // Lưu file vào hệ thống
  deleteFile, // Xóa file khỏi hệ thống
}
