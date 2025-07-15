const path = require('path');
const { ethers } = require('ethers');

const Product = require('../Product.js');
const { generateQRCode } = require('../../qr/generateQR.js');
const blockchain = require('../../utils/blockchain.js');
const { hashString } = require('../../utils/hash.js');
const StorageFactory = require('../../services/storageFactory.js');

// Use Cloudinary as the only storage service
const getStorageService = () => {
  return StorageFactory.getStorageService();
};

exports.addProduct = async (req, res) => {
  try {
    // Check for authenticated user
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Secondary authentication required. Please log in again.' });
    }
    
    console.log('Adding product with data:', req.body);
    console.log('Files:', req.files);
    
    // Check if product already exists
    const existingProduct = await Product.findOne({ productId: req.body.productId });
    if (existingProduct) {
      return res.status(400).json({ 
        error: 'Product already exists',
        message: `Product with ID ${req.body.productId} already exists in the database`
      });
    }
    
    let certFileData = null;
    let imageFileData = null;
    let blockchainRefHash = req.body.blockchainRefHash || '';
    let txHash = null;
    
    // Handle certificate file upload to Google Drive
    if (req.files && req.files.certFile && req.files.certFile[0]) {
      const certFile = req.files.certFile[0];
      const certFileName = `cert_${Date.now()}_${certFile.originalname}`;
      
      console.log('Uploading certificate to storage:', certFileName);
      const certUploadResult = await getStorageService().uploadFile(
        certFile.buffer,
        certFileName,
        certFile.mimetype,
        req.body.productId
      );
      
      if (certUploadResult.success) {
        certFileData = {
          fileId: certUploadResult.fileId,
          fileName: certUploadResult.fileName,
          publicUrl: certUploadResult.publicUrl,
          downloadUrl: certUploadResult.downloadUrl
        };
        
        // Generate hash from file buffer for blockchain
        blockchainRefHash = hashString(certFile.buffer);
        console.log('Certificate uploaded successfully:', certFileName);
      } else {
        console.error('Certificate upload failed:', certUploadResult.error);
        return res.status(500).json({ 
          error: 'Failed to upload certificate file', 
          details: certUploadResult.error 
        });
      }
    }
    
    // Handle image file upload to Google Drive
    if (req.files && req.files.imageFile && req.files.imageFile[0]) {
      const imageFile = req.files.imageFile[0];
      const imageFileName = `image_${Date.now()}_${imageFile.originalname}`;
      
      console.log('Uploading image to storage:', imageFileName);
      const imageUploadResult = await getStorageService().uploadFile(
        imageFile.buffer,
        imageFileName,
        imageFile.mimetype,
        req.body.productId
      );
      
      if (imageUploadResult.success) {
        imageFileData = {
          fileId: imageUploadResult.fileId,
          fileName: imageUploadResult.fileName,
          publicUrl: imageUploadResult.publicUrl,
          downloadUrl: imageUploadResult.downloadUrl
        };
        console.log('Image uploaded successfully:', imageFileName);
      } else {
        console.error('Image upload failed:', imageUploadResult.error);
        return res.status(500).json({ 
          error: 'Failed to upload image file', 
          details: imageUploadResult.error 
        });
      }
    }

    // Blockchain integration (enabled)
    try {
      txHash = await blockchain.addProductOnChain({
        productId: req.body.productId,
        name: req.body.name,
        origin: req.body.origin,
        manufacturer: req.body.manufacturer,
        certificationHash: blockchainRefHash,
      });
      console.log('Blockchain txHash:', txHash);
    } catch (blockchainError) {
      console.error('Blockchain error:', blockchainError);
      
      // Handle specific blockchain errors
      if (blockchainError.reason === 'Product already exists') {
        return res.status(400).json({ 
          error: 'Product already exists on blockchain',
          message: `Product with ID ${req.body.productId} is already registered on the blockchain. Please use a different product ID.`,
          details: 'This product ID has been used before and cannot be reused.'
        });
      }
      
      // For other blockchain errors, continue without blockchain but log the error
      console.log('⚠️  Continuing without blockchain due to error:', blockchainError.message);
    }

    const product = new Product({ 
      ...req.body, 
      certFile: certFileData, 
      imageFile: imageFileData,
      blockchainRefHash: txHash || blockchainRefHash || 'mock-hash-' + Date.now(),
      certificationHash: blockchainRefHash,
      createdByWallet: req.user.email
    });
    
    await product.save();
    console.log('Product saved successfully:', product);

    // Generate QR code and upload to storage
    let qrCodeData = null;
    try {
      // Generate QR code with full product URL for better user experience
      const productUrl = `${req.protocol}://${req.get('host')}/product/${product.productId}`;
      console.log('Generating QR code for URL:', productUrl);
      
      const qrCodeBuffer = await generateQRCode(productUrl);
      
      if (qrCodeBuffer) {
        const qrFileName = `qr_${product.productId}_${Date.now()}.png`;
        console.log('Uploading QR code to storage:', qrFileName);
        
        const qrUploadResult = await getStorageService().uploadFile(
          qrCodeBuffer,
          qrFileName,
          'image/png',
          product.productId
        );
        
        if (qrUploadResult.success) {
          qrCodeData = {
            fileId: qrUploadResult.fileId,
            fileName: qrUploadResult.fileName,
            publicUrl: qrUploadResult.publicUrl,
            downloadUrl: qrUploadResult.downloadUrl,
            qrContent: productUrl, // Store what the QR code contains
            isMock: qrUploadResult.isMock || false
          };
          
          // Include base64 data for mock responses so QR codes can still be displayed
          if (qrUploadResult.base64Data) {
            qrCodeData.base64Data = qrUploadResult.base64Data;
            qrCodeData.hasLocalData = true;
          }
          
          // Update product with QR code data
          product.qrCode = qrCodeData;
          await product.save();
          
          console.log('QR code uploaded and saved successfully');
        } else {
          console.error('QR code upload failed:', qrUploadResult.error);
          // Generate base64 fallback for immediate display
          const { generateQRCodeDataURL } = require('../../qr/generateQR');
          const qrDataURL = await generateQRCodeDataURL(productUrl);
          qrCodeData = {
            base64Data: qrDataURL,
            fileName: qrFileName,
            qrContent: productUrl,
            isMock: true,
            publicUrl: qrDataURL,
            downloadUrl: qrDataURL
          };
        }
      }
    } catch (qrError) {
      console.error('QR generation/upload error:', qrError);
      // Generate fallback base64 QR code
      try {
        const productUrl = `${req.protocol}://${req.get('host')}/product/${product.productId}`;
        const { generateQRCodeDataURL } = require('../../qr/generateQR');
        const qrDataURL = await generateQRCodeDataURL(productUrl);
        qrCodeData = {
          base64Data: qrDataURL,
          fileName: `qr_${product.productId}_fallback.png`,
          qrContent: productUrl,
          isMock: true,
          publicUrl: qrDataURL,
          downloadUrl: qrDataURL
        };
      } catch (fallbackError) {
        console.error('Fallback QR generation failed:', fallbackError);
      }
    }

    res.status(201).json({ 
      message: 'Product added successfully',
      product: product.toObject(), 
      qrCode: qrCodeData, 
      blockchainTx: txHash || blockchainRefHash || 'mock-hash-' + Date.now() 
    });
  } catch (err) {
    console.error('Error in addProduct:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    // Check for authenticated user
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Secondary authentication required. Please log in again.' });
    }
    
    console.log('📝 Updating product:', { id: req.params.id, stage: req.body.stage });
    const { id } = req.params;
    const { stage } = req.body;

    if (!stage) {
      return res.status(400).json({ error: 'Stage is required' });
    }

    // Validate product exists first
    const existingProduct = await Product.findOne({ productId: id });
    if (!existingProduct) {
      console.log('❌ Product not found:', id);
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user owns this product
    if (existingProduct.createdByWallet !== req.user.email) {
      console.log('❌ User does not own this product:', { 
        productOwner: existingProduct.createdByWallet, 
        currentUser: req.user.email 
      });
      return res.status(403).json({ 
        error: 'Access denied. You can only update your own products.' 
      });
    }

    // Validate stage value
    const validStages = ['Harvested', 'Processed', 'Packaged', 'Shipped', 'Delivered', 'Sold'];
    if (!validStages.includes(stage)) {
      console.log('❌ Invalid stage:', stage);
      return res.status(400).json({ error: `Invalid stage. Must be one of: ${validStages.join(', ')}` });
    }

    let txHash = null;
    try {
      console.log('🔄 Updating stage on blockchain...');
      txHash = await blockchain.updateStageOnChain(id, stage);
      console.log('✅ Blockchain update successful, txHash:', txHash);
    } catch (blockchainError) {
      console.error('⚠️ Blockchain error:', blockchainError);
      // Continue without blockchain - we'll still update the database
    }

    // Update product with new stage
    const updateData = {
      $push: { stages: stage }
    };
    if (txHash) {
      updateData.blockchainTx = txHash;
    }

    const product = await Product.findOneAndUpdate(
      { productId: id },
      updateData,
      { new: true }
    );

    console.log('✅ Product updated successfully:', {
      productId: product.productId,
      stages: product.stages,
      blockchainTx: txHash
    });

    res.json({
      message: 'Product updated successfully',
      stages: product.stages,
      blockchainTx: txHash
    });
  } catch (err) {
    console.error('❌ Error in updateProduct:', err);
    res.status(500).json({ 
      error: 'Failed to update product',
      details: err.message,
      stage: req.body.stage 
    });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ productId: id });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let onChain = null;
    try {
      onChain = await blockchain.getProductOnChain(id);
    // Fix: Convert all BigInt values in onChain to strings
      function bigIntToString(obj) {
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(bigIntToString);
        if (obj && typeof obj === 'object') {
          return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, bigIntToString(v)])
          );
        }
        return obj;
      }
      onChain = bigIntToString(onChain);

    } catch (e) {
      console.error('Blockchain error in getProduct:', e);
    }

    res.json({ ...product.toObject(), onChain });
  } catch (err) {
    console.error('Error in getProduct:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// New endpoint to get products by specific user
exports.getMyProducts = async (req, res) => {
  try {
    // Check for authenticated user
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    console.log('🔍 getMyProducts called for user:', req.user.email);
    
    const products = await Product.find({ createdByWallet: req.user.email });
    console.log('🔍 My products found for', req.user.email, ':', products.length);
    
    res.json(products);
  } catch (err) {
    console.error('❌ Error in getMyProducts:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getProductByCertHash = async (req, res) => {
  try {
    const { certHash } = req.params;
    
    // First try to find by certificationHash field
    let product = await Product.findOne({ certificationHash: certHash });
    
    // If not found, try to find by blockchainRefHash (for backward compatibility)
    if (!product) {
      product = await Product.findOne({ blockchainRefHash: certHash });
    }
    
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let onChain = null;
    try {
      onChain = await blockchain.getProductOnChain(product.productId);
      // Convert BigInt values to strings
      function bigIntToString(obj) {
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(bigIntToString);
        if (obj && typeof obj === 'object') {
          return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, bigIntToString(v)])
          );
        }
        return obj;
      }
      onChain = bigIntToString(onChain);
    } catch (e) {
      console.error('Blockchain error in getProductByCertHash:', e);
    }

    res.json({ ...product.toObject(), onChain });
  } catch (err) {
    console.error('Error in getProductByCertHash:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getRecentProducts = async (req, res) => {
  try {
    // Get the limit parameter from query or default to 6
    const limit = parseInt(req.query.limit) || 6;
    
    // Find the most recently added products
    const recentProducts = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('productId name manufacturer origin stage stages imageFile createdAt updatedAt');
    
    // Transform data if needed
    const transformedProducts = recentProducts.map(product => {
      const productObj = product.toObject();
      
      // Ensure stages is available
      if (!productObj.stages || productObj.stages.length === 0) {
        productObj.stages = productObj.stage ? [productObj.stage] : ['Created'];
      }
      
      return productObj;
    });
    
    console.log(`Returning ${transformedProducts.length} recent products`);
    res.status(200).json(transformedProducts);
  } catch (error) {
    console.error('Error fetching recent products:', error);
    res.status(500).json({ error: 'Failed to fetch recent products' });
  }
};
