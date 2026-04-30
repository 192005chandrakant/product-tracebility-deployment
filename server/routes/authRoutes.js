const express = require('express');
const router = express.Router();

// ✅ FIXED path to match actual location
const authController = require('../models/controllers/authController');
const { getFirebaseStatus } = require('../utils/firebaseVerification');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);

// ✅ NEW: Diagnostic endpoint to check Firebase configuration status
router.get('/debug/firebase-status', (req, res) => {
  try {
    const status = getFirebaseStatus();
    const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    res.json({
      firebase: status,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        FIREBASE_SERVICE_ACCOUNT_JSON: hasServiceAccount ? 'SET' : 'NOT_SET'
      },
      diagnostics: {
        canVerifyTokens: status.initialized && !status.error,
        requiresFirebase: process.env.NODE_ENV === 'production',
        recommendedAction: !status.initialized ? 'Check FIREBASE_SERVICE_ACCOUNT_JSON configuration' : 'Firebase is properly configured'
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get Firebase status',
      message: error.message
    });
  }
});

module.exports = router;
