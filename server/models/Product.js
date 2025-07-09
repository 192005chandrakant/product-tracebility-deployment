const mongoose = require('mongoose');

// File data schema for various storage services (Cloudinary, Google Drive, local)
const FileDataSchema = new mongoose.Schema({
  fileId: String,
  fileName: String, // Cleaned filename used for storage
  originalFileName: String, // Original filename from upload
  publicUrl: String,
  downloadUrl: String,
  shareUrl: String, // Dedicated sharing URL
  webViewLink: String,
  webContentLink: String,
  format: String, // File format (pdf, jpg, png, etc.)
  resourceType: String, // Storage resource type (image, raw, etc.)
  isPdf: Boolean, // Flag to identify PDF files
  cloudinaryResult: {
    public_id: String,
    secure_url: String,
    original_filename: String,
    url: String,
    bytes: Number,
    created_at: String
  }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  name: String,
  origin: String,
  manufacturer: String,
  certFile: FileDataSchema, // Certificate file data
  imageFile: FileDataSchema, // Product image file data
  qrCode: FileDataSchema, // QR code file data
  description: String,
  stages: [String],
  blockchainRefHash: String,
  certificationHash: String, // Store certification hash separately for searching
  createdByWallet: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', ProductSchema); 