const fs = require('fs');
const { promisify } = require('util');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');

/**
 * Get metadata for a file based on its type
 * @param {string} filePath - Path to the file
 * @param {string} fileType - Type of file ('image', 'video', 'audio', 'document')
 * @returns {Promise<Object>} - Metadata object
 */
const getMetadata = async (filePath, fileType) => {
  try {
    const metadata = {};
    
    switch (fileType) {
      case 'image':
        // Get image dimensions
        const imageInfo = await sharp(filePath).metadata();
        metadata.width = imageInfo.width;
        metadata.height = imageInfo.height;
        
        // Generate thumbnail if needed
        // This is optional and can be implemented later
        break;
        
      case 'video':
        // Get video metadata using ffmpeg
        metadata.thumbnailUrl = await generateVideoThumbnail(filePath);
        
        // Get video dimensions and duration
        const videoMetadata = await getVideoMetadata(filePath);
        metadata.width = videoMetadata.width;
        metadata.height = videoMetadata.height;
        metadata.duration = videoMetadata.duration;
        break;
        
      case 'audio':
        // Get audio duration
        const audioMetadata = await getAudioMetadata(filePath);
        metadata.duration = audioMetadata.duration;
        break;
    }
    
    return metadata;
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return {};
  }
};

/**
 * Generate a thumbnail for a video
 * @param {string} videoPath - Path to the video file
 * @returns {Promise<string>} - Path to the thumbnail
 */
const generateVideoThumbnail = async (videoPath) => {
  try {
    // Extract filename without extension
    const pathParts = videoPath.split('/');
    const filename = pathParts[pathParts.length - 1].split('.')[0];
    
    // Create thumbnail path
    const thumbnailPath = videoPath.replace(/videos\/([^/]+)$/, `thumbnails/${filename}.jpg`);
    
    // Create thumbnails directory if it doesn't exist
    const thumbnailDir = thumbnailPath.substring(0, thumbnailPath.lastIndexOf('/'));
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }
    
    // Generate thumbnail using ffmpeg
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['10%'],
          filename: `${filename}.jpg`,
          folder: thumbnailDir,
          size: '320x240'
        })
        .on('end', () => {
          resolve(`/uploads/thumbnails/${filename}.jpg`);
        })
        .on('error', (err) => {
          console.error('Error generating thumbnail:', err);
          reject(err);
        });
    });
  } catch (error) {
    console.error('Error generating video thumbnail:', error);
    return null;
  }
};

/**
 * Get video metadata
 * @param {string} videoPath - Path to the video file
 * @returns {Promise<Object>} - Video metadata
 */
const getVideoMetadata = async (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        return reject(err);
      }
      
      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      
      resolve({
        width: videoStream ? videoStream.width : null,
        height: videoStream ? videoStream.height : null,
        duration: metadata.format.duration || null
      });
    });
  });
};

/**
 * Get audio metadata
 * @param {string} audioPath - Path to the audio file
 * @returns {Promise<Object>} - Audio metadata
 */
const getAudioMetadata = async (audioPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        return reject(err);
      }
      
      resolve({
        duration: metadata.format.duration || null
      });
    });
  });
};

module.exports = {
  getMetadata,
  generateVideoThumbnail,
  getVideoMetadata,
  getAudioMetadata
};
