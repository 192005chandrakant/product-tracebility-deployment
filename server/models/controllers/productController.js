const Product = require('../Product.js');
const { generateQRCode, generateQRCodeDataURL } = require('../../qr/generateQR.js');
const blockchain = require('../../utils/blockchain.js');
const { hashString } = require('../../utils/hash.js');
const StorageFactory = require('../../services/storageFactory.js');
const { validateCertificateFile } = require('../../services/verification/fileValidation');
const { analyzeCertificateWithGemini } = require('../../services/verification/geminiVerification');
const { matchProductAgainstCertificate } = require('../../services/verification/fieldMatching');
const { computeVerificationRisk } = require('../../services/verification/riskScoring');
const { decideVerificationOutcome } = require('../../services/verification/decisionEngine');
const {
  sanitizeText,
  parseDateOrNull,
  extractVerificationReason,
  parseStageDocumentsMeta,
  resolveStageDocumentEntries,
  validateStageDocumentEntries
} = require('../../services/verification/stageDocumentContracts');
const {
  buildBlockchainEventRecord,
  buildLegacyBlockchainEvents,
  buildBlockchainTransparencySnapshot
} = require('../../services/blockchainLedger');

const REGISTRATION_STAGE = 'Registered';
const VALID_STAGES = ['Harvested', 'Processed', 'Packaged', 'Shipped', 'Delivered', 'Sold'];
const PRODUCT_ID_PATTERN = /^[A-Za-z0-9._-]{3,120}$/;

const getStorageService = () => StorageFactory.getStorageService();

function resolvePublicBaseUrl(req) {
  const configuredBase = String(
    process.env.PUBLIC_BASE_URL || process.env.CLIENT_APP_URL || ''
  ).trim();

  if (configuredBase) {
    try {
      const parsed = new URL(configuredBase);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return `${parsed.protocol}//${parsed.host}`;
      }
    } catch (error) {
      // Ignore invalid configured URL and fallback to request-derived value.
    }
  }

  const hostHeader = String((req && req.get && req.get('host')) || '').trim();
  const safeHost = /^[A-Za-z0-9.-]+(?::\d{1,5})?$/.test(hostHeader) ? hostHeader : 'localhost:5000';
  const protocol = req && req.secure ? 'https' : 'http';
  return `${protocol}://${safeHost}`;
}

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function buildSkippedVerification(message) {
  const issue = message || 'Verification was not required for this document.';
  return {
    decision: {
      status: 'skipped',
      reviewState: 'not_required',
      reason: 'verification_not_required'
    },
    riskResult: {
      riskScore: 0,
      issues: [issue],
      criticalFailures: []
    },
    pipeline: {
      fileValidation: {
        valid: true,
        issues: [],
        metadata: null
      },
      ai: {
        success: false,
        skipped: true,
        reason: 'verification_not_required'
      },
      fieldMatch: {
        overall: 'pass',
        score: 100,
        issues: []
      }
    },
    model: null,
    aiFailed: false,
    aiAnalysis: null,
    aiVerification: null
  };
}

function validateRequiredVerificationContext(productContext = {}) {
  const issues = [];

  if (!sanitizeText(productContext.productName, 200)) {
    issues.push('Product name is required for certificate field matching.');
  }

  if (!sanitizeText(productContext.manufacturer, 200)) {
    issues.push('Manufacturer is required for certificate field matching.');
  }

  if (!sanitizeText(productContext.certificationType, 200)) {
    issues.push('Certification type is required for certificate field matching.');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

function getLifecycleStatusFromVerification(verificationSummary = {}) {
  const status = String(verificationSummary.status || 'flagged').toLowerCase();
  const reviewState = String(verificationSummary.reviewState || 'pending_review').toLowerCase();

  if (status === 'blocked' || reviewState === 'rejected') {
    return 'failed';
  }

  if (status === 'allowed' && reviewState === 'verified') {
    return 'certificate_verified';
  }

  if (status === 'flagged' || reviewState === 'pending_review') {
    return 'flagged';
  }

  return 'pending';
}

function pickPrimaryCertificateFile(documents = []) {
  if (!Array.isArray(documents) || documents.length === 0) {
    return null;
  }

  const preferredDocument = documents.find((document) => document && document.requiresVerification) || documents[0];
  return preferredDocument && preferredDocument.file ? preferredDocument.file : null;
}

function buildCompatibilityVerificationFields(verification = {}) {
  return {
    verificationStatus: verification.status || 'flagged',
    riskScore: Number(verification.riskScore || 0),
    issues: Array.isArray(verification.issues) ? verification.issues : []
  };
}

function logVerificationDecision(details = {}) {
  const safeIssues = Array.isArray(details.issues) ? details.issues : [];
  console.log('Verification decision:', {
    productId: details.productId || 'unknown',
    stage: details.stage || 'unknown',
    documentType: details.documentType || 'unknown',
    status: details.status || 'flagged',
    reviewState: details.reviewState || 'pending_review',
    riskScore: Number(details.riskScore || 0),
    issuesCount: safeIssues.length,
    aiFailed: Boolean(details.aiFailed)
  });
}

async function runCertificateVerification({ file, productContext = {}, required = true }) {
  if (!file) {
    if (required) {
      return {
        blocked: true,
        responseCode: 400,
        ...buildSkippedVerification('Certificate file is required for verification.')
      };
    }

    return {
      blocked: false,
      ...buildSkippedVerification('No certificate file was provided, so verification was skipped.')
    };
  }

  const fileValidation = validateCertificateFile(file);
  if (!fileValidation.valid) {
    return {
      blocked: true,
      responseCode: 400,
      decision: {
        status: 'blocked',
        reviewState: 'rejected',
        reason: 'invalid_certificate_file'
      },
      riskResult: {
        riskScore: 100,
        issues: fileValidation.issues,
        criticalFailures: ['invalid_file']
      },
      pipeline: {
        fileValidation,
        ai: {
          success: false,
          reason: 'file_validation_failed'
        },
        fieldMatch: {
          overall: 'fail',
          score: 0,
          issues: ['File validation failed before AI analysis.']
        }
      },
      model: null,
      aiFailed: false,
      aiAnalysis: null,
      aiVerification: null
    };
  }

  const aiVerification = await analyzeCertificateWithGemini({
    file,
    productContext
  });

  const aiFailed = !aiVerification.success;
  const aiAnalysis = aiFailed
    ? {
        structure: 'warning',
        languageQuality: 'warning',
        signaturePresence: 'unclear',
        logoConsistency: 'unclear',
        dateValidation: 'unclear',
        issues: aiVerification.issues || ['AI verification stage failed.'],
        extractedFields: {},
        confidence: 0
      }
    : aiVerification.analysis;

  const fieldMatch = aiFailed
    ? {
        overall: 'warning',
        averageScore: 0,
        fields: {
          productName: null,
          manufacturer: null,
          certificationType: null
        },
        issues: ['Field matching was skipped because AI extraction failed.']
      }
    : matchProductAgainstCertificate({
        product: {
          name: productContext.productName,
          manufacturer: productContext.manufacturer,
          certificationType: productContext.certificationType
        },
        extractedFields: aiAnalysis.extractedFields || {}
      });

  const riskResult = computeVerificationRisk({
    fileValidation,
    aiAnalysis,
    fieldMatch,
    aiFailure: aiFailed
  });

  const decision = decideVerificationOutcome({
    riskScore: riskResult.riskScore,
    criticalFailures: riskResult.criticalFailures,
    aiFailed,
    aiRecommendedAction: aiVerification.recommendedAction
  });

  const pipeline = {
    fileValidation,
    ai: {
      success: !aiFailed,
      model: aiVerification.model || null,
      analysis: aiAnalysis,
      reason: aiVerification.reason || null
    },
    fieldMatch
  };

  logVerificationDecision({
    stage: REGISTRATION_STAGE,
    status: decision.status,
    reviewState: decision.reviewState,
    riskScore: riskResult.riskScore,
    issues: riskResult.issues,
    aiFailed
  });

  return {
    blocked: decision.status === 'blocked',
    responseCode: decision.status === 'blocked' ? 422 : 200,
    decision,
    riskResult,
    pipeline,
    model: aiVerification.model || null,
    aiFailed,
    aiAnalysis,
    aiVerification
  };
}

async function uploadFileForProduct({ file, productId, prefix }) {
  if (!file) {
    return null;
  }

  if (!file.buffer || !Buffer.isBuffer(file.buffer) || !file.buffer.length) {
    throw new Error('Uploaded file is missing a readable buffer');
  }

  if (!file.mimetype || typeof file.mimetype !== 'string') {
    throw new Error('Uploaded file is missing a valid mime type');
  }

  const fileName = `${prefix}_${Date.now()}_${file.originalname}`;
  const result = await getStorageService().uploadFile(
    file.buffer,
    fileName,
    file.mimetype,
    productId
  );

  if (!result.success) {
    throw new Error(result.error || 'File upload failed');
  }

  return {
    fileId: result.fileId,
    fileName: result.fileName,
    originalFileName: result.originalFileName,
    publicUrl: result.publicUrl,
    downloadUrl: result.downloadUrl,
    shareUrl: result.shareUrl,
    webViewLink: result.webViewLink,
    webContentLink: result.webContentLink,
    format: result.format,
    resourceType: result.resourceType,
    isPdf: result.isPdf,
    cloudinaryResult: result.cloudinaryResult
  };
}

async function processStageDocuments({
  productId,
  stage,
  documentsMeta,
  documentFiles,
  productContext,
  uploader
}) {
  const docs = [];
  const verificationResults = [];
  const resolvedEntries = resolveStageDocumentEntries({
    stage,
    documentsMeta,
    documentFiles
  });

  for (const entry of resolvedEntries) {
    const { meta, resolvedStage, file } = entry;

    const storedFile = await uploadFileForProduct({
      file,
      productId,
      prefix: `stage_${resolvedStage.toLowerCase()}`
    });

    const shouldVerify = meta.requiresVerification || ['certificate', 'compliance_certificate', 'lab_report'].includes(meta.documentType);
    let verificationResult;

    if (shouldVerify) {
      verificationResult = await runCertificateVerification({
        file,
        productContext: {
          ...productContext,
          certificationType: meta.standardCode || productContext.certificationType
        },
        required: true
      });
    } else {
      verificationResult = buildSkippedVerification('Document verification was optional and not requested.');
    }

    docs.push({
      stage: resolvedStage,
      documentType: meta.documentType,
      title: meta.title,
      standardCode: meta.standardCode,
      documentReference: meta.documentReference,
      issuingAuthority: meta.issuingAuthority,
      issuerCountry: meta.issuerCountry,
      complianceScope: meta.complianceScope,
      documentVersion: meta.documentVersion,
      certificateNumber: meta.certificateNumber,
      batchNumber: meta.batchNumber,
      lotNumber: meta.lotNumber,
      issueDate: meta.issueDate,
      expiryDate: meta.expiryDate,
      notes: meta.notes,
      verificationNotes: meta.verificationNotes,
      requiresVerification: shouldVerify,
      file: storedFile,
      uploadedBy: uploader,
      uploadedAt: new Date(),
      verification: {
        status: verificationResult.decision.status,
        reviewState: verificationResult.decision.reviewState,
        riskScore: verificationResult.riskResult.riskScore,
        issues: verificationResult.riskResult.issues,
        criticalFailures: verificationResult.riskResult.criticalFailures,
        aiModel: verificationResult.model,
        reason: extractVerificationReason({
          decision: verificationResult.decision,
          aiVerification: verificationResult.aiVerification
        }),
        pipeline: verificationResult.pipeline,
        verifiedAt: new Date()
      }
    });

    verificationResults.push({
      blocked: !!verificationResult.blocked,
      documentType: meta.documentType,
      title: meta.title,
      decision: verificationResult.decision,
      riskResult: verificationResult.riskResult,
      pipeline: verificationResult.pipeline,
      reason: extractVerificationReason({
        decision: verificationResult.decision,
        aiVerification: verificationResult.aiVerification
      })
    });

    logVerificationDecision({
      productId,
      stage: resolvedStage,
      documentType: meta.documentType,
      status: verificationResult.decision.status,
      reviewState: verificationResult.decision.reviewState,
      riskScore: verificationResult.riskResult.riskScore,
      issues: verificationResult.riskResult.issues,
      aiFailed: verificationResult.aiFailed
    });
  }

  return {
    docs,
    verificationResults
  };
}

function summarizeStageVerification(results = []) {
  if (!results.length) {
    return {
      status: 'skipped',
      reviewState: 'not_required',
      issues: [],
      riskScore: 0,
      reason: 'No stage documentation was added for this update.'
    };
  }

  const hasBlocked = results.some((item) => item.decision.status === 'blocked');
  const hasFlagged = results.some((item) => item.decision.status === 'flagged');
  const status = hasBlocked ? 'blocked' : hasFlagged ? 'flagged' : 'allowed';
  const reviewState = hasBlocked ? 'rejected' : hasFlagged ? 'pending_review' : 'verified';
  const riskScore = Math.max(...results.map((item) => Number(item.riskResult.riskScore || 0)));
  const issues = [...new Set(results.flatMap((item) => item.riskResult.issues || []))].slice(0, 30);
  const reason =
    (results.find((item) => item.decision.status === 'blocked') || {}).reason ||
    (results.find((item) => item.decision.status === 'flagged') || {}).reason ||
    results[0].reason ||
    'Stage documentation was processed successfully.';

  return {
    status,
    reviewState,
    issues,
    riskScore,
    reason
  };
}

function extractBlockchainHash(blockchainResult) {
  if (!blockchainResult) {
    return null;
  }

  if (typeof blockchainResult === 'string') {
    return blockchainResult;
  }

  return blockchainResult.hash || blockchainResult.txHash || blockchainResult.transactionHash || null;
}

function parseBlockchainReceipt(receiptValue) {
  if (!receiptValue) {
    return null;
  }

  if (typeof receiptValue === 'string') {
    try {
      const parsed = JSON.parse(receiptValue);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  if (typeof receiptValue === 'object') {
    return receiptValue;
  }

  return null;
}

function resolveBlockchainReceipt(body = {}) {
  const parsedReceipt = parseBlockchainReceipt(body.blockchainReceipt || body.transactionReceipt || body.receipt);
  if (parsedReceipt) {
    return parsedReceipt;
  }

  const txHash = body.blockchainTxHash || body.transactionHash || body.txHash || body.blockchainTx || null;
  if (!txHash) {
    return null;
  }

  return {
    hash: txHash,
    txHash,
    transactionHash: txHash
  };
}

async function buildAndUploadQrCode(req, product) {
  let qrCodeData = null;
  const publicBaseUrl = resolvePublicBaseUrl(req);

  try {
    const productUrl = `${publicBaseUrl}/product/${encodeURIComponent(product.productId)}`;
    const qrCodeBuffer = await generateQRCode(productUrl);

    if (qrCodeBuffer) {
      const qrFileName = `qr_${product.productId}_${Date.now()}.png`;
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
          qrContent: productUrl,
          isMock: qrUploadResult.isMock || false
        };

        if (qrUploadResult.base64Data) {
          qrCodeData.base64Data = qrUploadResult.base64Data;
          qrCodeData.hasLocalData = true;
        }

        product.qrCode = qrCodeData;
        await product.save();
      } else {
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
    try {
      const productUrl = `${publicBaseUrl}/product/${encodeURIComponent(product.productId)}`;
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

  return qrCodeData;
}

exports.addProduct = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Authentication required. Please log in again.' });
    }

    const normalizedProductId = sanitizeText(req.body && req.body.productId, 120);
    if (!PRODUCT_ID_PATTERN.test(normalizedProductId || '')) {
      return res.status(400).json({
        success: false,
        status: 'blocked',
        riskScore: 100,
        issues: ['Invalid productId format. Use 3-120 characters: letters, numbers, dot, underscore, hyphen.'],
        message: 'Product ID is invalid.'
      });
    }

    req.body.productId = normalizedProductId;

    const imageFile = req.files && req.files.imageFile && req.files.imageFile[0];
    const stageDocumentFiles = (req.files && req.files.stageDocumentFiles) || [];
    const stageDocumentsMeta = parseStageDocumentsMeta(req.body.stageDocumentsMeta);

    const requiredContext = validateRequiredVerificationContext({
      productName: req.body && req.body.name,
      manufacturer: req.body && req.body.manufacturer,
      certificationType: req.body && req.body.certificationType
    });

    if (!requiredContext.valid) {
      return res.status(400).json({
        success: false,
        status: 'blocked',
        riskScore: 100,
        issues: requiredContext.issues,
        message: requiredContext.issues[0] || 'Missing required verification fields.'
      });
    }

    const existingProduct = await Product.findOne({ productId: req.body.productId });
    if (existingProduct) {
      return res.status(400).json({
        error: 'Product already exists',
        message: `Product with ID ${req.body.productId} already exists in the database`
      });
    }

    let imageFileData = null;
    let blockchainRefHash = req.body.blockchainRefHash || '';

    if (imageFile) {
      imageFileData = await uploadFileForProduct({
        file: imageFile,
        productId: req.body.productId,
        prefix: 'image'
      });
    }

    const registrationValidation = validateStageDocumentEntries({
      stage: REGISTRATION_STAGE,
      documentsMeta: stageDocumentsMeta,
      documentFiles: stageDocumentFiles,
      requireAtLeastOneFile: true,
      enforceRequiredFields: true
    });

    if (!registrationValidation.valid) {
      return res.status(400).json({
        success: false,
        status: 'blocked',
        riskScore: 100,
        message: registrationValidation.issues[0] || 'Registration document validation failed.',
        issues: registrationValidation.issues
      });
    }

    const registrationEntries = registrationValidation.entries;

    const normalizedRegistrationMeta = registrationEntries.map(({ meta }, index) => ({
      ...meta,
      stage: REGISTRATION_STAGE,
      requiresVerification: true,
      fileIndex: index
    }));

    const normalizedRegistrationFiles = registrationEntries.map(({ file }) => file);

    if (!blockchainRefHash && normalizedRegistrationFiles[0] && normalizedRegistrationFiles[0].buffer) {
      blockchainRefHash = hashString(normalizedRegistrationFiles[0].buffer);
    }

    const docsProcessing = await processStageDocuments({
      productId: req.body.productId,
      stage: REGISTRATION_STAGE,
      documentsMeta: normalizedRegistrationMeta,
      documentFiles: normalizedRegistrationFiles,
      productContext: {
        productName: req.body && req.body.name,
        manufacturer: req.body && req.body.manufacturer,
        certificationType: req.body && req.body.certificationType
      },
      uploader: req.user.email
    });

    const primaryCertificateFile = pickPrimaryCertificateFile(docsProcessing.docs);
    const verificationDecisionAt = new Date();
    const criticalFailures = [...new Set(
      docsProcessing.verificationResults.flatMap((result) => result.riskResult.criticalFailures || [])
    )];

    const blockedDoc = docsProcessing.verificationResults.find((result) => result.blocked);
    if (blockedDoc) {
      const blockedSummary = summarizeStageVerification(docsProcessing.verificationResults);
      const blockedDecisionAt = new Date();
      const blockedCriticalFailures = [...new Set(
        docsProcessing.verificationResults.flatMap((result) => result.riskResult.criticalFailures || [])
      )];
      const blockedLifecycleStatus = getLifecycleStatusFromVerification(blockedSummary);

      const blockedVerificationEvent = buildBlockchainEventRecord({
        action: 'verification_blocked',
        stage: REGISTRATION_STAGE,
        productId: req.body.productId,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        txResult: null,
        status: 'failed',
        payload: {
          reason: blockedSummary.reason,
          stage: REGISTRATION_STAGE,
          blockedBy: blockedDoc.documentType || 'registration_document'
        }
      });

      const blockedProduct = new Product({
        ...req.body,
        imageFile: imageFileData,
        certFile: primaryCertificateFile,
        blockchainRefHash: blockchainRefHash || `blocked-hash-${Date.now()}`,
        blockchainTx: null,
        blockchainStatus: 'failed',
        blockchainUpdatedAt: blockedDecisionAt,
        blockchainRequest: null,
        blockchainEvents: [blockedVerificationEvent],
        certificationHash: blockchainRefHash,
        createdByWallet: req.user.email,
        stageEvents: [{
          stage: REGISTRATION_STAGE,
          stageNotes: sanitizeText(req.body.registrationStageNotes, 800),
          updatedBy: req.user.email,
          blockchainTxHash: null,
          documents: docsProcessing.docs,
          verificationSummary: blockedSummary,
          recordedAt: blockedDecisionAt
        }],
        verification: {
          status: blockedSummary.status,
          reviewState: blockedSummary.reviewState,
          riskScore: blockedSummary.riskScore,
          issues: blockedSummary.issues,
          criticalFailures: blockedCriticalFailures,
          aiModel: null,
          reason: blockedSummary.reason,
          pipeline: {
            source: 'stage_documents',
            documentsProcessed: docsProcessing.verificationResults.length,
            blocked: true
          },
          verifiedAt: blockedDecisionAt,
          decisionAt: blockedDecisionAt,
          lifecycleStatus: blockedLifecycleStatus
        },
        ...buildCompatibilityVerificationFields({
          status: blockedSummary.status,
          riskScore: blockedSummary.riskScore,
          issues: blockedSummary.issues
        })
      });

      await blockedProduct.save();

      return res.status(422).json({
        success: false,
        status: 'blocked',
        riskScore: blockedDoc.riskResult.riskScore,
        issues: blockedDoc.riskResult.issues,
        message: 'Verification failed. Product has been queued for admin review.',
        queuedForAdminReview: true,
        product: blockedProduct.toObject(),
        verification: {
          status: blockedDoc.decision.status,
          reviewState: blockedDoc.decision.reviewState,
          riskScore: blockedDoc.riskResult.riskScore,
          issues: blockedDoc.riskResult.issues,
          stage: REGISTRATION_STAGE,
          reason: blockedDoc.reason,
          decision: blockedDoc.decision,
          pipeline: blockedDoc.pipeline,
          documentTitle: blockedDoc.title,
          documentType: blockedDoc.documentType,
          stageDocumentation: {
            summary: blockedSummary,
            details: docsProcessing.verificationResults
          }
        }
      });
    }

    const blockchainPayload = {
      name: req.body.name,
      origin: req.body.origin,
      manufacturer: req.body.manufacturer,
      certificationHash: blockchainRefHash
    };

    const blockchainReceipt = resolveBlockchainReceipt(req.body);
    const blockchainRequest = blockchainReceipt
      ? null
      : await blockchain.addProductOnChain({
          productId: req.body.productId,
          ...blockchainPayload
        });

    const txHash = extractBlockchainHash(blockchainReceipt || blockchainRequest);
    const blockchainEvent = buildBlockchainEventRecord({
      action: 'register_product',
      stage: REGISTRATION_STAGE,
      productId: req.body.productId,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      txResult: blockchainReceipt || null,
      status: blockchainReceipt ? 'confirmed' : 'pending',
      payload: {
        ...blockchainPayload,
        transactionRequest: blockchainRequest,
        transactionReceipt: blockchainReceipt
      }
    });

    const stageVerificationSummary = summarizeStageVerification(docsProcessing.verificationResults);
    const lifecycleStatus = getLifecycleStatusFromVerification(stageVerificationSummary);
    const registrationDecision = {
      status: stageVerificationSummary.status,
      reviewState: stageVerificationSummary.reviewState,
      reason: stageVerificationSummary.reason
    };

    const product = new Product({
      ...req.body,
      imageFile: imageFileData,
      certFile: primaryCertificateFile,
      blockchainRefHash: blockchainRefHash || `mock-hash-${Date.now()}`,
      blockchainTx: txHash,
      blockchainStatus: blockchainEvent.status,
      blockchainUpdatedAt: blockchainEvent.recordedAt,
      blockchainRequest: blockchainRequest,
      blockchainEvents: [blockchainEvent],
      certificationHash: blockchainRefHash,
      createdByWallet: req.user.email,
      stageEvents: [{
        stage: REGISTRATION_STAGE,
        stageNotes: sanitizeText(req.body.registrationStageNotes, 800),
        updatedBy: req.user.email,
        blockchainTxHash: txHash || null,
        documents: docsProcessing.docs,
        verificationSummary: stageVerificationSummary,
        recordedAt: new Date()
      }],
      verification: {
        status: stageVerificationSummary.status,
        reviewState: stageVerificationSummary.reviewState,
        riskScore: stageVerificationSummary.riskScore,
        issues: stageVerificationSummary.issues,
        criticalFailures,
        aiModel: null,
        reason: stageVerificationSummary.reason,
        pipeline: {
          source: 'stage_documents',
          documentsProcessed: docsProcessing.verificationResults.length
        },
        verifiedAt: verificationDecisionAt,
        decisionAt: verificationDecisionAt,
        lifecycleStatus
      },
      ...buildCompatibilityVerificationFields({
        status: stageVerificationSummary.status,
        riskScore: stageVerificationSummary.riskScore,
        issues: stageVerificationSummary.issues
      })
    });

    await product.save();

    const qrCodeData = await buildAndUploadQrCode(req, product);

    return res.status(201).json({
      message: 'Product added successfully',
      success: true,
      status: product.verification.status,
      riskScore: product.verification.riskScore,
      issues: product.verification.issues,
      product: product.toObject(),
      qrCode: qrCodeData,
      blockchainTx: txHash,
      blockchainEvent,
      transactionRequest: blockchainRequest,
      verification: {
        status: stageVerificationSummary.status,
        reviewState: stageVerificationSummary.reviewState,
        riskScore: stageVerificationSummary.riskScore,
        issues: stageVerificationSummary.issues,
        decision: registrationDecision,
        model: null,
        reason: stageVerificationSummary.reason,
        pipeline: {
          source: 'stage_documents',
          documentsProcessed: docsProcessing.verificationResults.length
        },
        stageDocumentation: {
          summary: stageVerificationSummary,
          details: docsProcessing.verificationResults
        }
      }
    });
  } catch (err) {
    console.error('Error in addProduct:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Authentication required. Please log in again.' });
    }

    const { id } = req.params;
    const stage = sanitizeText(req.body.stage, 80);

    if (!stage) {
      return res.status(400).json({ error: 'Stage is required' });
    }

    if (!VALID_STAGES.includes(stage)) {
      return res.status(400).json({
        error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}`
      });
    }

    const existingProduct = await Product.findOne({ productId: id });
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.user.role !== 'admin' && existingProduct.createdByWallet !== req.user.email) {
      return res.status(403).json({
        error: 'Access denied. You can only update your own products.'
      });
    }

    const stageDocumentFiles = (req.files && req.files.stageDocumentFiles) || [];
    const stageDocumentsMeta = parseStageDocumentsMeta(req.body.stageDocumentsMeta);

    const stageValidation = validateStageDocumentEntries({
      stage,
      documentsMeta: stageDocumentsMeta,
      documentFiles: stageDocumentFiles,
      requireAtLeastOneFile: false,
      enforceRequiredFields: true
    });

    if (!stageValidation.valid) {
      return res.status(400).json({
        success: false,
        status: 'blocked',
        message: stageValidation.issues[0] || 'Stage document validation failed.',
        issues: stageValidation.issues
      });
    }

    const docsProcessing = await processStageDocuments({
      productId: existingProduct.productId,
      stage,
      documentsMeta: stageValidation.entries.map(({ meta }) => meta),
      documentFiles: stageDocumentFiles,
      productContext: {
        productName: existingProduct.name,
        manufacturer: existingProduct.manufacturer,
        certificationType: req.body.certificationType || ''
      },
      uploader: req.user.email
    });

    const blockedDoc = docsProcessing.verificationResults.find((result) => result.blocked);
    if (blockedDoc) {
      const blockedSummary = summarizeStageVerification(docsProcessing.verificationResults);
      const blockedDecisionAt = new Date();

      const blockedUpdate = {
        status: blockedSummary.status,
        reviewState: blockedSummary.reviewState,
        riskScore: blockedSummary.riskScore,
        issues: blockedSummary.issues,
        reason: blockedSummary.reason,
        verifiedAt: blockedDecisionAt,
        decisionAt: blockedDecisionAt,
        pipeline: {
          source: 'stage_documents',
          stage,
          documentsProcessed: docsProcessing.verificationResults.length,
          blocked: true
        },
        lifecycleStatus: getLifecycleStatusFromVerification(blockedSummary)
      };

      const compatibilityUpdate = buildCompatibilityVerificationFields({
        status: blockedSummary.status,
        riskScore: blockedSummary.riskScore,
        issues: blockedSummary.issues
      });

      await Product.findOneAndUpdate(
        { productId: id },
        {
          $set: {
            verification: blockedUpdate,
            ...compatibilityUpdate
          },
          $push: {
            stageEvents: {
              stage,
              stageNotes: sanitizeText(req.body.stageNotes, 800),
              location: sanitizeText(req.body.stageLocation, 180),
              updatedBy: req.user.email,
              blockchainTxHash: null,
              documents: [...docsProcessing.docs],
              verificationSummary: blockedSummary,
              recordedAt: blockedDecisionAt
            }
          }
        },
        { new: true }
      );

      return res.status(422).json({
        success: false,
        status: 'blocked',
        riskScore: blockedDoc.riskResult.riskScore,
        issues: blockedDoc.riskResult.issues,
        message: 'Stage verification failed. Update has been queued for admin review.',
        queuedForAdminReview: true,
        verification: {
          status: blockedDoc.decision.status,
          reviewState: blockedDoc.decision.reviewState,
          riskScore: blockedDoc.riskResult.riskScore,
          issues: blockedDoc.riskResult.issues,
          stage,
          reason: blockedDoc.reason,
          decision: blockedDoc.decision,
          pipeline: blockedDoc.pipeline,
          documentTitle: blockedDoc.title,
          documentType: blockedDoc.documentType,
          context: 'stage_document',
          stageDocumentation: {
            summary: blockedSummary,
            details: docsProcessing.verificationResults
          }
        }
      });
    }

      const blockchainPayload = {
        stage,
        stageNotes: req.body.stageNotes || '',
        stageLocation: req.body.stageLocation || ''
      };

      const blockchainReceipt = resolveBlockchainReceipt(req.body);
      const blockchainRequest = blockchainReceipt
        ? null
        : await blockchain.updateStageOnChain(id, stage);

      const txHash = extractBlockchainHash(blockchainReceipt || blockchainRequest);
      const blockchainEvent = buildBlockchainEventRecord({
        action: 'update_stage',
        stage,
        productId: id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        txResult: blockchainReceipt || null,
        status: blockchainReceipt ? 'confirmed' : 'pending',
        payload: {
          ...blockchainPayload,
          transactionRequest: blockchainRequest,
          transactionReceipt: blockchainReceipt
        }
      });

    const verificationSummary = summarizeStageVerification(docsProcessing.verificationResults);
    const hasVerificationInputs = docsProcessing.verificationResults.length > 0;

    const verificationUpdate = hasVerificationInputs
      ? {
          status: verificationSummary.status,
          reviewState: verificationSummary.reviewState,
          riskScore: verificationSummary.riskScore,
          issues: verificationSummary.issues,
          reason: verificationSummary.reason,
          verifiedAt: new Date(),
          decisionAt: new Date(),
          pipeline: {
            source: 'stage_documents',
            stage,
            documentsProcessed: docsProcessing.verificationResults.length
          },
          lifecycleStatus: getLifecycleStatusFromVerification(verificationSummary)
        }
      : null;

    const compatibilityUpdate = hasVerificationInputs
      ? buildCompatibilityVerificationFields({
          status: verificationSummary.status,
          riskScore: verificationSummary.riskScore,
          issues: verificationSummary.issues
        })
      : null;

    const stageDocuments = [...docsProcessing.docs];

    const updatedProduct = await Product.findOneAndUpdate(
      { productId: id },
      {
        $set: {
          blockchainTx: txHash,
          blockchainStatus: blockchainEvent.status,
          blockchainUpdatedAt: blockchainEvent.recordedAt,
          blockchainRequest: blockchainRequest,
          ...(verificationUpdate ? { verification: verificationUpdate } : {}),
          ...(compatibilityUpdate || {})
        },
        $push: {
          stages: stage,
          blockchainEvents: blockchainEvent,
          stageEvents: {
            stage,
            stageNotes: sanitizeText(req.body.stageNotes, 800),
            location: sanitizeText(req.body.stageLocation, 180),
            updatedBy: req.user.email,
            blockchainTxHash: txHash || null,
            documents: stageDocuments,
            verificationSummary: {
              ...verificationSummary,
              reason: verificationSummary.reason || blockchainEvent.errorMessage || null
            },
            recordedAt: new Date()
          }
        }
      },
      { new: true }
    );

    return res.json({
      message: 'Product updated successfully',
      stages: updatedProduct.stages,
      blockchainTx: txHash,
      txHash,
      blockchainEvent,
      verification: {
        status: verificationSummary.status,
        reviewState: verificationSummary.reviewState,
        riskScore: verificationSummary.riskScore,
        issues: verificationSummary.issues,
        reason: verificationSummary.reason,
        stage,
        certificate: null,
        stageDocumentation: {
          summary: verificationSummary,
          details: docsProcessing.verificationResults
        }
      },
          transactionRequest: blockchainRequest,
      stageEvent: updatedProduct.stageEvents[updatedProduct.stageEvents.length - 1]
    });
  } catch (err) {
    console.error('Error in updateProduct:', err);
    return res.status(500).json({
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
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let onChain = null;
    try {
      onChain = await blockchain.getProductOnChain(id);
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

    const productObject = product.toObject();
    if (!Array.isArray(productObject.blockchainEvents) || productObject.blockchainEvents.length === 0) {
      productObject.blockchainEvents = buildLegacyBlockchainEvents(productObject);
    }

    const transparency = buildBlockchainTransparencySnapshot(productObject, onChain);

    return res.json({ ...productObject, onChain, transparency });
  } catch (err) {
    console.error('Error in getProduct:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.attachBlockchainReceipt = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const product = await Product.findOne({ productId: id });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.user.role !== 'admin' && product.createdByWallet !== req.user.email) {
      return res.status(403).json({ error: 'Access denied. You can only update your own products.' });
    }

    const blockchainReceipt = resolveBlockchainReceipt(req.body);
    const txHash = extractBlockchainHash(blockchainReceipt);

    if (!txHash) {
      return res.status(400).json({
        success: false,
        error: 'A blockchain receipt or transaction hash is required.'
      });
    }

    const blockchainEvent = buildBlockchainEventRecord({
      action: req.body.action || 'confirm_blockchain_submission',
      stage: sanitizeText(req.body.stage, 80) || null,
      productId: id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      txResult: blockchainReceipt,
      status: 'confirmed',
      payload: {
        transactionReceipt: blockchainReceipt,
        receiptSource: 'client_wallet'
      }
    });

    const updatedProduct = await Product.findOneAndUpdate(
      { productId: id },
      {
        $set: {
          blockchainTx: txHash,
          blockchainStatus: 'confirmed',
          blockchainUpdatedAt: blockchainEvent.recordedAt,
          blockchainRequest: null
        },
        $push: {
          blockchainEvents: blockchainEvent
        }
      },
      { new: true }
    );

    return res.json({
      success: true,
      message: 'Blockchain receipt attached successfully',
      blockchainTx: txHash,
      blockchainEvent,
      product: updatedProduct.toObject()
    });
  } catch (err) {
    console.error('Error in attachBlockchainReceipt:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page);
    const limit = parsePositiveInt(req.query.limit);
    const usePagination = Boolean(page || limit);

    if (!usePagination) {
      const products = await Product.find();
      return res.json(products);
    }

    const normalizedPage = page || 1;
    const normalizedLimit = Math.min(limit || 20, 100);
    const skip = (normalizedPage - 1) * normalizedLimit;

    const [products, total] = await Promise.all([
      Product.find().sort({ createdAt: -1 }).skip(skip).limit(normalizedLimit),
      Product.countDocuments()
    ]);

    return res.json({
      data: products,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: Math.ceil(total / normalizedLimit),
        hasNextPage: skip + products.length < total,
        hasPrevPage: normalizedPage > 1
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getMyProducts = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const page = parsePositiveInt(req.query.page);
    const limit = parsePositiveInt(req.query.limit);
    const usePagination = Boolean(page || limit);
    const filter = { createdByWallet: req.user.email };

    if (!usePagination) {
      const products = await Product.find(filter);
      return res.json(products);
    }

    const normalizedPage = page || 1;
    const normalizedLimit = Math.min(limit || 20, 100);
    const skip = (normalizedPage - 1) * normalizedLimit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(normalizedLimit),
      Product.countDocuments(filter)
    ]);

    return res.json({
      data: products,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: Math.ceil(total / normalizedLimit),
        hasNextPage: skip + products.length < total,
        hasPrevPage: normalizedPage > 1
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getProductByCertHash = async (req, res) => {
  try {
    const { certHash } = req.params;
    let product = await Product.findOne({ certificationHash: certHash });

    if (!product) {
      product = await Product.findOne({ blockchainRefHash: certHash });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let onChain = null;
    try {
      onChain = await blockchain.getProductOnChain(product.productId);
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

    const productObject = product.toObject();
    if (!Array.isArray(productObject.blockchainEvents) || productObject.blockchainEvents.length === 0) {
      productObject.blockchainEvents = buildLegacyBlockchainEvents(productObject);
    }

    const transparency = buildBlockchainTransparencySnapshot(productObject, onChain);

    return res.json({ ...productObject, onChain, transparency });
  } catch (err) {
    console.error('Error in getProductByCertHash:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.getRecentProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;

    const recentProducts = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('productId name manufacturer origin stage stages stageEvents imageFile createdAt updatedAt');

    const transformedProducts = recentProducts.map((product) => {
      const productObj = product.toObject();

      if (!productObj.stages || productObj.stages.length === 0) {
        productObj.stages = productObj.stage ? [productObj.stage] : ['Created'];
      }

      return productObj;
    });

    return res.status(200).json(transformedProducts);
  } catch (error) {
    console.error('Error fetching recent products:', error);
    return res.status(500).json({ error: 'Failed to fetch recent products' });
  }
};
