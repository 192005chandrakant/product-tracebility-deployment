const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  name: String,
  origin: String,
  manufacturer: String,
  certFile: String, // base64 or URL
  imageFile: String, // product image URL
  description: String,
  stages: [String],
  blockchainRefHash: String,
  createdByWallet: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', ProductSchema); 