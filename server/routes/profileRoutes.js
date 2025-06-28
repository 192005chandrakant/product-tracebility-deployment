const express = require('express');
const router = express.Router();
const profileController = require('../models/controllers/profileController');
const { auth } = require('../middleware/auth');

// Get user profile
router.get('/', auth, profileController.getProfile);

// Update user profile
router.put('/', auth, profileController.updateProfile);

// Get user statistics
router.get('/stats', auth, profileController.getUserStats);

module.exports = router; 