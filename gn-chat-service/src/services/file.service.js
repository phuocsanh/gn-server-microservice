const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const { getMetadata } = require('../utils/file-utils');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories for different file types
const imageDir = path.join(uploadsDir, 'images');
const videoDir = path.join(uploadsDir, 'videos');
const audioDir = path.join(uploadsDir, 'audio');
const documentDir = path.join(uploadsDir, 'documents');

[imageDir, videoDir, audioDir, documentDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Save a file to the appropriate directory based on its type
 * @param {Object} file - The file object from multer
 * @returns {Promise<Object>} - File metadata
 */
const saveFile = async (file) => {
  try {
    // Generate a unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
    
    // Determine file type and destination directory
    let fileType = 'document';
    let destDir = documentDir;
    
    if (file.mimetype.startsWith('image/')) {
      fileType = 'image';
      destDir = imageDir;
    } else if (file.mimetype.startsWith('video/')) {
      fileType = 'video';
      destDir = videoDir;
    } else if (file.mimetype.startsWith('audio/')) {
      fileType = 'audio';
      destDir = audioDir;
    }
    
    // Create destination path
    const destPath = path.join(destDir, fileName);
    
    // Move file from temp location to destination
    const rename = promisify(fs.rename);
    await rename(file.path, destPath);
    
    // Get additional metadata based on file type
    const metadata = await getMetadata(destPath, fileType);
    
    // Create file object
    const fileObject = {
      fileName,
      originalName: file.originalname,
      url: `/uploads/${fileType}s/${fileName}`,
      fileType,
      mimeType: file.mimetype,
      size: file.size,
      ...metadata
    };
    
    return fileObject;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

/**
 * Delete a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} - True if successful
 */
const deleteFile = async (filePath) => {
  try {
    // Ensure the path is within our uploads directory for security
    const fullPath = path.join(__dirname, '../../', filePath);
    if (!fullPath.startsWith(uploadsDir)) {
      throw new Error('Invalid file path');
    }
    
    // Check if file exists
    if (fs.existsSync(fullPath)) {
      await promisify(fs.unlink)(fullPath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

module.exports = {
  saveFile,
  deleteFile
};
