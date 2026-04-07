const crypto = require('crypto');

function getTxHash(txResult) {
  if (!txResult) {
    return null;
  }

  if (typeof txResult === 'string') {
    return txResult;
  }

  return txResult.txHash || txResult.hash || txResult.transactionHash || null;
}

function toExplorerUrl(txHash) {
  if (!txHash) {
    return null;
  }

  const base = String(process.env.BLOCKCHAIN_EXPLORER_BASE_URL || 'https://sepolia.etherscan.io/tx/').replace(/\/+$/, '');
  return `${base}/${txHash}`;
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeComparable(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeRecordedAt(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex');
}

function signProofHash(proofHash) {
  const signingKey = String(process.env.TRANSPARENCY_AUDIT_SIGNING_KEY || '').trim();
  if (!signingKey || !proofHash) {
    return null;
  }

  return crypto.createHmac('sha256', signingKey).update(proofHash, 'utf8').digest('hex');
}

function buildVerificationBadge(product = {}, latestLedgerEvent = null, summary = {}) {
  const contractAddress = normalizeText(
    (latestLedgerEvent && latestLedgerEvent.contractAddress) ||
    process.env.CONTRACT_ADDRESS ||
    ''
  ) || null;

  const payload = {
    productId: normalizeText(product.productId) || null,
    contractAddress,
    latestTxHash: normalizeText(latestLedgerEvent && latestLedgerEvent.txHash) || null,
    latestStatus: normalizeText(summary.latestStatus) || null,
    latestRecordedAt: normalizeRecordedAt(summary.latestRecordedAt),
    ledgerEventCount: Number(summary.ledgerEventCount || 0),
    stageProofCount: Number(summary.stageProofCount || 0),
    generatedAt: new Date().toISOString()
  };

  const canonicalPayload = JSON.stringify(payload);
  const proofHash = sha256Hex(canonicalPayload);
  const signature = signProofHash(proofHash);

  return {
    version: 'v1',
    algorithm: signature ? 'HMAC-SHA256' : 'SHA256',
    signed: Boolean(signature),
    contractAddress,
    latestTxHash: payload.latestTxHash,
    explorerUrl: latestLedgerEvent && latestLedgerEvent.explorerUrl ? latestLedgerEvent.explorerUrl : null,
    proofHash,
    signature,
    generatedAt: payload.generatedAt
  };
}

function normalizeBlockchainEvent(event = {}) {
  const txHash = getTxHash(event);
  return {
    kind: 'blockchain',
    action: normalizeText(event.action) || 'unknown',
    stage: normalizeText(event.stage) || null,
    productId: normalizeText(event.productId) || null,
    initiatedBy: normalizeText(event.initiatedBy) || null,
    initiatedByRole: normalizeText(event.initiatedByRole) || null,
    status: normalizeText(event.status) || 'pending',
    txHash,
    explorerUrl: event.explorerUrl || toExplorerUrl(txHash),
    contractAddress: normalizeText(event.contractAddress) || null,
    blockNumber: event.blockNumber ?? null,
    transactionIndex: event.transactionIndex ?? null,
    confirmations: event.confirmations ?? null,
    gasUsed: event.gasUsed != null ? String(event.gasUsed) : null,
    payload: event.payload || null,
    errorMessage: normalizeText(event.errorMessage) || null,
    recordedAt: normalizeRecordedAt(event.recordedAt || event.createdAt)
  };
}

function normalizeStageProofEvent(event = {}) {
  const txHash = getTxHash(event.blockchainTxHash || event.blockchainTx || event.txHash);
  return {
    kind: 'stage',
    action: 'update_stage',
    stage: normalizeText(event.stage) || null,
    status: txHash ? 'confirmed' : 'pending',
    txHash,
    explorerUrl: event.blockchainExplorerUrl || toExplorerUrl(txHash),
    updatedBy: normalizeText(event.updatedBy) || null,
    location: normalizeText(event.location) || null,
    stageNotes: normalizeText(event.stageNotes) || null,
    verificationStatus: normalizeText(event.verificationSummary && event.verificationSummary.status) || null,
    verificationReason: normalizeText(event.verificationSummary && event.verificationSummary.reason) || null,
    recordedAt: normalizeRecordedAt(event.recordedAt || event.timestamp || event.createdAt)
  };
}

function compareOnChainFields(product = {}, onChain = null) {
  const normalizedOnChain = Array.isArray(onChain) ? onChain : [];
  const stageValues = Array.isArray(normalizedOnChain[4]) ? normalizedOnChain[4] : [];
  const storedStages = Array.isArray(product.stages) ? product.stages : [];

  const comparisons = {
    productId: normalizeComparable(normalizedOnChain[0]) === normalizeComparable(product.productId),
    name: normalizeComparable(normalizedOnChain[1]) === normalizeComparable(product.name),
    origin: normalizeComparable(normalizedOnChain[2]) === normalizeComparable(product.origin),
    manufacturer: normalizeComparable(normalizedOnChain[3]) === normalizeComparable(product.manufacturer),
    stages: JSON.stringify(stageValues.map(normalizeComparable)) === JSON.stringify(storedStages.map(normalizeComparable)),
    certificationHash: normalizeComparable(normalizedOnChain[5]) === normalizeComparable(product.certificationHash || product.blockchainRefHash),
    createdByWallet: normalizeComparable(normalizedOnChain[7]) === normalizeComparable(product.createdByWallet)
  };

  const available = normalizedOnChain.length > 0;
  const matches = available ? Object.values(comparisons).every(Boolean) : false;

  return {
    available,
    matches,
    fields: comparisons,
    chainTimestamp: normalizedOnChain.length > 6 ? normalizedOnChain[6] : null,
    creator: normalizedOnChain.length > 7 ? normalizedOnChain[7] : null,
    stages: stageValues,
    raw: normalizedOnChain
  };
}

function buildBlockchainTransparencySnapshot(product = {}, onChain = null) {
  const rawEvents = Array.isArray(product.blockchainEvents) ? product.blockchainEvents : [];
  const normalizedLedgerEvents = rawEvents.length > 0
    ? rawEvents.map((event) => normalizeBlockchainEvent(event))
    : buildLegacyBlockchainEvents(product).map((event) => normalizeBlockchainEvent(event));

  const normalizedStageProofs = Array.isArray(product.stageEvents)
    ? product.stageEvents.map((event) => normalizeStageProofEvent(event))
    : [];

  const latestLedgerEvent = normalizedLedgerEvents.length > 0
    ? normalizedLedgerEvents[normalizedLedgerEvents.length - 1]
    : null;

  const confirmedCount = normalizedLedgerEvents.filter((event) => event.status === 'confirmed').length;
  const failedCount = normalizedLedgerEvents.filter((event) => event.status === 'failed').length;

  const summary = {
    ledgerEventCount: normalizedLedgerEvents.length,
    stageProofCount: normalizedStageProofs.length,
    confirmedCount,
    failedCount,
    latestStatus: latestLedgerEvent ? latestLedgerEvent.status : (product.blockchainStatus || 'pending'),
    latestTxHash: latestLedgerEvent ? latestLedgerEvent.txHash : (product.blockchainTx || null),
    latestRecordedAt: latestLedgerEvent ? latestLedgerEvent.recordedAt : normalizeRecordedAt(product.blockchainUpdatedAt || product.updatedAt || product.createdAt)
  };

  const verificationBadge = buildVerificationBadge(product, latestLedgerEvent, summary);

  return {
    latestLedgerEvent,
    ledgerEvents: normalizedLedgerEvents,
    stageProofs: normalizedStageProofs,
    onChainProof: compareOnChainFields(product, onChain),
    summary,
    verificationBadge
  };
}

function buildBlockchainEventRecord({ action, stage, productId, actorEmail, actorRole, txResult, payload, error }) {
  const txHash = getTxHash(txResult);
  const success = !error;

  return {
    action: String(action || 'unknown'),
    stage: stage || null,
    productId: productId || null,
    initiatedBy: actorEmail || null,
    initiatedByRole: actorRole || null,
    status: success ? 'confirmed' : 'failed',
    txHash: txHash || null,
    explorerUrl: txHash ? toExplorerUrl(txHash) : null,
    contractAddress: process.env.CONTRACT_ADDRESS || null,
    blockNumber: txResult && typeof txResult.blockNumber === 'number' ? txResult.blockNumber : null,
    transactionIndex: txResult && typeof txResult.transactionIndex === 'number' ? txResult.transactionIndex : null,
    confirmations: txResult && typeof txResult.confirmations === 'number' ? txResult.confirmations : null,
    gasUsed: txResult && txResult.gasUsed != null ? String(txResult.gasUsed) : null,
    payload: payload || null,
    errorMessage: error ? String(error.message || error) : null,
    recordedAt: new Date()
  };
}

function buildLegacyBlockchainEvents(product = {}) {
  const txHash = getTxHash(product.blockchainTx);

  if (!txHash) {
    return [];
  }

  return [
    {
      action: 'legacy_event',
      stage: Array.isArray(product.stages) && product.stages.length
        ? product.stages[product.stages.length - 1]
        : null,
      productId: product.productId || null,
      initiatedBy: product.createdByWallet || null,
      initiatedByRole: null,
      status: product.blockchainStatus || 'confirmed',
      txHash,
      explorerUrl: toExplorerUrl(txHash),
      contractAddress: process.env.CONTRACT_ADDRESS || null,
      blockNumber: null,
      transactionIndex: null,
      confirmations: null,
      gasUsed: null,
      payload: {
        source: 'legacy_migration'
      },
      errorMessage: null,
      recordedAt: product.blockchainUpdatedAt || product.createdAt || new Date()
    }
  ];
}

module.exports = {
  buildBlockchainEventRecord,
  buildLegacyBlockchainEvents,
  buildBlockchainTransparencySnapshot
};