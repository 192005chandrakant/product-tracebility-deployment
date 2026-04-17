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

const StageDocumentVerificationSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['allowed', 'flagged', 'blocked', 'skipped'],
    default: 'skipped'
  },
  reviewState: {
    type: String,
    enum: ['verified', 'pending_review', 'rejected', 'not_required'],
    default: 'not_required'
  },
  riskScore: {
    type: Number,
    default: 0
  },
  issues: [String],
  criticalFailures: [String],
  aiModel: String,
  reason: String,
  pipeline: mongoose.Schema.Types.Mixed,
  verifiedAt: Date
}, { _id: false });

const StageDocumentSchema = new mongoose.Schema({
  documentType: {
    type: String,
    default: 'other'
  },
  title: String,
  standardCode: String,
  documentReference: String,
  issuingAuthority: String,
  issuerCountry: String,
  complianceScope: String,
  documentVersion: String,
  certificateNumber: String,
  batchNumber: String,
  lotNumber: String,
  issueDate: Date,
  expiryDate: Date,
  notes: String,
  verificationNotes: String,
  requiresVerification: {
    type: Boolean,
    default: false
  },
  file: FileDataSchema,
  uploadedBy: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  verification: StageDocumentVerificationSchema
}, { _id: false });

const StageEventSchema = new mongoose.Schema({
  stage: {
    type: String,
    required: true
  },
  stageNotes: String,
  location: String,
  updatedBy: String,
  blockchainTxHash: String,
  documents: [StageDocumentSchema],
  verificationSummary: {
    status: {
      type: String,
      enum: ['allowed', 'flagged', 'blocked', 'skipped'],
      default: 'skipped'
    },
    reviewState: {
      type: String,
      enum: ['verified', 'pending_review', 'rejected', 'not_required'],
      default: 'not_required'
    },
    issues: [String],
    riskScore: {
      type: Number,
      default: 0
    },
    reason: String
  },
  recordedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const BlockchainEventSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  stage: String,
  productId: String,
  initiatedBy: String,
  initiatedByRole: String,
  status: {
    type: String,
    enum: ['confirmed', 'failed', 'pending'],
    default: 'pending'
  },
  txHash: String,
  explorerUrl: String,
  contractAddress: String,
  blockNumber: Number,
  transactionIndex: Number,
  confirmations: Number,
  gasUsed: String,
  payload: mongoose.Schema.Types.Mixed,
  errorMessage: String,
  recordedAt: {
    type: Date,
    default: Date.now
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
  blockchainTx: String,
  blockchainStatus: {
    type: String,
    enum: ['confirmed', 'failed', 'pending'],
    default: 'pending'
  },
  blockchainUpdatedAt: Date,
  blockchainEvents: [BlockchainEventSchema],
  certificationHash: String, // Store certification hash separately for searching
  createdByWallet: String,
  isActive: { type: Boolean, default: true },
  // Backward-compatible aliases for external consumers expecting top-level verification fields.
  verificationStatus: {
    type: String,
    enum: ['allowed', 'flagged', 'blocked', 'skipped'],
    default: 'flagged'
  },
  riskScore: {
    type: Number,
    default: 100
  },
  issues: {
    type: [String],
    default: []
  },
  reviewedByAdmin: String,
  reviewedAt: Date,
  stageEvents: [StageEventSchema],
  verification: {
    status: {
      type: String,
      enum: ['allowed', 'flagged', 'blocked', 'skipped'],
      default: 'flagged'
    },
    reviewState: {
      type: String,
      enum: ['verified', 'pending_review', 'rejected', 'not_required'],
      default: 'pending_review'
    },
    riskScore: {
      type: Number,
      default: 100
    },
    lifecycleStatus: {
      type: String,
      enum: ['pending', 'on_chain_verified', 'certificate_verified', 'failed', 'flagged'],
      default: 'pending'
    },
    issues: [String],
    criticalFailures: [String],
    aiModel: String,
    pipeline: mongoose.Schema.Types.Mixed,
    reason: String,
    verifiedAt: Date,
    decisionAt: Date
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', ProductSchema); 