const express = require('express');
const router = express.Router();
const statisticsController = require('../models/controllers/statisticsController');
const { auth } = require('../middleware/auth');

console.log('📊 Statistics routes loaded');

// Get user statistics - add a test route without auth for debugging
router.get('/test', (req, res) => {
  res.json({ message: 'Statistics route working', timestamp: new Date().toISOString() });
});

// Get user statistics
router.get('/stats', auth, statisticsController.getStatistics);

// Get dashboard data
router.get('/dashboard', auth, statisticsController.getDashboardData);

// Record product scan
router.post('/scan/:productId', auth, statisticsController.incrementScanCounter);

console.log('📊 Statistics routes registered:', {
  '/test': 'GET (no auth)',
  '/stats': 'GET',
  '/dashboard': 'GET', 
  '/scan/:productId': 'POST'
});

module.exports = router;
