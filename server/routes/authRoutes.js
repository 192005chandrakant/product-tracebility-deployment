const express = require('express');
const router = express.Router();

// ✅ FIXED path to match actual location
const authController = require('../models/controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;
