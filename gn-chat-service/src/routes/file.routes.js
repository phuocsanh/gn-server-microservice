const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { upload, handleUploadError } = require('../middlewares/upload.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// File upload routes
router.post('/upload', upload.single('file'), handleUploadError, fileController.uploadFile);
router.post('/upload-multiple', upload.array('files', 10), handleUploadError, fileController.uploadMultipleFiles);

// File deletion route
router.delete('/:filePath(*)', fileController.deleteFile);

module.exports = router;
