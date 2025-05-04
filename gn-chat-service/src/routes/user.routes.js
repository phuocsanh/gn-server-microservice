const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// User routes
router.get('/status/:userId', userController.getUserStatus);
router.get('/status', userController.getUsersStatus);
router.get('/:userId', userController.getUserInfo);
router.get('/', userController.searchUsers);

module.exports = router;
