function safeJsonParse(value, fallback = null) {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value || '').toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function sanitizeText(value, maxLen = 240) {
  return String(value || '').trim().slice(0, maxLen);
}

function parseDateOrNull(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function extractVerificationReason({ decision, aiVerification }) {
  if (aiVerification && !aiVerification.success) {
    const aiIssue = Array.isArray(aiVerification.issues)
      ? String(aiVerification.issues.find((item) => String(item || '').trim()) || '').trim()
      : '';

    if (aiIssue) {
      return aiIssue;
    }

    const aiReason = String(aiVerification.reason || '').trim();
    if (aiReason) {
      return aiReason;
    }
  }

  if (decision && decision.reason) {
    return decision.reason;
  }

  return null;
}

function parseStageDocumentsMeta(rawMeta) {
  const parsed = Array.isArray(rawMeta) ? rawMeta : safeJsonParse(rawMeta, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.map((doc) => ({
    stage: sanitizeText(doc.stage, 80),
    documentType: sanitizeText(doc.documentType, 80) || 'other',
    title: sanitizeText(doc.title, 140),
    standardCode: sanitizeText(doc.standardCode, 140),
    documentReference: sanitizeText(doc.documentReference, 160),
    issuingAuthority: sanitizeText(doc.issuingAuthority, 160),
    issuerCountry: sanitizeText(doc.issuerCountry, 120),
    complianceScope: sanitizeText(doc.complianceScope, 200),
    documentVersion: sanitizeText(doc.documentVersion, 80),
    certificateNumber: sanitizeText(doc.certificateNumber, 160),
    batchNumber: sanitizeText(doc.batchNumber, 120),
    lotNumber: sanitizeText(doc.lotNumber, 120),
    issueDate: parseDateOrNull(doc.issueDate),
    expiryDate: parseDateOrNull(doc.expiryDate),
    notes: sanitizeText(doc.notes, 1200),
    verificationNotes: sanitizeText(doc.verificationNotes, 1200),
    requiresVerification: normalizeBoolean(doc.requiresVerification),
    fileIndex: Number.isInteger(Number(doc.fileIndex)) ? Number(doc.fileIndex) : null
  }));
}

function resolveStageDocumentEntries({ stage, documentsMeta = [], documentFiles = [] }) {
  if (!Array.isArray(documentsMeta) || !Array.isArray(documentFiles)) {
    return [];
  }

  return documentsMeta
    .map((meta) => {
      const resolvedStage = meta.stage || stage;
      if (resolvedStage !== stage) {
        return null;
      }

      const file = Number.isInteger(meta.fileIndex) ? documentFiles[meta.fileIndex] : null;
      if (!file) {
        return null;
      }

      return {
        meta,
        resolvedStage,
        file
      };
    })
    .filter(Boolean);
}

function validateStageDocumentEntries({
  stage,
  documentsMeta = [],
  documentFiles = [],
  requireAtLeastOneFile = false,
  enforceRequiredFields = true
}) {
  const issues = [];
  const resolvedEntries = resolveStageDocumentEntries({
    stage,
    documentsMeta,
    documentFiles
  });

  if (requireAtLeastOneFile && resolvedEntries.length === 0) {
    issues.push('Registration requires at least one uploaded stage document for AI verification.');
  }

  resolvedEntries.forEach(({ meta }, index) => {
    const row = index + 1;

    if (enforceRequiredFields) {
      if (!sanitizeText(meta.title, 140)) {
        issues.push(`Document ${row}: title is required.`);
      }

      if (!sanitizeText(meta.documentReference, 160)) {
        issues.push(`Document ${row}: document reference is required.`);
      }

      if (!sanitizeText(meta.issuingAuthority, 160)) {
        issues.push(`Document ${row}: issuing authority is required.`);
      }
    }

    if (meta.issueDate && meta.expiryDate && meta.issueDate > meta.expiryDate) {
      issues.push(`Document ${row}: expiry date must be on or after issue date.`);
    }

    if (!sanitizeText(meta.documentType, 80)) {
      issues.push(`Document ${row}: document type is required.`);
    }
  });

  return {
    valid: issues.length === 0,
    issues,
    entries: resolvedEntries
  };
}

module.exports = {
  safeJsonParse,
  normalizeBoolean,
  sanitizeText,
  parseDateOrNull,
  extractVerificationReason,
  parseStageDocumentsMeta,
  resolveStageDocumentEntries,
  validateStageDocumentEntries
};
