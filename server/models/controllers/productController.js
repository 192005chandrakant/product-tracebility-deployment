const Product = require('../models/Product');
const { generateQRCode } = require('../qr/generateQR');
const blockchain = require('../utils/blockchain');
const { hashString } = require('../utils/hash');
const path = require('path');
// const { ethers } = require('ethers'); // Uncomment and configure for blockchain

exports.addProduct = async (req, res) => {
  try {
    let certFile = '';
    let blockchainRefHash = req.body.blockchainRefHash || '';
    if (req.file) {
      certFile = `/uploads/${req.file.filename}`;
      const fileBuffer = req.file.buffer;
      blockchainRefHash = hashString(fileBuffer);
    }
    // Write to blockchain
    const txHash = await blockchain.addProductOnChain({
      productId: req.body.productId,
      name: req.body.name,
      origin: req.body.origin,
      manufacturer: req.body.manufacturer,
      certificationHash: blockchainRefHash,
    });
    // Save to DB
    const product = new Product({ ...req.body, certFile, blockchainRefHash: txHash });
    await product.save();
    // Generate QR code for productId
    const qrCode = await generateQRCode(product.productId);
    res.status(201).json({ ...product.toObject(), qrCode, blockchainTx: txHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    // Update on blockchain
    const txHash = await blockchain.updateStageOnChain(id, stage);
    // Update in DB
    const product = await Product.findOneAndUpdate(
      { productId: id },
      { $push: { stages: stage }, blockchainRefHash: txHash },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ ...product.toObject(), blockchainTx: txHash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ productId: id });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    // Fetch blockchain data
    let onChain = null;
    try {
      onChain = await blockchain.getProductOnChain(id);
    } catch (e) {}
    res.json({ ...product.toObject(), onChain });
  } catch (err) {
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