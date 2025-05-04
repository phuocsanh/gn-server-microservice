const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

/**
 * Cấu hình nén hình ảnh mặc định
 */
const defaultCompressionOptions = {
  jpeg: {
    quality: 80,
    progressive: true,
  },
  png: {
    quality: 80,
    compressionLevel: 9,
  },
  webp: {
    quality: 80,
  },
  gif: {
    // GIF không có tùy chọn nén với sharp
  },
};

/**
 * Nén hình ảnh trước khi upload
 * @param {string} filePath - Đường dẫn đến file hình ảnh
 * @param {Object} options - Tùy chọn nén
 * @returns {Promise<string>} - Đường dẫn đến file đã nén
 */
const compressImage = async (filePath, options = {}) => {
  try {
    const fileExt = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath, fileExt);
    const outputPath = path.join(path.dirname(filePath), `${fileName}-compressed${fileExt}`);
    
    // Lấy thông tin file
    const fileInfo = await sharp(filePath).metadata();
    
    // Kiểm tra kích thước hình ảnh
    const maxDimension = options.maxDimension || process.env.IMAGE_MAX_DIMENSION || 1920;
    let width = fileInfo.width;
    let height = fileInfo.height;
    
    // Tính toán kích thước mới nếu cần resize
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height / width) * maxDimension);
        width = maxDimension;
      } else {
        width = Math.round((width / height) * maxDimension);
        height = maxDimension;
      }
    }
    
    // Xác định định dạng đầu ra và tùy chọn nén
    let compressionOptions = {};
    let outputFormat = fileExt.substring(1); // Bỏ dấu chấm
    
    switch (fileExt) {
      case '.jpg':
      case '.jpeg':
        compressionOptions = {
          ...defaultCompressionOptions.jpeg,
          ...(options.jpeg || {}),
        };
        outputFormat = 'jpeg';
        break;
      case '.png':
        compressionOptions = {
          ...defaultCompressionOptions.png,
          ...(options.png || {}),
        };
        break;
      case '.webp':
        compressionOptions = {
          ...defaultCompressionOptions.webp,
          ...(options.webp || {}),
        };
        break;
      case '.gif':
        // Không nén GIF, chỉ resize nếu cần
        break;
      default:
        // Đối với các định dạng khác, chuyển đổi sang JPEG
        outputFormat = 'jpeg';
        compressionOptions = {
          ...defaultCompressionOptions.jpeg,
          ...(options.jpeg || {}),
        };
        break;
    }
    
    // Tạo pipeline xử lý hình ảnh
    let pipeline = sharp(filePath);
    
    // Resize nếu cần
    if (width !== fileInfo.width || height !== fileInfo.height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Áp dụng định dạng và tùy chọn nén
    if (outputFormat === 'jpeg') {
      pipeline = pipeline.jpeg(compressionOptions);
    } else if (outputFormat === 'png') {
      pipeline = pipeline.png(compressionOptions);
    } else if (outputFormat === 'webp') {
      pipeline = pipeline.webp(compressionOptions);
    }
    
    // Lưu file đã nén
    await pipeline.toFile(outputPath);
    
    // Kiểm tra kết quả nén
    const originalSize = fs.statSync(filePath).size;
    const compressedSize = fs.statSync(outputPath).size;
    const compressionRatio = (1 - compressedSize / originalSize) * 100;
    
    console.log(`Image compressed: ${filePath}`);
    console.log(`Original size: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`Compressed size: ${(compressedSize / 1024).toFixed(2)} KB`);
    console.log(`Compression ratio: ${compressionRatio.toFixed(2)}%`);
    
    // Nếu file nén lớn hơn file gốc, sử dụng file gốc
    if (compressedSize >= originalSize) {
      fs.unlinkSync(outputPath);
      console.log('Compressed image is larger than original, using original image');
      return filePath;
    }
    
    return outputPath;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Trả về file gốc nếu có lỗi
    return filePath;
  }
};

/**
 * Kiểm tra xem file có phải là hình ảnh có thể nén không
 * @param {string} mimeType - MIME type của file
 * @returns {boolean} - true nếu file là hình ảnh có thể nén
 */
const isCompressibleImage = (mimeType) => {
  const compressibleTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];
  
  return compressibleTypes.includes(mimeType);
};

module.exports = {
  compressImage,
  isCompressibleImage,
};
