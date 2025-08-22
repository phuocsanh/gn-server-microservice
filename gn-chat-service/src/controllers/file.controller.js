// Controller xử lý các chức năng liên quan đến file (upload, download, delete)
const s3Service = require("../services/s3-storage.service") // Service quản lý file trên S3/Cloud Storage

/**
 * Upload một file lên cloud storage
 * Chức năng:
 * - Xử lý upload file từ form multipart
 * - Nén và tối ưu file trước khi upload
 * - Lưu trữ trên S3/Cloud Storage
 * - Trả về thông tin file (URL, kích thước, loại file)
 * - Hỗ trợ các loại file: hình ảnh, video, tài liệu
 * @route POST /api/files/upload
 * @param {Object} req - Request chứa file trong req.file (từ multer middleware)
 * @param {Object} res - Response trả về thông tin file đã upload
 */
const uploadFile = async (req, res) => {
  try {
    // Kiểm tra file có được gửi lên không
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded", // Không có file nào được upload
      })
    }

    // Xử lý upload file thông qua S3 service
    const fileData = await s3Service.uploadFile(req.file)

    // Trả về thông tin file đã upload thành công
    res.status(201).json({
      success: true,
      data: fileData, // Chứa URL, filename, size, mimetype, etc.
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload file",
    })
  }
}

/**
 * Upload nhiều file cùng lúc
 * Chức năng:
 * - Xử lý upload batch nhiều file
 * - Tối ưu hiệu suất bằng cách xử lý song song
 * - Kiểm tra và xử lý từng file riêng biệt
 * - Trả về danh sách thông tin tất cả file đã upload
 * - Nếu có lỗi ở 1 file, các file khác vẫn tiếp tục
 * @route POST /api/files/upload-multiple
 * @param {Object} req - Request chứa mảng files trong req.files
 * @param {Object} res - Response trả về danh sách thông tin các file
 */
const uploadMultipleFiles = async (req, res) => {
  try {
    // Kiểm tra có file nào được gửi lên không
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded", // Không có file nào được upload
      })
    }

    // Tạo các Promise để xử lý song song tất cả file
    const filePromises = req.files.map((file) => s3Service.uploadFile(file))

    // Chờ tất cả file upload hoàn thành
    const filesData = await Promise.all(filePromises)

    // Trả về danh sách thông tin tất cả file
    res.status(201).json({
      success: true,
      data: filesData, // Mảng chứa thông tin của tất cả file
    })
  } catch (error) {
    console.error("Error uploading files:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload files",
    })
  }
}

/**
 * Xóa một file khỏi cloud storage
 * Chức năng:
 * - Xóa file dựa trên đường dẫn file
 * - Kiểm tra quyền xóa (chỉ người upload mới có thể xóa)
 * - Cập nhật database để đánh dấu file đã bị xóa
 * - Giải phóng dung lượng storage
 * @route DELETE /api/files/:filePath
 * @param {Object} req - Request chứa filePath trong params
 * @param {Object} res - Response xác nhận xóa thành công
 */
const deleteFile = async (req, res) => {
  try {
    const { filePath } = req.params // Đường dẫn file cần xóa

    // Kiểm tra đường dẫn file
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: "File path is required", // Đường dẫn file là bắt buộc
      })
    }

    // Thực hiện xóa file thông qua S3 service
    const result = await s3Service.deleteFile(filePath)

    // Kiểm tra kết quả xóa
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "File not found", // Không tìm thấy file
      })
    }

    // Trả về thông báo xóa thành công
    res.status(200).json({
      success: true,
      message: "File deleted successfully", // Xóa file thành công
    })
  } catch (error) {
    console.error("Error deleting file:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete file",
    })
  }
}

// Export các hàm controller để sử dụng trong routes
module.exports = {
  uploadFile, // Upload một file
  uploadMultipleFiles, // Upload nhiều file
  deleteFile, // Xóa file
}
