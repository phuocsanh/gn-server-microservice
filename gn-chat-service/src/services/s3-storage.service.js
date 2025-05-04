const AWS = require("aws-sdk")
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")
const { promisify } = require("util")
const ffmpeg = require("fluent-ffmpeg")
const {
  compressImage,
  isCompressibleImage,
} = require("../utils/image-compressor")
const {
  compressVideo,
  isCompressibleVideo,
} = require("../utils/video-compressor")

// Cấu hình AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "ap-southeast-1",
})

const s3 = new AWS.S3()
const bucketName = process.env.AWS_S3_BUCKET_NAME

/**
 * Upload file lên S3
 * @param {Object} file - File object từ multer
 * @returns {Promise<Object>} - Thông tin file đã upload
 */
const uploadFile = async (file) => {
  try {
    // Xác định loại file và thư mục
    let fileType = "document"
    let folder = "documents"

    if (file.mimetype.startsWith("image/")) {
      fileType = "image"
      folder = "images"
    } else if (file.mimetype.startsWith("video/")) {
      fileType = "video"
      folder = "videos"
    } else if (file.mimetype.startsWith("audio/")) {
      fileType = "audio"
      folder = "audio"
    }

    // Nén hình ảnh nếu có thể
    let filePath = file.path
    let shouldDeleteCompressed = false

    if (
      isCompressibleImage(file.mimetype) &&
      process.env.ENABLE_IMAGE_COMPRESSION !== "false"
    ) {
      try {
        const compressionOptions = {
          maxDimension: parseInt(process.env.IMAGE_MAX_DIMENSION || "1920"),
          jpeg: {
            quality: parseInt(process.env.JPEG_QUALITY || "80"),
          },
          png: {
            quality: parseInt(process.env.PNG_QUALITY || "80"),
          },
          webp: {
            quality: parseInt(process.env.WEBP_QUALITY || "80"),
          },
        }

        const compressedPath = await compressImage(
          file.path,
          compressionOptions
        )

        if (compressedPath !== file.path) {
          filePath = compressedPath
          shouldDeleteCompressed = true
        }
      } catch (error) {
        console.error("Error compressing image:", error)
        // Tiếp tục với file gốc nếu có lỗi
      }
    }

    // Tạo tên file duy nhất
    const fileExtension = path.extname(file.originalname)
    const fileName = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}${fileExtension}`

    // Upload file lên S3
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: fs.createReadStream(filePath), // Sử dụng file đã nén nếu có
      ContentType: file.mimetype,
      ACL: "public-read",
    }

    const uploadResult = await s3.upload(params).promise()

    // Tạo metadata dựa trên loại file
    let metadata = {}

    if (fileType === "image") {
      // Xử lý metadata cho hình ảnh
      const imageInfo = await sharp(filePath).metadata()
      metadata.width = imageInfo.width
      metadata.height = imageInfo.height
    } else if (fileType === "video") {
      // Nén video nếu có thể
      let videoPath = file.path
      let videoCompressed = false

      if (
        isCompressibleVideo(file.mimetype) &&
        process.env.ENABLE_VIDEO_COMPRESSION !== "false"
      ) {
        try {
          const compressionOptions = {
            maxWidth: parseInt(process.env.VIDEO_MAX_WIDTH || "1280"),
            maxBitrate: process.env.VIDEO_MAX_BITRATE || "1500k",
            preset: process.env.VIDEO_PRESET || "medium",
            crf: parseInt(process.env.VIDEO_CRF || "23"),
            maxSizeMB: parseInt(process.env.VIDEO_MAX_SIZE_MB || "50"),
          }

          const result = await compressVideo(file.path, compressionOptions)

          if (result.compressed) {
            videoPath = result.path
            videoCompressed = true
            metadata = {
              ...metadata,
              ...result.info,
              originalSize: result.originalInfo.size,
              compressionRatio: result.compressionRatio,
            }
          } else {
            // Sử dụng thông tin video gốc
            metadata = {
              ...metadata,
              ...result.info,
            }
          }
        } catch (error) {
          console.error("Error compressing video:", error)
          // Tiếp tục với video gốc nếu có lỗi
        }
      }

      // Tạo thumbnail cho video và upload
      const thumbnailPath = await generateVideoThumbnail(videoPath)
      if (thumbnailPath) {
        const thumbnailKey = `thumbnails/${path.basename(
          fileName,
          fileExtension
        )}.jpg`
        const thumbnailParams = {
          Bucket: bucketName,
          Key: thumbnailKey,
          Body: fs.createReadStream(thumbnailPath),
          ContentType: "image/jpeg",
          ACL: "public-read",
        }

        const thumbnailResult = await s3.upload(thumbnailParams).promise()
        metadata.thumbnailUrl = thumbnailResult.Location

        // Xóa file thumbnail tạm
        fs.unlinkSync(thumbnailPath)
      }

      // Lấy thông tin video nếu chưa có
      if (Object.keys(metadata).length <= 1) {
        metadata = {
          ...metadata,
          ...(await getVideoMetadata(videoPath)),
        }
      }

      // Lưu trạng thái nén để xử lý sau
      shouldDeleteCompressed = videoCompressed
      if (videoCompressed) {
        filePath = videoPath
      }
    } else if (fileType === "audio") {
      // Lấy thông tin audio
      metadata = {
        ...metadata,
        ...(await getAudioMetadata(file.path)),
      }
    }

    // Xóa file tạm sau khi upload
    fs.unlinkSync(file.path)

    // Xóa file nén nếu có
    if (
      shouldDeleteCompressed &&
      filePath !== file.path &&
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(filePath)
    }

    // Trả về thông tin file
    return {
      fileName: path.basename(fileName),
      originalName: file.originalname,
      url: uploadResult.Location,
      fileType,
      mimeType: file.mimetype,
      size: file.size,
      ...metadata,
    }
  } catch (error) {
    console.error("Error uploading to S3:", error)

    // Xóa file tạm nếu có lỗi
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path)
    }

    // Xóa file nén nếu có lỗi
    if (
      shouldDeleteCompressed &&
      filePath !== file.path &&
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(filePath)
    }

    throw error
  }
}

/**
 * Xóa file từ S3
 * @param {string} fileUrl - URL của file cần xóa
 * @returns {Promise<boolean>} - Kết quả xóa file
 */
const deleteFile = async (fileUrl) => {
  try {
    // Trích xuất key từ URL
    const urlParts = new URL(fileUrl)
    const key = urlParts.pathname.substring(1) // Bỏ dấu / ở đầu

    if (!key) {
      throw new Error("Invalid S3 URL")
    }

    const params = {
      Bucket: bucketName,
      Key: key,
    }

    await s3.deleteObject(params).promise()

    // Nếu là video, xóa cả thumbnail
    if (key.startsWith("videos/")) {
      const thumbnailKey = key
        .replace("videos/", "thumbnails/")
        .replace(/\.[^.]+$/, ".jpg")
      const thumbnailParams = {
        Bucket: bucketName,
        Key: thumbnailKey,
      }

      try {
        await s3.deleteObject(thumbnailParams).promise()
      } catch (error) {
        console.error("Error deleting thumbnail:", error)
        // Bỏ qua lỗi khi xóa thumbnail
      }
    }

    return true
  } catch (error) {
    console.error("Error deleting from S3:", error)
    throw error
  }
}

/**
 * Tạo thumbnail cho video
 * @param {string} videoPath - Đường dẫn đến file video
 * @returns {Promise<string>} - Đường dẫn đến thumbnail
 */
const generateVideoThumbnail = async (videoPath) => {
  try {
    // Tạo tên file thumbnail
    const thumbnailPath = path.join(
      path.dirname(videoPath),
      `${path.basename(videoPath, path.extname(videoPath))}-thumbnail.jpg`
    )

    // Tạo thumbnail bằng ffmpeg
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ["10%"],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: "320x240",
        })
        .on("end", () => {
          resolve(thumbnailPath)
        })
        .on("error", (err) => {
          console.error("Error generating thumbnail:", err)
          resolve(null)
        })
    })
  } catch (error) {
    console.error("Error generating video thumbnail:", error)
    return null
  }
}

/**
 * Lấy metadata của video
 * @param {string} videoPath - Đường dẫn đến file video
 * @returns {Promise<Object>} - Metadata của video
 */
const getVideoMetadata = async (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error("Error getting video metadata:", err)
        return resolve({})
      }

      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === "video"
      )

      resolve({
        width: videoStream ? videoStream.width : null,
        height: videoStream ? videoStream.height : null,
        duration: metadata.format.duration || null,
      })
    })
  })
}

/**
 * Lấy metadata của audio
 * @param {string} audioPath - Đường dẫn đến file audio
 * @returns {Promise<Object>} - Metadata của audio
 */
const getAudioMetadata = async (audioPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        console.error("Error getting audio metadata:", err)
        return resolve({})
      }

      resolve({
        duration: metadata.format.duration || null,
      })
    })
  })
}

module.exports = {
  uploadFile,
  deleteFile,
}
