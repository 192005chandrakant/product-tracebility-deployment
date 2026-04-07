const express = require('express');
const rateLimit = require('express-rate-limit');

const aiController = require('../models/controllers/aiController');
const { auth } = require('../middleware/enhancedAuth');

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.AI_RATE_LIMIT_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests, please try again later.'
  }
});

router.use(aiLimiter);

router.get('/health', auth, aiController.health);
router.post('/chat', auth, aiController.chat);
router.post('/generate-description', auth, aiController.generateDescription);
router.post('/dashboard-insights', auth, aiController.dashboardInsights);

module.exports = router;
