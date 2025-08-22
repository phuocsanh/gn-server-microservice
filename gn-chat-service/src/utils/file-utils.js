// Utility functions xử lý file và lấy metadata
const fs = require("fs") // File system operations
const { promisify } = require("util") // Convert callback functions thành promises
const sharp = require("sharp") // Thư viện xử lý hình ảnh (metadata, resize, compress)
const ffmpeg = require("fluent-ffmpeg") // Thư viện xử lý video/audio (metadata, thumbnail, compress)

/**
 * Lấy metadata cho file dựa trên loại file
 * Chức năng:
 * - Phân tích và trích xuất thông tin chi tiết từ file
 * - Tạo thumbnail cho video
 * - Lấy kích thước (width/height) cho hình ảnh
 * - Lấy thời lượng cho video/audio
 * - Xử lý lỗi an toàn (không crash app)
 * @param {string} filePath - Đường dẫn đến file cần phân tích
 * @param {string} fileType - Loại file ('image', 'video', 'audio', 'document')
 * @returns {Promise<Object>} - Object chứa metadata (width, height, duration, thumbnailUrl, etc.)
 */
const getMetadata = async (filePath, fileType) => {
  try {
    const metadata = {} // Object chứa các thông tin metadata

    // Xử lý metadata khác nhau cho từng loại file
    switch (fileType) {
      case "image":
        // Lấy kích thước hình ảnh (width, height, format, etc.)
        const imageInfo = await sharp(filePath).metadata()
        metadata.width = imageInfo.width // Chiều rộng (pixels)
        metadata.height = imageInfo.height // Chiều cao (pixels)

        // Tạo thumbnail cho hình ảnh nếu cần (tùy chọn)
        // Có thể implement sau này nếu cần
        break

      case "video":
        // Tạo thumbnail cho video và lấy URL
        metadata.thumbnailUrl = await generateVideoThumbnail(filePath)

        // Lấy thông tin kích thước và thời lượng video
        const videoMetadata = await getVideoMetadata(filePath)
        metadata.width = videoMetadata.width // Chiều rộng video (pixels)
        metadata.height = videoMetadata.height // Chiều cao video (pixels)
        metadata.duration = videoMetadata.duration // Thời lượng (giây)
        break

      case "audio":
        // Lấy thời lượng âm thanh
        const audioMetadata = await getAudioMetadata(filePath)
        metadata.duration = audioMetadata.duration // Thời lượng (giây)
        break
    }

    return metadata // Trả về object chứa metadata
  } catch (error) {
    console.error("Lỗi khi lấy metadata file:", error)
    return {} // Trả về object rỗng nếu có lỗi
  }
}

/**
 * Tạo thumbnail cho video sử dụng FFmpeg
 * Chức năng:
 * - Chụp màn hình video tại vị trí 10% thời lượng
 * - Lưu thumbnail kích thước 320x240
 * - Tự động tạo thư mục thumbnails nếu chưa có
 * - Trả về URL relative để truy cập thumbnail
 * @param {string} videoPath - Đường dẫn đến file video
 * @returns {Promise<string|null>} - URL thumbnail hoặc null nếu thất bại
 */
const generateVideoThumbnail = async (videoPath) => {
  try {
    // Trích xuất tên file không bao gồm extension
    const pathParts = videoPath.split("/")
    const filename = pathParts[pathParts.length - 1].split(".")[0]

    // Tạo đường dẫn cho thumbnail (thay videos/ bằng thumbnails/)
    const thumbnailPath = videoPath.replace(
      /videos\/([^/]+)$/,
      `thumbnails/${filename}.jpg`
    )

    // Tạo thư mục thumbnails nếu chưa tồn tại
    const thumbnailDir = thumbnailPath.substring(
      0,
      thumbnailPath.lastIndexOf("/")
    )
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true }) // Tạo thư mục đệ quy
    }

    // Tạo thumbnail bằng FFmpeg
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ["10%"], // Chụp tại 10% thời lượng video
          filename: `${filename}.jpg`, // Tên file thumbnail
          folder: thumbnailDir, // Thư mục lưu thumbnail
          size: "320x240", // Kích thước thumbnail
        })
        .on("end", () => {
          resolve(`/uploads/thumbnails/${filename}.jpg`) // Trả về URL relative
        })
        .on("error", (err) => {
          console.error("Lỗi khi tạo thumbnail:", err)
          reject(err)
        })
    })
  } catch (error) {
    console.error("Lỗi khi tạo thumbnail cho video:", error)
    return null // Trả về null nếu thất bại
  }
}

/**
 * Lấy metadata chi tiết của file video
 * Chức năng:
 * - Sử dụng FFprobe để phân tích file video
 * - Trích xuất thông tin video stream (codec, resolution)
 * - Lấy thời lượng từ format info
 * - Xử lý lỗi an toàn
 * @param {string} videoPath - Đường dẫn đến file video
 * @returns {Promise<Object>} - Metadata video (width, height, duration)
 */
const getVideoMetadata = async (videoPath) => {
  return new Promise((resolve, reject) => {
    // Sử dụng FFprobe để lấy thông tin chi tiết video
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        return reject(err) // Reject nếu có lỗi
      }

      // Tìm video stream trong các stream của file
      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === "video"
      )

      // Trả về thông tin cần thiết
      resolve({
        width: videoStream ? videoStream.width : null, // Chiều rộng (pixels)
        height: videoStream ? videoStream.height : null, // Chiều cao (pixels)
        duration: metadata.format.duration || null, // Thời lượng (giây)
      })
    })
  })
}

/**
 * Lấy metadata của file âm thanh
 * Chức năng:
 * - Sử dụng FFprobe để phân tích file audio
 * - Trích xuất thời lượng từ format info
 * - Có thể mở rộng để lấy thêm bitrate, sample rate, etc.
 * @param {string} audioPath - Đường dẫn đến file âm thanh
 * @returns {Promise<Object>} - Metadata âm thanh (duration)
 */
const getAudioMetadata = async (audioPath) => {
  return new Promise((resolve, reject) => {
    // Sử dụng FFprobe để lấy thông tin chi tiết âm thanh
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        return reject(err) // Reject nếu có lỗi
      }

      // Trả về thông tin cần thiết (có thể mở rộng thêm)
      resolve({
        duration: metadata.format.duration || null, // Thời lượng (giây)
      })
    })
  })
}

// Export các function để sử dụng ở các module khác
module.exports = {
  getMetadata, // Lấy metadata tổng quát cho file
  generateVideoThumbnail, // Tạo thumbnail cho video
  getVideoMetadata, // Lấy metadata chi tiết video
  getAudioMetadata, // Lấy metadata chi tiết âm thanh
}
