const express = require('express');
const router = express.Router();
const productController = require('../models/controllers/productController');

// Use enhanced auth middleware instead of basic auth
const { auth, requireRole, requirePermission } = require('../middleware/enhancedAuth');
const multer = require('multer');

// Use memory storage for file uploads to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Test route
router.get('/test', (req, res) => {
  console.log('Test route hit!');
  res.json({ message: 'Product routes working!', timestamp: new Date().toISOString() });
});

// Simple test route
router.post('/add-product-simple', (req, res) => {
  console.log('Simple add product route hit!');
  console.log('Body:', req.body);
  res.status(200).json({ 
    success: true,
    message: 'Simple route working', 
    body: req.body,
    timestamp: new Date().toISOString()
  });
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
  requirePermission('add_product'),
  upload.fields([
    { name: 'certFile', maxCount: 1 },
    { name: 'imageFile', maxCount: 1 }
  ]),
  handleMulterError,
  debugRequest,
  productController.addProduct
);

// Original routes
router.post('/update-product/:id', 
  auth, 
  requireRole(['producer', 'admin']), 
  requirePermission('update_product_status'),
  upload.fields([
    { name: 'certFile', maxCount: 1 },
    { name: 'imageFile', maxCount: 1 }
  ]),
  handleMulterError,
  productController.updateProduct
);
router.get('/product/:id', productController.getProduct);
router.get('/products', productController.getAllProducts);
router.get('/my-products', auth, requireRole('producer'), productController.getMyProducts);
router.get('/recent-products', productController.getRecentProducts);
router.get('/product/by-cert-hash/:certHash', productController.getProductByCertHash);

// Add route to generate and download QR code
router.get('/product/:id/qr', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await require('../models/Product').findOne({ productId: id });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // If product already has QR code, return it
    if (product.qrCode && product.qrCode.publicUrl) {
      return res.json({
        success: true,
        qrCode: product.qrCode
      });
    }
    
    // Otherwise generate a new QR code
    const { generateQRCode } = require('../qr/generateQR');
    
    // Generate QR code with full product URL for better user experience
    const productUrl = `${req.protocol}://${req.get('host')}/product/${product.productId}`;
    console.log('Generating QR code for URL:', productUrl);
    
    const qrCodeBuffer = await generateQRCode(productUrl);
    
    if (!qrCodeBuffer) {
      return res.status(500).json({ error: 'Failed to generate QR code' });
    }
    
    // Upload to storage
    const qrFileName = `qr_${product.productId}_${Date.now()}.png`;
    const getStorageService = require('../services/storageFactory').getStorageService;
    const qrUploadResult = await getStorageService().uploadFile(
      qrCodeBuffer,
      qrFileName,
      'image/png',
      product.productId
    );
    
    if (!qrUploadResult.success) {
      return res.status(500).json({ error: 'Failed to upload QR code' });
    }
    
    const qrCodeData = {
      fileId: qrUploadResult.fileId,
      fileName: qrUploadResult.fileName,
      publicUrl: qrUploadResult.publicUrl,
      downloadUrl: qrUploadResult.downloadUrl,
      qrContent: productUrl // Store what the QR code contains
    };
    
    // Save QR code data to product
    product.qrCode = qrCodeData;
    await product.save();
    
    res.json({
      success: true,
      qrCode: qrCodeData
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
