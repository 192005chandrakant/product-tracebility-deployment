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
