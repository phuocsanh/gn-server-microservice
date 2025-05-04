const s3Service = require("../services/s3-storage.service")

/**
 * Upload a file
 * @route POST /api/files/upload
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    const fileData = await s3Service.uploadFile(req.file)

    res.status(201).json({
      success: true,
      data: fileData,
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
 * Upload multiple files
 * @route POST /api/files/upload-multiple
 */
const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      })
    }

    const filePromises = req.files.map((file) => s3Service.uploadFile(file))
    const filesData = await Promise.all(filePromises)

    res.status(201).json({
      success: true,
      data: filesData,
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
 * Delete a file
 * @route DELETE /api/files/:filePath
 */
const deleteFile = async (req, res) => {
  try {
    const { filePath } = req.params

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: "File path is required",
      })
    }

    const result = await s3Service.deleteFile(filePath)

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting file:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete file",
    })
  }
}

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
}
