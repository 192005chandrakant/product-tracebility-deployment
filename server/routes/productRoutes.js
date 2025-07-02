const express = require('express');
const router = express.Router();
const productController = require('../models/controllers/productController'); // ✅ Renamed to match usage below

const { auth, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
// Use diskStorage to save files to disk
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Test route
router.get('/test', (req, res) => {
  console.log('Test route hit!');
  res.json({ message: 'Product routes working!', timestamp: new Date().toISOString() });
});

// Simple test route without files
router.post('/add-product-test', auth, requireRole('producer'), (req, res) => {
  console.log('Add product test route hit!');
  console.log('Body:', req.body);
  res.json({ 
    message: 'Test route working', 
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Error handling for Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({ 
      error: 'File upload error', 
      details: err.message,
      code: err.code 
    });
  }
  next(err);
};

// Debug middleware to log request details
const debugRequest = (req, res, next) => {
  console.log('=== REQUEST DEBUG ===');
  console.log('Headers:', req.headers);
  console.log('Body fields:', Object.keys(req.body));
  console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');
  if (req.files) {
    Object.keys(req.files).forEach(key => {
      console.log(`File ${key}:`, req.files[key][0]?.originalname);
    });
  }
  console.log('=== END DEBUG ===');
  next();
};

// Main add product route with file handling
router.post('/add-product',
  auth,
  requireRole('producer'),
  upload.fields([
    { name: 'certFile', maxCount: 1 },
    { name: 'imageFile', maxCount: 1 }
  ]),
  handleMulterError,
  debugRequest,
  productController.addProduct
);

// Original routes
router.post('/update-product/:id', auth, requireRole(['producer', 'admin']), productController.updateProduct);
router.get('/product/:id', productController.getProduct);
router.get('/products', productController.getAllProducts);

module.exports = router;
