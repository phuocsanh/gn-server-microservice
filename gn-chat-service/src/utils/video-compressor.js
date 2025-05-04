const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

/**
 * Cấu hình nén video mặc định
 */
const defaultCompressionOptions = {
  // Preset: ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow
  preset: 'medium',
  // CRF (Constant Rate Factor): 0-51, thấp hơn = chất lượng cao hơn, 18-28 là phạm vi hợp lý
  crf: 23,
  // Độ phân giải tối đa (chiều rộng)
  maxWidth: 1280,
  // Bitrate tối đa (kb/s)
  maxBitrate: '1500k',
  // Codec video
  videoCodec: 'libx264',
  // Codec audio
  audioCodec: 'aac',
  // Bitrate audio
  audioBitrate: '128k',
  // Format đầu ra
  format: 'mp4',
};

/**
 * Kiểm tra xem file có phải là video có thể nén không
 * @param {string} mimeType - MIME type của file
 * @returns {boolean} - true nếu file là video có thể nén
 */
const isCompressibleVideo = (mimeType) => {
  const compressibleTypes = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm',
    'video/mpeg',
    'video/3gpp',
    'video/x-matroska',
  ];
  
  return compressibleTypes.includes(mimeType);
};

/**
 * Lấy thông tin video
 * @param {string} videoPath - Đường dẫn đến file video
 * @returns {Promise<Object>} - Thông tin video
 */
const getVideoInfo = async (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        return reject(err);
      }
      
      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
      
      resolve({
        duration: metadata.format.duration,
        size: metadata.format.size,
        bitrate: metadata.format.bit_rate,
        width: videoStream ? videoStream.width : null,
        height: videoStream ? videoStream.height : null,
        videoCodec: videoStream ? videoStream.codec_name : null,
        audioCodec: audioStream ? audioStream.codec_name : null,
        format: metadata.format.format_name,
      });
    });
  });
};

/**
 * Nén video trước khi upload
 * @param {string} videoPath - Đường dẫn đến file video
 * @param {Object} options - Tùy chọn nén
 * @returns {Promise<Object>} - Thông tin về video đã nén
 */
const compressVideo = async (videoPath, options = {}) => {
  try {
    // Lấy thông tin video gốc
    const videoInfo = await getVideoInfo(videoPath);
    console.log('Original video info:', videoInfo);
    
    // Kiểm tra xem video có cần nén không
    const needsCompression = checkIfNeedsCompression(videoInfo, options);
    
    if (!needsCompression) {
      console.log('Video does not need compression, using original');
      return {
        path: videoPath,
        compressed: false,
        info: videoInfo
      };
    }
    
    // Tạo tên file đầu ra
    const fileExt = path.extname(videoPath);
    const fileName = path.basename(videoPath, fileExt);
    const outputPath = path.join(path.dirname(videoPath), `${fileName}-compressed.mp4`);
    
    // Tính toán các tham số nén
    const compressionParams = calculateCompressionParams(videoInfo, options);
    
    // Nén video
    await compressVideoWithFFmpeg(videoPath, outputPath, compressionParams);
    
    // Lấy thông tin video đã nén
    const compressedInfo = await getVideoInfo(outputPath);
    console.log('Compressed video info:', compressedInfo);
    
    // Tính tỷ lệ nén
    const compressionRatio = (1 - (compressedInfo.size / videoInfo.size)) * 100;
    console.log(`Compression ratio: ${compressionRatio.toFixed(2)}%`);
    
    // Nếu video nén lớn hơn video gốc, sử dụng video gốc
    if (compressedInfo.size >= videoInfo.size) {
      console.log('Compressed video is larger than original, using original');
      fs.unlinkSync(outputPath);
      return {
        path: videoPath,
        compressed: false,
        info: videoInfo
      };
    }
    
    return {
      path: outputPath,
      compressed: true,
      info: compressedInfo,
      originalInfo: videoInfo,
      compressionRatio
    };
  } catch (error) {
    console.error('Error compressing video:', error);
    // Trả về video gốc nếu có lỗi
    return {
      path: videoPath,
      compressed: false,
      error: error.message
    };
  }
};

/**
 * Kiểm tra xem video có cần nén không
 * @param {Object} videoInfo - Thông tin video
 * @param {Object} options - Tùy chọn nén
 * @returns {boolean} - true nếu video cần nén
 */
const checkIfNeedsCompression = (videoInfo, options) => {
  const opts = { ...defaultCompressionOptions, ...options };
  
  // Kiểm tra kích thước file (MB)
  const fileSizeMB = videoInfo.size / (1024 * 1024);
  const maxSizeMB = options.maxSizeMB || 50; // Mặc định 50MB
  
  // Kiểm tra độ phân giải
  const tooLarge = videoInfo.width > opts.maxWidth;
  
  // Kiểm tra bitrate
  const maxBitrateKbps = parseInt(opts.maxBitrate.replace('k', ''));
  const videoBitrateKbps = videoInfo.bitrate / 1000;
  const bitrateTooHigh = videoBitrateKbps > maxBitrateKbps;
  
  // Kiểm tra định dạng
  const isNonStandardFormat = !['mp4', 'mov', 'webm'].includes(videoInfo.format);
  
  return fileSizeMB > maxSizeMB || tooLarge || bitrateTooHigh || isNonStandardFormat;
};

/**
 * Tính toán các tham số nén dựa trên thông tin video
 * @param {Object} videoInfo - Thông tin video
 * @param {Object} options - Tùy chọn nén
 * @returns {Object} - Các tham số nén
 */
const calculateCompressionParams = (videoInfo, options) => {
  const opts = { ...defaultCompressionOptions, ...options };
  
  // Tính toán độ phân giải mới
  let newWidth = videoInfo.width;
  let newHeight = videoInfo.height;
  
  if (newWidth > opts.maxWidth) {
    const aspectRatio = videoInfo.width / videoInfo.height;
    newWidth = opts.maxWidth;
    newHeight = Math.round(newWidth / aspectRatio);
    
    // Đảm bảo chiều cao chia hết cho 2 (yêu cầu của một số codec)
    if (newHeight % 2 !== 0) {
      newHeight += 1;
    }
  }
  
  // Tính toán bitrate dựa trên độ phân giải
  let bitrate = opts.maxBitrate;
  if (newWidth <= 640) {
    bitrate = '800k'; // SD
  } else if (newWidth <= 1280) {
    bitrate = '1500k'; // HD
  } else if (newWidth <= 1920) {
    bitrate = '4000k'; // Full HD
  }
  
  // Sử dụng bitrate từ options nếu có
  if (options.maxBitrate) {
    bitrate = options.maxBitrate;
  }
  
  return {
    width: newWidth,
    height: newHeight,
    videoBitrate: bitrate,
    audioBitrate: opts.audioBitrate,
    preset: opts.preset,
    crf: opts.crf,
    videoCodec: opts.videoCodec,
    audioCodec: opts.audioCodec,
    format: opts.format
  };
};

/**
 * Nén video sử dụng FFmpeg
 * @param {string} inputPath - Đường dẫn đến file video gốc
 * @param {string} outputPath - Đường dẫn đến file video đã nén
 * @param {Object} params - Các tham số nén
 * @returns {Promise<void>}
 */
const compressVideoWithFFmpeg = async (inputPath, outputPath, params) => {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec(params.videoCodec)
      .audioCodec(params.audioCodec)
      .size(`${params.width}x${params.height}`)
      .videoBitrate(params.videoBitrate)
      .audioBitrate(params.audioBitrate)
      .outputOptions([
        `-preset ${params.preset}`,
        `-crf ${params.crf}`,
        '-movflags +faststart', // Tối ưu hóa cho streaming
        '-pix_fmt yuv420p', // Tương thích với nhiều trình phát
      ])
      .format(params.format)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        console.log(`Processing: ${progress.percent ? progress.percent.toFixed(1) : 0}% done`);
      })
      .on('end', () => {
        console.log('Video compression completed');
        resolve();
      })
      .on('error', (err) => {
        console.error('Error during video compression:', err);
        reject(err);
      });
    
    command.run();
  });
};

module.exports = {
  compressVideo,
  isCompressibleVideo,
  getVideoInfo
};
