const Product = require('../Product');
const AdminActionLog = require('../AdminActionLog');
const { buildBlockchainTransparencySnapshot } = require('../../services/blockchainLedger');

const FLAG_THRESHOLD = Number(process.env.ADMIN_FLAG_THRESHOLD || 40);

const LIFECYCLE_LABELS = {
  pending: 'Pending',
  on_chain_verified: 'On-chain Verified',
  certificate_verified: 'Certificate Verified',
  failed: 'Failed',
  flagged: 'Flagged'
};

function getRiskBand(riskScore) {
  const score = Number(riskScore || 0);
  if (score >= 75) return 'high';
  if (score >= 40) return 'medium';
  return 'safe';
}

function getLifecycleStatus(product, verification) {
  const status = String(verification.status || 'flagged').toLowerCase();
  const reviewState = String(verification.reviewState || 'pending_review').toLowerCase();
  const blockchainStatus = String(product.blockchainStatus || '').toLowerCase();
  const isActive = product.isActive !== false;

  if (!isActive || status === 'blocked' || reviewState === 'rejected') {
    return 'failed';
  }

  if (status === 'allowed' && reviewState === 'verified' && blockchainStatus === 'confirmed') {
    return 'on_chain_verified';
  }

  if (status === 'allowed' && reviewState === 'verified') {
    return 'certificate_verified';
  }

  if (status === 'flagged' || reviewState === 'pending_review' || Number(verification.riskScore || 0) >= FLAG_THRESHOLD) {
    return 'flagged';
  }

  return 'pending';
}

function getLifecycleLabel(lifecycleStatus) {
  return LIFECYCLE_LABELS[lifecycleStatus] || 'Pending';
}

function buildVerificationTimeline(product, verification) {
  const events = [];

  if (product.createdAt) {
    events.push({
      key: 'created',
      label: 'Product created',
      description: 'Product record entered the moderation system.',
      date: product.createdAt,
      type: 'neutral'
    });
  }

  if (Array.isArray(product.stageEvents) && product.stageEvents.length > 0) {
    const recentStageEvents = product.stageEvents.slice(-3);
    recentStageEvents.forEach((event, index) => {
      events.push({
        key: `stage-${index}`,
        label: `Stage update: ${event.stage || 'Unknown'}`,
        description: event.verificationSummary?.reason
          ? `Stage review: ${event.verificationSummary.reason}`
          : event.stageNotes || 'Stage documentation was updated.',
        date: event.recordedAt || event.timestamp || product.createdAt,
        type: event.verificationSummary?.status === 'allowed'
          ? 'success'
          : event.verificationSummary?.status === 'blocked'
            ? 'danger'
            : event.verificationSummary?.status === 'flagged'
              ? 'warning'
              : 'neutral'
      });
    });
  }

  if (verification.aiModel || verification.pipeline) {
    events.push({
      key: 'ai',
      label: 'AI verification completed',
      description: verification.verifiedAt
        ? `Model ${verification.aiModel || 'unknown'} produced the latest moderation signal.`
        : 'AI verification details are available in the pipeline payload.',
      date: verification.verifiedAt || product.updatedAt || product.createdAt,
      type: 'ai'
    });
  }

  if (product.blockchainTx || product.blockchainUpdatedAt || Array.isArray(product.blockchainEvents)) {
    const latestBlockchainEvent = Array.isArray(product.blockchainEvents) && product.blockchainEvents.length > 0
      ? product.blockchainEvents[product.blockchainEvents.length - 1]
      : null;

    events.push({
      key: 'blockchain',
      label: 'Blockchain record updated',
      description: latestBlockchainEvent?.status
        ? `Ledger status: ${latestBlockchainEvent.status}`
        : `Blockchain status: ${product.blockchainStatus || 'pending'}`,
      date: latestBlockchainEvent?.recordedAt || product.blockchainUpdatedAt || product.updatedAt || product.createdAt,
      type: product.blockchainStatus === 'confirmed' ? 'success' : product.blockchainStatus === 'failed' ? 'danger' : 'neutral'
    });
  }

  if (verification.verifiedAt) {
    events.push({
      key: 'decision',
      label: 'Moderation decision',
      description: `Final status: ${verification.status || 'flagged'} / ${verification.reviewState || 'pending_review'}`,
      date: verification.verifiedAt,
      type: verification.status === 'allowed'
        ? 'success'
        : verification.status === 'blocked'
          ? 'danger'
          : 'warning'
    });
  } else if (verification.reason) {
    events.push({
      key: 'decision-fallback',
      label: 'Moderation snapshot',
      description: verification.reason,
      date: product.updatedAt || product.createdAt,
      type: verification.status === 'allowed' ? 'success' : verification.status === 'blocked' ? 'danger' : 'warning'
    });
  }

  return events
    .filter((event) => event && (event.date || event.description || event.label))
    .sort((a, b) => {
      const aTs = a.date ? new Date(a.date).getTime() : 0;
      const bTs = b.date ? new Date(b.date).getTime() : 0;
      return aTs - bTs;
    });
}

function getVerificationView(product) {
  const verification = product.verification || {};
  const lifecycleStatus = getLifecycleStatus(product, verification);
  return {
    status: verification.status || 'flagged',
    reviewState: verification.reviewState || 'pending_review',
    riskScore: Number(verification.riskScore || 0),
    riskBand: getRiskBand(verification.riskScore),
    lifecycleStatus,
    lifecycleLabel: getLifecycleLabel(lifecycleStatus),
    issues: Array.isArray(verification.issues) ? verification.issues : [],
    criticalFailures: Array.isArray(verification.criticalFailures) ? verification.criticalFailures : [],
    aiModel: verification.aiModel || null,
    pipeline: verification.pipeline || null,
    verifiedAt: verification.verifiedAt || null,
    timeline: buildVerificationTimeline(product, verification)
  };
}

function parseExportLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 500;
  }

  return Math.min(parsed, 5000);
}

function sanitizeCsvCell(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);
  if (!/[",\n\r]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function buildCsv(rows, columns) {
  const header = columns.map((column) => sanitizeCsvCell(column)).join(',');
  const body = rows.map((row) => columns.map((column) => sanitizeCsvCell(row[column])).join(',')).join('\n');
  return body ? `${header}\n${body}` : `${header}\n`;
}

function mapAuditRecord(product) {
  const transparency = buildBlockchainTransparencySnapshot(product, null);

  return {
    productId: product.productId || null,
    name: product.name || null,
    manufacturer: product.manufacturer || null,
    origin: product.origin || null,
    createdByWallet: product.createdByWallet || null,
    createdAt: product.createdAt || null,
    updatedAt: product.updatedAt || null,
    blockchainStatus: product.blockchainStatus || null,
    verificationStatus: product.verification?.status || null,
    verificationReviewState: product.verification?.reviewState || null,
    verificationRiskScore: Number(product.verification?.riskScore || 0),
    transparency
  };
}

function mapAuditRecordToCsv(record) {
  const transparency = record.transparency || {};
  const summary = transparency.summary || {};
  const badge = transparency.verificationBadge || {};
  const onChainProof = transparency.onChainProof || {};

  return {
    productId: record.productId || '',
    name: record.name || '',
    manufacturer: record.manufacturer || '',
    origin: record.origin || '',
    createdByWallet: record.createdByWallet || '',
    createdAt: record.createdAt || '',
    updatedAt: record.updatedAt || '',
    verificationStatus: record.verificationStatus || '',
    verificationReviewState: record.verificationReviewState || '',
    verificationRiskScore: record.verificationRiskScore,
    blockchainStatus: record.blockchainStatus || '',
    contractAddress: badge.contractAddress || '',
    latestTxHash: summary.latestTxHash || '',
    latestStatus: summary.latestStatus || '',
    latestRecordedAt: summary.latestRecordedAt || '',
    ledgerEventCount: Number(summary.ledgerEventCount || 0),
    stageProofCount: Number(summary.stageProofCount || 0),
    onChainAvailable: Boolean(onChainProof.available),
    onChainMatches: Boolean(onChainProof.matches),
    proofHash: badge.proofHash || '',
    signature: badge.signature || '',
    signatureAlgorithm: badge.algorithm || '',
    signed: Boolean(badge.signed),
    badgeGeneratedAt: badge.generatedAt || '',
    ledgerEventsJson: JSON.stringify(Array.isArray(transparency.ledgerEvents) ? transparency.ledgerEvents : []),
    stageProofsJson: JSON.stringify(Array.isArray(transparency.stageProofs) ? transparency.stageProofs : [])
  };
}

function sanitizeModerationText(value, maxLength = 300) {
  return String(value || '')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

async function logAdminAction(req, action, productId, reason, metadata = {}) {
  await AdminActionLog.create({
    adminEmail: req.user.email,
    adminRole: req.user.role,
    action,
    productId,
    reason,
    metadata
  });
}

exports.getFlaggedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $or: [
        { 'verification.status': 'flagged' },
        { 'verification.reviewState': 'pending_review' },
        { 'verification.riskScore': { $gte: FLAG_THRESHOLD } }
      ]
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: products.map((product) => ({
        ...product,
        verification: getVerificationView(product)
      }))
    });
  } catch (error) {
    console.error('Admin flagged products error:', error.message || error);
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to load flagged products'
    });
  }
};

exports.getProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ productId: id }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...product,
        verification: getVerificationView(product)
      }
    });
  } catch (error) {
    console.error('Admin product review error:', error.message || error);
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to load product review'
    });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const [totalProducts, flaggedProducts, verifiedProducts, blockedProducts] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({
        $or: [
          { 'verification.status': 'flagged' },
          { 'verification.reviewState': 'pending_review' },
          { 'verification.riskScore': { $gte: FLAG_THRESHOLD } }
        ]
      }),
      Product.countDocuments({ 'verification.status': 'allowed', 'verification.reviewState': 'verified' }),
      Product.countDocuments({ 'verification.status': 'blocked' })
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        flaggedProducts,
        verifiedProducts,
        blockedProducts,
        flagThreshold: FLAG_THRESHOLD
      }
    });
  } catch (error) {
    console.error('Admin overview error:', error.message || error);
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to load admin overview'
    });
  }
};

exports.getActionLogs = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query && req.query.limit, 10);
    const requestedPage = Number.parseInt(req.query && req.query.page, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 25;
    const page = Number.isFinite(requestedPage)
      ? Math.max(requestedPage, 1)
      : 1;
    const skip = (page - 1) * limit;

    const rawAction = String((req.query && req.query.action) || '').trim().toLowerCase();
    const rawAdminEmail = String((req.query && req.query.adminEmail) || '').trim().toLowerCase();
    const rawStartDate = String((req.query && req.query.startDate) || '').trim();
    const rawEndDate = String((req.query && req.query.endDate) || '').trim();

    const query = {};

    if (['approve', 'reject', 'remove'].includes(rawAction)) {
      query.action = rawAction;
    }

    if (rawAdminEmail) {
      query.adminEmail = rawAdminEmail;
    }

    const hasStartDate = Boolean(rawStartDate);
    const hasEndDate = Boolean(rawEndDate);

    if (hasStartDate || hasEndDate) {
      query.createdAt = {};

      if (hasStartDate) {
        const parsedStartDate = new Date(rawStartDate);
        if (!Number.isNaN(parsedStartDate.getTime())) {
          query.createdAt.$gte = parsedStartDate;
        }
      }

      if (hasEndDate) {
        const parsedEndDate = new Date(rawEndDate);
        if (!Number.isNaN(parsedEndDate.getTime())) {
          query.createdAt.$lte = parsedEndDate;
        }
      }

      if (!query.createdAt.$gte && !query.createdAt.$lte) {
        delete query.createdAt;
      }
    }

    const [logs, total] = await Promise.all([
      AdminActionLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AdminActionLog.countDocuments(query)
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return res.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        action: rawAction || null,
        adminEmail: rawAdminEmail || null,
        startDate: rawStartDate || null,
        endDate: rawEndDate || null
      }
    });
  } catch (error) {
    console.error('Admin action logs error:', error.message || error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to load admin action logs'
    });
  }
};

exports.exportTransparencyAudit = async (req, res) => {
  try {
    const format = String((req.query && req.query.format) || 'json').trim().toLowerCase();
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Allowed values: json, csv.'
      });
    }

    const productId = String((req.query && req.query.productId) || '').trim();
    const limit = parseExportLimit(req.query && req.query.limit);

    const query = {};
    if (productId) {
      query.productId = productId;
    }

    const products = await Product.find(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    const records = products.map((product) => mapAuditRecord(product));
    const generatedAt = new Date().toISOString();

    if (format === 'json') {
      const payload = {
        success: true,
        format,
        generatedAt,
        filters: {
          productId: productId || null,
          limit
        },
        totalRecords: records.length,
        records
      };

      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('content-disposition', `attachment; filename="transparency-audit-${Date.now()}.json"`);
      return res.status(200).send(JSON.stringify(payload, null, 2));
    }

    const csvRows = records.map((record) => mapAuditRecordToCsv(record));
    const csvColumns = [
      'productId',
      'name',
      'manufacturer',
      'origin',
      'createdByWallet',
      'createdAt',
      'updatedAt',
      'verificationStatus',
      'verificationReviewState',
      'verificationRiskScore',
      'blockchainStatus',
      'contractAddress',
      'latestTxHash',
      'latestStatus',
      'latestRecordedAt',
      'ledgerEventCount',
      'stageProofCount',
      'onChainAvailable',
      'onChainMatches',
      'proofHash',
      'signature',
      'signatureAlgorithm',
      'signed',
      'badgeGeneratedAt',
      'ledgerEventsJson',
      'stageProofsJson'
    ];

    const csv = buildCsv(csvRows, csvColumns);
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.setHeader('content-disposition', `attachment; filename="transparency-audit-${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Admin transparency export error:', error.message || error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to export transparency audit.'
    });
  }
};

exports.productAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body || {};
    const normalizedAction = sanitizeModerationText(action, 20).toLowerCase();
    const normalizedReason = sanitizeModerationText(reason, 500);

    if (!['approve', 'reject', 'remove'].includes(normalizedAction)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admin action. Allowed: approve, reject, remove.'
      });
    }

    const product = await Product.findOne({ productId: id });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let reviewState = product.verification?.reviewState || 'pending_review';
    let status = product.verification?.status || 'flagged';
    let isActive = product.isActive !== false;
    const reviewedAt = new Date();
    const reviewerEmail = sanitizeModerationText(req.user && req.user.email, 180).toLowerCase();

    if (normalizedAction === 'approve') {
      reviewState = 'verified';
      status = 'allowed';
      isActive = true;
    }

    if (normalizedAction === 'reject') {
      reviewState = 'rejected';
      status = 'blocked';
      isActive = true;
    }

    if (normalizedAction === 'remove') {
      reviewState = 'rejected';
      status = 'blocked';
      isActive = false;
    }

    product.isActive = isActive;
    product.verificationStatus = status;
    product.riskScore = Number(product.verification?.riskScore || 0);
    product.issues = Array.isArray(product.verification?.issues) ? product.verification.issues : [];
    product.reviewedByAdmin = reviewerEmail || null;
    product.reviewedAt = reviewedAt;
    product.verification = {
      ...(product.verification || {}),
      status,
      reviewState,
      verifiedAt: reviewedAt,
      decisionAt: reviewedAt,
      lifecycleStatus: normalizedAction === 'approve'
        ? (String(product.blockchainStatus || '').toLowerCase() === 'confirmed' ? 'on_chain_verified' : 'certificate_verified')
        : 'failed',
      issues: product.verification?.issues || [],
      criticalFailures: product.verification?.criticalFailures || []
    };

    await product.save();

    await logAdminAction(req, normalizedAction, id, normalizedReason || '', {
      status,
      reviewState,
      riskScore: product.verification?.riskScore || null,
      reviewedByAdmin: reviewerEmail || null,
      reviewedAt
    });

    res.json({
      success: true,
      message: `Product ${normalizedAction}d successfully`,
      data: {
        productId: product.productId,
        status,
        reviewState,
        isActive,
        reviewedByAdmin: product.reviewedByAdmin,
        reviewedAt: product.reviewedAt
      }
    });
  } catch (error) {
    console.error('Admin action error:', error.message || error);
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to process admin action'
    });
  }
};
