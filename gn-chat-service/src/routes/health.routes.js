const express = require('express');
const healthController = require('../controllers/health.controller');

const router = express.Router();

// Health check endpoints
router.get('/health', healthController.healthCheck.bind(healthController));
router.get('/ready', healthController.readinessCheck.bind(healthController));
router.get('/live', healthController.livenessCheck.bind(healthController));

module.exports = router;
