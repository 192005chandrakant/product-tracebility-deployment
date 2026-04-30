jest.mock('../models/Product', () => {
  const ProductMock = jest.fn(function Product(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
    this.toObject = jest.fn().mockImplementation(() => ({ ...this }));
  });

  ProductMock.findOne = jest.fn();
  ProductMock.findOneAndUpdate = jest.fn();
  ProductMock.find = jest.fn();

  return ProductMock;
});

jest.mock('../utils/blockchain', () => ({
  addProductOnChain: jest.fn(),
  updateStageOnChain: jest.fn()
}));

jest.mock('../qr/generateQR', () => ({
  generateQRCode: jest.fn(),
  generateQRCodeDataURL: jest.fn()
}));

jest.mock('../services/storageFactory', () => ({
  getStorageService: jest.fn()
}));

jest.mock('../services/verification/geminiVerification', () => ({
  analyzeCertificateWithGemini: jest.fn()
}));

jest.mock('../services/verification/fileValidation', () => ({
  validateCertificateFile: jest.fn()
}));

jest.mock('../services/verification/fieldMatching', () => ({
  matchProductAgainstCertificate: jest.fn()
}));

jest.mock('../services/verification/riskScoring', () => ({
  computeVerificationRisk: jest.fn()
}));

jest.mock('../services/verification/decisionEngine', () => ({
  decideVerificationOutcome: jest.fn()
}));

jest.mock('../services/blockchainLedger', () => ({
  buildBlockchainEventRecord: jest.fn(),
  buildLegacyBlockchainEvents: jest.fn(),
  buildBlockchainTransparencySnapshot: jest.fn()
}));

const Product = require('../models/Product');
const blockchain = require('../utils/blockchain');
const { generateQRCode, generateQRCodeDataURL } = require('../qr/generateQR');
const { getStorageService } = require('../services/storageFactory');
const { validateCertificateFile } = require('../services/verification/fileValidation');
const { analyzeCertificateWithGemini } = require('../services/verification/geminiVerification');
const { matchProductAgainstCertificate } = require('../services/verification/fieldMatching');
const { computeVerificationRisk } = require('../services/verification/riskScoring');
const { decideVerificationOutcome } = require('../services/verification/decisionEngine');
const { buildBlockchainEventRecord } = require('../services/blockchainLedger');

const productController = require('../models/controllers/productController');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}

function createCertificateFile() {
  return {
    originalname: 'certificate.pdf',
    mimetype: 'application/pdf',
    size: 12,
    buffer: Buffer.from('%PDF-1.7\n%%EOF')
  };
}

describe('productController.addProduct verification flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    Product.findOne.mockResolvedValue(null);
    blockchain.addProductOnChain.mockResolvedValue({
      contractAddress: '0xcontract',
      chainId: 11155111,
      to: '0xcontract',
      data: '0xabcdef',
      value: '0',
      methodName: 'addProduct',
      args: []
    });
    blockchain.updateStageOnChain.mockResolvedValue({
      contractAddress: '0xcontract',
      chainId: 11155111,
      to: '0xcontract',
      data: '0x123456',
      value: '0',
      methodName: 'updateStage',
      args: []
    });
    buildBlockchainEventRecord.mockImplementation((payload) => ({
      status: payload?.status || (payload?.txResult?.hash ? 'confirmed' : 'pending'),
      recordedAt: new Date('2026-04-17T00:00:00.000Z'),
      txHash: payload?.txResult?.hash || payload?.txResult?.txHash || payload?.txResult?.transactionHash || null,
      ...payload
    }));

    validateCertificateFile.mockReturnValue({
      valid: true,
      issues: [],
      metadata: { mime: 'application/pdf', size: 12, maxFileSizeBytes: 10485760 }
    });

    analyzeCertificateWithGemini.mockResolvedValue({
      success: true,
      model: 'gemini-2.5-flash-lite',
      analysis: {
        structure: 'pass',
        languageQuality: 'pass',
        signaturePresence: 'present',
        logoConsistency: 'pass',
        dateValidation: 'valid',
        issues: [],
        extractedFields: {
          productName: 'Organic Turmeric Powder',
          manufacturer: 'Walmart Foods Pvt Ltd',
          certificationType: 'ISO 22000',
          issuer: 'Global Cert Board',
          certificateId: 'CERT-22000-1',
          issueDate: '2026-01-01',
          expiryDate: '2027-01-01'
        },
        confidence: 96
      }
    });

    matchProductAgainstCertificate.mockReturnValue({
      overall: 'pass',
      averageScore: 100,
      fields: {
        productName: { status: 'exact', score: 100 },
        manufacturer: { status: 'exact', score: 100 },
        certificationType: { status: 'exact', score: 100 }
      },
      issues: []
    });

    computeVerificationRisk.mockReturnValue({
      riskScore: 4,
      issues: [],
      criticalFailures: []
    });

    decideVerificationOutcome.mockReturnValue({
      status: 'allowed',
      reviewState: 'verified',
      reason: 'Verification checks are within acceptable risk threshold.'
    });

    getStorageService.mockReturnValue({
      uploadFile: jest.fn().mockImplementation((buffer, fileName, mimeType) => {
        const isQrUpload = String(mimeType || '').toLowerCase() === 'image/png';
        const responseName = isQrUpload ? 'qr_1.png' : 'stage_registered_1_certificate.pdf';

        return Promise.resolve({
          success: true,
          fileId: isQrUpload ? 'qr-file-1' : 'certificate-file-1',
          fileName: responseName,
          originalFileName: isQrUpload ? 'qr_1.png' : 'certificate.pdf',
          publicUrl: `https://example.com/${responseName}`,
          downloadUrl: `https://example.com/${responseName}`,
          shareUrl: `https://example.com/${responseName}`,
          webViewLink: `https://example.com/${responseName}`,
          webContentLink: `https://example.com/${responseName}`,
          format: isQrUpload ? 'png' : 'pdf',
          resourceType: isQrUpload ? 'image' : 'raw',
          isPdf: !isQrUpload,
          base64Data: null,
          cloudinaryResult: {}
        });
      })
    });

    generateQRCode.mockResolvedValue(Buffer.from('qr-buffer'));
    generateQRCodeDataURL.mockResolvedValue('data:image/png;base64,qr-buffer');
  });

  test('blocks product creation when no certificate document is uploaded', async () => {
    const req = {
      user: { email: 'producer@example.com', role: 'producer' },
      body: {
        productId: 'P-100',
        name: 'Organic Turmeric Powder',
        origin: 'India',
        manufacturer: 'Walmart Foods Pvt Ltd',
        certificationType: 'ISO 22000',
        blockchainRefHash: ''
      },
      files: {
        imageFile: [],
        stageDocumentFiles: []
      }
    };
    const res = createRes();

    await productController.addProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      status: 'blocked',
      riskScore: 100
    }));
    expect(Product).not.toHaveBeenCalled();
    expect(blockchain.addProductOnChain).not.toHaveBeenCalled();
  });

  test('blocks product creation when productId format is invalid', async () => {
    const req = {
      user: { email: 'producer@example.com', role: 'producer' },
      body: {
        productId: 'bad id with spaces',
        name: 'Organic Turmeric Powder',
        origin: 'India',
        manufacturer: 'Walmart Foods Pvt Ltd',
        certificationType: 'ISO 22000'
      },
      files: {
        imageFile: [],
        stageDocumentFiles: []
      }
    };
    const res = createRes();

    await productController.addProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      status: 'blocked'
    }));
    expect(Product).not.toHaveBeenCalled();
    expect(blockchain.addProductOnChain).not.toHaveBeenCalled();
  });

  test('saves certificate and verification metadata on allowed product creation', async () => {
    const certificateFile = createCertificateFile();
    const req = {
      user: { email: 'producer@example.com', role: 'producer' },
      get: jest.fn().mockReturnValue('localhost:5000'),
      secure: false,
      body: {
        productId: 'P-101',
        name: 'Organic Turmeric Powder',
        origin: 'India',
        manufacturer: 'Walmart Foods Pvt Ltd',
        certificationType: 'ISO 22000',
        blockchainRefHash: '',
        registrationStageNotes: 'Initial registration'
      },
      files: {
        imageFile: [],
        stageDocumentFiles: [certificateFile]
      }
    };
    const res = createRes();

    const stageDocumentsMeta = JSON.stringify([
      {
        stage: 'Registered',
        documentType: 'certificate',
        title: 'ISO 22000 Certificate',
        documentReference: 'CERT-22000-1',
        issuingAuthority: 'Global Cert Board',
        requiresVerification: true,
        fileIndex: 0,
        standardCode: 'ISO 22000'
      }
    ]);
    req.body.stageDocumentsMeta = stageDocumentsMeta;

    await productController.addProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      status: 'allowed',
      riskScore: 4,
      verification: expect.objectContaining({
        status: 'allowed',
        reviewState: 'verified',
        riskScore: 4,
        pipeline: expect.objectContaining({
          source: 'stage_documents',
          documentsProcessed: 1
        })
      })
    }));

    expect(Product).toHaveBeenCalledTimes(1);
    const savedProduct = Product.mock.instances[0];
    expect(savedProduct.certFile).toEqual(expect.objectContaining({
      originalFileName: 'certificate.pdf',
      fileId: 'certificate-file-1'
    }));
    expect(savedProduct.blockchainStatus).toBe('pending');
    expect(savedProduct.blockchainRequest).toEqual(expect.objectContaining({
      methodName: 'addProduct',
      contractAddress: '0xcontract'
    }));
    expect(savedProduct.verification).toEqual(expect.objectContaining({
      status: 'allowed',
      reviewState: 'verified',
      lifecycleStatus: 'certificate_verified'
    }));
    expect(savedProduct.verificationStatus).toBe('allowed');
    expect(savedProduct.riskScore).toBe(4);
    expect(savedProduct.issues).toEqual([]);
    expect(savedProduct.verification).toHaveProperty('decisionAt');
    expect(savedProduct.verification).toHaveProperty('verifiedAt');
    expect(blockchain.addProductOnChain).toHaveBeenCalledWith(expect.objectContaining({
      productId: 'P-101',
      certificationHash: expect.any(String)
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      blockchainTx: null,
      transactionRequest: expect.objectContaining({
        methodName: 'addProduct',
        contractAddress: '0xcontract'
      })
    }));
  });

  test('persists blocked verification attempt and queues product for admin review', async () => {
    const certificateFile = createCertificateFile();
    const req = {
      user: { email: 'producer@example.com', role: 'producer' },
      get: jest.fn().mockReturnValue('localhost:5000'),
      secure: false,
      body: {
        productId: 'P-102',
        name: 'Organic Turmeric Powder',
        origin: 'India',
        manufacturer: 'Walmart Foods Pvt Ltd',
        certificationType: 'ISO 22000',
        blockchainRefHash: '',
        registrationStageNotes: 'Initial registration'
      },
      files: {
        imageFile: [],
        stageDocumentFiles: [certificateFile]
      }
    };
    const res = createRes();

    req.body.stageDocumentsMeta = JSON.stringify([
      {
        stage: 'Registered',
        documentType: 'certificate',
        title: 'ISO 22000 Certificate',
        documentReference: 'CERT-22000-2',
        issuingAuthority: 'Global Cert Board',
        requiresVerification: true,
        fileIndex: 0,
        standardCode: 'ISO 22000'
      }
    ]);

    computeVerificationRisk.mockReturnValue({
      riskScore: 100,
      issues: ['Critical mismatch found'],
      criticalFailures: ['issuer_mismatch']
    });

    decideVerificationOutcome.mockReturnValue({
      status: 'blocked',
      reviewState: 'rejected',
      reason: 'Risk score above blocking threshold.'
    });

    await productController.addProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      status: 'blocked',
      queuedForAdminReview: true,
      product: expect.any(Object)
    }));

    expect(Product).toHaveBeenCalledTimes(1);
    const savedProduct = Product.mock.instances[0];
    expect(savedProduct.blockchainStatus).toBe('failed');
    expect(savedProduct.verification).toEqual(expect.objectContaining({
      status: 'blocked',
      reviewState: 'rejected',
      lifecycleStatus: 'failed'
    }));
    expect(savedProduct.verificationStatus).toBe('blocked');
    expect(savedProduct.riskScore).toBe(100);
    expect(blockchain.addProductOnChain).not.toHaveBeenCalled();
  });

  test('queues newly added stage documents for admin moderation after successful verification', async () => {
    const certificateFile = createCertificateFile();
    const existingProduct = {
      productId: 'P-103',
      name: 'Organic Turmeric Powder',
      manufacturer: 'Walmart Foods Pvt Ltd',
      createdByWallet: 'producer@example.com',
      stages: ['Registered'],
      stageEvents: [],
      verification: {
        status: 'allowed',
        reviewState: 'verified'
      }
    };

    Product.findOne.mockResolvedValue(existingProduct);
    Product.findOneAndUpdate.mockImplementation((query, update) => Promise.resolve({
      ...existingProduct,
      stages: ['Registered', 'Processed'],
      stageEvents: [update.$push.stageEvents],
      verification: update.$set.verification
    }));

    const req = {
      user: { email: 'producer@example.com', role: 'producer' },
      params: { id: 'P-103' },
      body: {
        stage: 'Processed',
        stageNotes: 'Processed at unit 7',
        stageLocation: 'Mumbai',
        certificationType: 'ISO 22000'
      },
      files: {
        stageDocumentFiles: [certificateFile]
      }
    };
    req.body.stageDocumentsMeta = JSON.stringify([
      {
        stage: 'Processed',
        documentType: 'certificate',
        title: 'Processing Certificate',
        documentReference: 'PROC-CERT-1',
        issuingAuthority: 'Global Cert Board',
        requiresVerification: true,
        fileIndex: 0,
        standardCode: 'ISO 22000'
      }
    ]);
    const res = createRes();

    await productController.updateProduct(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Product updated successfully',
      verification: expect.objectContaining({
        status: 'flagged',
        reviewState: 'pending_review',
        reason: 'New stage document requires admin moderation before approval.'
      })
    }));

    const update = Product.findOneAndUpdate.mock.calls[0][1];
    expect(update.$set.verification).toEqual(expect.objectContaining({
      status: 'flagged',
      reviewState: 'pending_review',
      lifecycleStatus: 'flagged',
      pipeline: expect.objectContaining({
        source: 'stage_documents',
        stage: 'Processed',
        documentsProcessed: 1
      })
    }));
    expect(update.$push.stageEvents.verificationSummary).toEqual(expect.objectContaining({
      status: 'flagged',
      reviewState: 'pending_review'
    }));
    expect(update.$push.stageEvents.documents[0].verification).toEqual(expect.objectContaining({
      status: 'flagged',
      reviewState: 'pending_review',
      reason: 'New stage document requires admin moderation before approval.',
      pipeline: expect.objectContaining({
        moderationRequired: true,
        stage: 'Processed'
      })
    }));
    expect(blockchain.updateStageOnChain).toHaveBeenCalledWith('P-103', 'Processed');
  });
});
