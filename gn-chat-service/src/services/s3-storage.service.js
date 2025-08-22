// Service xử lý lưu trữ file trên AWS S3 với tính năng nén và tối ưu hóa
const AWS = require("aws-sdk") // AWS SDK để tương tác với S3
const fs = require("fs") // File system operations
const path = require("path") // Path utilities
const sharp = require("sharp") // Thư viện xử lý ảnh (resize, compress, metadata)
const { promisify } = require("util") // Convert callback functions thành promises
const ffmpeg = require("fluent-ffmpeg") // Thư viện xử lý video (compress, thumbnail, metadata)
const {
  compressImage, // Hàm nén hình ảnh
  isCompressibleImage, // Kiểm tra loại ảnh có thể nén được
} = require("../utils/image-compressor")
const {
  compressVideo, // Hàm nén video
  isCompressibleVideo, // Kiểm tra loại video có thể nén được
} = require("../utils/video-compressor")

/**
 * Cấu hình AWS S3 client
 * Sử dụng environment variables để bảo mật thông tin xác thực
 * Region mặc định: ap-southeast-1 (Singapore) cho độ trễ thấp tại Việt Nam
 */
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Access key từ IAM user
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Secret key từ IAM user
  region: process.env.AWS_REGION || "ap-southeast-1", // AWS region
})

// Khởi tạo S3 client và lấy tên bucket từ environment
const s3 = new AWS.S3()
const bucketName = process.env.AWS_S3_BUCKET_NAME

/**
 * Upload file lên AWS S3 với tính năng tự động nén và tối ưu hóa
 * Chức năng:
 * - Phân loại file theo MIME type (image, video, audio, document)
 * - Tự động nén hình ảnh và video để tiết kiệm băng thông
 * - Tạo thumbnail cho video
 * - Upload lên S3 với public read access
 * - Trích xuất metadata (kích thước, resolution, duration)
 * - Dọn dẹp file tạm sau khi upload
 * @param {Object} file - File object từ multer middleware
 * @param {string} file.path - Đường dẫn file tạm
 * @param {string} file.originalname - Tên gốc của file
 * @param {string} file.mimetype - MIME type của file
 * @param {number} file.size - Kích thước file (bytes)
 * @returns {Promise<Object>} - Thông tin chi tiết file đã upload lên S3
 */
const uploadFile = async (file) => {
  try {
    // Xác định loại file và thư mục lưu trữ dựa trên MIME type
    let fileType = "document" // Loại mặc định là tài liệu
    let folder = "documents" // Thư mục mặc định

    // Phân loại file theo MIME type để tổ chức lưu trữ
    if (file.mimetype.startsWith("image/")) {
      fileType = "image" // Hình ảnh
      folder = "images"
    } else if (file.mimetype.startsWith("video/")) {
      fileType = "video" // Video
      folder = "videos"
    } else if (file.mimetype.startsWith("audio/")) {
      fileType = "audio" // Âm thanh
      folder = "audio"
    }

    // Nén hình ảnh nếu có thể để tiết kiệm dung lượng và băng thông
    let filePath = file.path // Đường dẫn file hiện tại
    let shouldDeleteCompressed = false // Flag đánh dấu có cần xóa file nén không

    // Kiểm tra và nén hình ảnh nếu điều kiện cho phép
    if (
      isCompressibleImage(file.mimetype) && // Có thể nén
      process.env.ENABLE_IMAGE_COMPRESSION !== "false" // Tính năng được bật
    ) {
      try {
        // Cấu hình nén hình ảnh từ environment variables
        const compressionOptions = {
          maxDimension: parseInt(process.env.IMAGE_MAX_DIMENSION || "1920"), // Kích thước tối đa (px)
          jpeg: {
            quality: parseInt(process.env.JPEG_QUALITY || "80"), // Chất lượng JPEG (0-100)
          },
          png: {
            quality: parseInt(process.env.PNG_QUALITY || "80"), // Chất lượng PNG
          },
          webp: {
            quality: parseInt(process.env.WEBP_QUALITY || "80"), // Chất lượng WebP
          },
        }

        // Thực hiện nén hình ảnh
        const compressedPath = await compressImage(
          file.path,
          compressionOptions
        )

        // Nếu nén thành công, sử dụng file đã nén
        if (compressedPath !== file.path) {
          filePath = compressedPath
          shouldDeleteCompressed = true // Đánh dấu cần xóa file nén sau khi upload
        }
      } catch (error) {
        console.error("Lỗi khi nén hình ảnh:", error)
        // Tiếp tục với file gốc nếu có lỗi nén
      }
    }

    // Tạo tên file duy nhất để tránh trùng lặp và xung đột
    const fileExtension = path.extname(file.originalname) // Lấy phần mở rộng (.jpg, .mp4, etc.)
    const fileName = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}${fileExtension}` // Tạo tên: folder/timestamp-randomstring.ext

    // Cấu hình tham số upload lên AWS S3
    const params = {
      Bucket: bucketName, // Tên S3 bucket
      Key: fileName, // Tên file trên S3 (bao gồm đường dẫn)
      Body: fs.createReadStream(filePath), // Stream đọc file (sử dụng file đã nén nếu có)
      ContentType: file.mimetype, // MIME type của file
      ACL: "public-read", // Cấp quyền đọc công khai
    }

    // Thực hiện upload file lên S3 và chờ kết quả
    const uploadResult = await s3.upload(params).promise()

    // Tạo metadata dựa trên loại file để cung cấp thông tin bổ sung
    let metadata = {} // Object chứa các thông tin metadata

    if (fileType === "image") {
      // Xử lý metadata cho hình ảnh (kích thước, resolution)
      const imageInfo = await sharp(filePath).metadata() // Lấy thông tin ảnh qua Sharp
      metadata.width = imageInfo.width // Chiều rộng (pixels)
      metadata.height = imageInfo.height // Chiều cao (pixels)
    } else if (fileType === "video") {
      // Nén video nếu có thể để giảm kích thước và băng thông
      let videoPath = file.path // Đường dẫn video hiện tại
      let videoCompressed = false // Flag đánh dấu video đã nén

      // Kiểm tra và thực hiện nén video nếu điều kiện cho phép
      if (
        isCompressibleVideo(file.mimetype) && // Có thể nén
        process.env.ENABLE_VIDEO_COMPRESSION !== "false" // Tính năng được bật
      ) {
        try {
          // Cấu hình nén video từ environment variables
          const compressionOptions = {
            maxWidth: parseInt(process.env.VIDEO_MAX_WIDTH || "1280"), // Chiều rộng tối đa
            maxBitrate: process.env.VIDEO_MAX_BITRATE || "1500k", // Bitrate tối đa
            preset: process.env.VIDEO_PRESET || "medium", // Preset nén (fast/medium/slow)
            crf: parseInt(process.env.VIDEO_CRF || "23"), // Constant Rate Factor (chất lượng)
            maxSizeMB: parseInt(process.env.VIDEO_MAX_SIZE_MB || "50"), // Kích thước tối đa (MB)
          }

          // Thực hiện nén video
          const result = await compressVideo(file.path, compressionOptions)

          if (result.compressed) {
            // Nén thành công - sử dụng video đã nén
            videoPath = result.path
            videoCompressed = true
            metadata = {
              ...metadata,
              ...result.info, // Thông tin video đã nén
              originalSize: result.originalInfo.size, // Kích thước gốc
              compressionRatio: result.compressionRatio, // Tỉ lệ nén
            }
          } else {
            // Không nén được - sử dụng thông tin video gốc
            metadata = {
              ...metadata,
              ...result.info, // Thông tin video gốc
            }
          }
        } catch (error) {
          console.error("Lỗi khi nén video:", error)
          // Tiếp tục với video gốc nếu có lỗi nén
        }
      }

      // Tạo thumbnail cho video và upload lên S3
      const thumbnailPath = await generateVideoThumbnail(videoPath)
      if (thumbnailPath) {
        // Tạo key cho thumbnail trong S3 (thay đổi extension thành .jpg)
        const thumbnailKey = `thumbnails/${path.basename(
          fileName,
          fileExtension
        )}.jpg`

        // Cấu hình upload thumbnail lên S3
        const thumbnailParams = {
          Bucket: bucketName, // Cùng bucket với file gốc
          Key: thumbnailKey, // Đường dẫn thumbnail trên S3
          Body: fs.createReadStream(thumbnailPath), // Stream đọc thumbnail
          ContentType: "image/jpeg", // Luôn là JPEG cho thumbnail
          ACL: "public-read", // Cấp quyền đọc công khai
        }

        // Upload thumbnail và lưu URL vào metadata
        const thumbnailResult = await s3.upload(thumbnailParams).promise()
        metadata.thumbnailUrl = thumbnailResult.Location // URL của thumbnail

        // Dọn dẹp: xóa file thumbnail tạm khỏi hệ thống file local
        fs.unlinkSync(thumbnailPath)
      }

      // Lấy thông tin video nếu chưa có (duration, resolution, etc.)
      if (Object.keys(metadata).length <= 1) {
        metadata = {
          ...metadata,
          ...(await getVideoMetadata(videoPath)), // Lấy metadata qua FFmpeg
        }
      }

      // Lưu trạng thái nén để xử lý sau (cleanup)
      shouldDeleteCompressed = videoCompressed
      if (videoCompressed) {
        filePath = videoPath // Sử dụng đường dẫn video đã nén
      }
    } else if (fileType === "audio") {
      // Lấy thông tin âm thanh (duration, bitrate, etc.)
      metadata = {
        ...metadata,
        ...(await getAudioMetadata(file.path)), // Lấy metadata qua FFmpeg
      }
    }

    // Dọn dẹp: xóa file tạm gốc sau khi upload thành công
    fs.unlinkSync(file.path)

    // Dọn dẹp: xóa file nén nếu có (khác với file gốc)
    if (
      shouldDeleteCompressed && // Có file nén
      filePath !== file.path && // File nén khác file gốc
      fs.existsSync(filePath) // File nén vẫn tồn tại
    ) {
      fs.unlinkSync(filePath) // Xóa file nén
    }

    // Trả về object chứa đầy đủ thông tin file đã upload
    return {
      fileName: path.basename(fileName), // Tên file không bao gồm đường dẫn
      originalName: file.originalname, // Tên gốc do người dùng upload
      url: uploadResult.Location, // URL đầy đủ để truy cập file trên S3
      fileType, // Loại file (image, video, audio, document)
      mimeType: file.mimetype, // MIME type gốc
      size: file.size, // Kích thước file (bytes)
      ...metadata, // Metadata bổ sung (width, height, duration, etc.)
    }
  } catch (error) {
    console.error("Lỗi khi upload lên S3:", error)

    // Dọn dẹp khi có lỗi: xóa file tạm nếu vẫn tồn tại
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path)
    }

    // Dọn dẹp khi có lỗi: xóa file nén nếu có
    if (
      shouldDeleteCompressed && // Có file nén
      filePath !== file.path && // File nén khác file gốc
      fs.existsSync(filePath) // File nén vẫn tồn tại
    ) {
      fs.unlinkSync(filePath) // Xóa file nén
    }

    throw error // Throw lại lỗi để controller xử lý
  }
}

/**
 * Xóa file từ AWS S3 và các file liên quan (thumbnail)
 * Chức năng:
 * - Trích xuất S3 key từ URL
 * - Xóa file chính trên S3
 * - Tự động xóa thumbnail nếu là video
 * - Xử lý lỗi an toàn
 * @param {string} fileUrl - URL của file cần xóa (từ S3)
 * @returns {Promise<boolean>} - Kết quả xóa file (true nếu thành công)
 */
const deleteFile = async (fileUrl) => {
  try {
    // Trích xuất S3 key (path) từ URL của file
    const urlParts = new URL(fileUrl) // Parse URL
    const key = urlParts.pathname.substring(1) // Bỏ dấu / ở đầu path

    // Kiểm tra tính hợp lệ của key
    if (!key) {
      throw new Error("URL S3 không hợp lệ") // Invalid S3 URL
    }

    // Cấu hình tham số xóa file chính
    const params = {
      Bucket: bucketName, // Tên S3 bucket
      Key: key, // Đường dẫn file trên S3
    }

    // Xóa file chính trên S3
    await s3.deleteObject(params).promise()

    // Nếu là video, xóa cả thumbnail tương ứng
    if (key.startsWith("videos/")) {
      // Tạo key của thumbnail từ key của video
      const thumbnailKey = key
        .replace("videos/", "thumbnails/") // Thay đổi thư mục
        .replace(/\.[^.]+$/, ".jpg") // Thay đổi extension thành .jpg

      const thumbnailParams = {
        Bucket: bucketName,
        Key: thumbnailKey,
      }

      try {
        // Xóa thumbnail (không bắt buộc phải thành công)
        await s3.deleteObject(thumbnailParams).promise()
      } catch (error) {
        console.error("Lỗi khi xóa thumbnail:", error)
        // Bỏ qua lỗi khi xóa thumbnail - không ảnh hưởng đến kết quả chính
      }
    }

    return true // Xóa thành công
  } catch (error) {
    console.error("Lỗi khi xóa file trên S3:", error)
    throw error // Throw lại lỗi để controller xử lý
  }
}

/**
 * Tạo thumbnail cho video sử dụng FFmpeg
 * Chức năng:
 * - Chụp màn hình video tại vị trí 10% thời lượng
 * - Tạo thumbnail kích thước 320x240
 * - Lưu dưới định dạng JPEG
 * - Xử lý lỗi an toàn (trả về null nếu thất bại)
 * @param {string} videoPath - Đường dẫn đến file video
 * @returns {Promise<string|null>} - Đường dẫn đến thumbnail hoặc null nếu thất bại
 */
const generateVideoThumbnail = async (videoPath) => {
  try {
    // Tạo tên và đường dẫn cho file thumbnail
    const thumbnailPath = path.join(
      path.dirname(videoPath), // Thư mục chứa video
      `${path.basename(videoPath, path.extname(videoPath))}-thumbnail.jpg` // Tên: videoname-thumbnail.jpg
    )

    // Sử dụng FFmpeg để tạo thumbnail
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ["10%"], // Chụp tại 10% thời lượng video
          filename: path.basename(thumbnailPath), // Tên file thumbnail
          folder: path.dirname(thumbnailPath), // Thư mục lưu thumbnail
          size: "320x240", // Kích thước thumbnail (width x height)
        })
        .on("end", () => {
          resolve(thumbnailPath) // Trả về đường dẫn khi thành công
        })
        .on("error", (err) => {
          console.error("Lỗi khi tạo thumbnail:", err)
          resolve(null) // Trả về null thay vì reject để không dừng quá trình upload
        })
    })
  } catch (error) {
    console.error("Lỗi khi tạo thumbnail cho video:", error)
    return null // Trả về null nếu có lỗi
  }
}

/**
 * Lấy metadata của video sử dụng FFprobe
 * Chức năng:
 * - Trích xuất thông tin video stream (chiều rộng, chiều cao)
 * - Lấy thời lượng video
 * - Xử lý lỗi an toàn (trả về object rỗng nếu thất bại)
 * @param {string} videoPath - Đường dẫn đến file video
 * @returns {Promise<Object>} - Metadata của video (width, height, duration)
 */
const getVideoMetadata = async (videoPath) => {
  return new Promise((resolve, reject) => {
    // Sử dụng FFprobe để lấy thông tin chi tiết của video
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error("Lỗi khi lấy metadata video:", err)
        return resolve({}) // Trả về object rỗng thay vì reject
      }

      // Tìm video stream trong các stream của file
      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === "video" // Lọc lấy stream loại video
      )

      // Trả về các thông tin quan trọng
      resolve({
        width: videoStream ? videoStream.width : null, // Chiều rộng (pixels)
        height: videoStream ? videoStream.height : null, // Chiều cao (pixels)
        duration: metadata.format.duration || null, // Thời lượng (giây)
      })
    })
  })
}

/**
 * Lấy metadata của file âm thanh sử dụng FFprobe
 * Chức năng:
 * - Trích xuất thời lượng âm thanh
 * - Lấy các thông tin format khác nếu cần
 * - Xử lý lỗi an toàn (trả về object rỗng nếu thất bại)
 * @param {string} audioPath - Đường dẫn đến file âm thanh
 * @returns {Promise<Object>} - Metadata của âm thanh (duration)
 */
const getAudioMetadata = async (audioPath) => {
  return new Promise((resolve, reject) => {
    // Sử dụng FFprobe để lấy thông tin chi tiết của âm thanh
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        console.error("Lỗi khi lấy metadata âm thanh:", err)
        return resolve({}) // Trả về object rỗng thay vì reject
      }

      // Trả về thông tin cơ bản của file âm thanh
      resolve({
        duration: metadata.format.duration || null, // Thời lượng (giây)
      })
    })
  })
}

module.exports = {
  uploadFile,
  deleteFile,
}
