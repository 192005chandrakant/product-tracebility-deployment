const { validateCertificateFile } = require('../services/verification/fileValidation');
const { computeVerificationRisk } = require('../services/verification/riskScoring');
const { decideVerificationOutcome } = require('../services/verification/decisionEngine');

function runCase(name, payload) {
  const risk = computeVerificationRisk(payload);
  const decision = decideVerificationOutcome({
    riskScore: risk.riskScore,
    criticalFailures: risk.criticalFailures,
    aiFailed: Boolean(payload.aiFailure),
    aiRecommendedAction: payload.aiRecommendedAction || 'flagged'
  });

  return {
    name,
    riskScore: risk.riskScore,
    status: decision.status,
    reviewState: decision.reviewState,
    reason: decision.reason,
    issues: risk.issues.slice(0, 6),
    criticalFailures: risk.criticalFailures
  };
}

function runFileValidationSmoke() {
  const fakeCertificate = {
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('not-a-real-png')
  };

  const invalidMime = {
    mimetype: 'text/plain',
    size: 1024,
    buffer: Buffer.from('hello')
  };

  return {
    fakeCertificate: validateCertificateFile(fakeCertificate),
    invalidMime: validateCertificateFile(invalidMime)
  };
}

function runDecisionSmoke() {
  const baseFileValidation = { valid: true, issues: [] };

  const missingFields = runCase('missing_fields', {
    fileValidation: baseFileValidation,
    aiAnalysis: {
      structure: 'warning',
      languageQuality: 'warning',
      signaturePresence: 'unclear',
      logoConsistency: 'unclear',
      dateValidation: 'missing',
      issues: ['Issuer and certificate ID missing.'],
      confidence: 40
    },
    fieldMatch: {
      overall: 'warning',
      issues: ['Product name could not be confidently extracted from certificate.']
    }
  });

  const wrongManufacturer = runCase('wrong_manufacturer', {
    fileValidation: baseFileValidation,
    aiAnalysis: {
      structure: 'pass',
      languageQuality: 'pass',
      signaturePresence: 'present',
      logoConsistency: 'pass',
      dateValidation: 'valid',
      issues: [],
      confidence: 82
    },
    fieldMatch: {
      overall: 'fail',
      issues: ['Manufacturer does not match between product form and certificate.']
    }
  });

  const expiredCertificate = runCase('expired_certificate', {
    fileValidation: baseFileValidation,
    aiAnalysis: {
      structure: 'pass',
      languageQuality: 'pass',
      signaturePresence: 'present',
      logoConsistency: 'pass',
      dateValidation: 'expired',
      issues: ['Expiry date has passed.'],
      confidence: 88
    },
    fieldMatch: {
      overall: 'pass',
      issues: []
    }
  });

  const safeCertificate = runCase('safe_certificate', {
    fileValidation: baseFileValidation,
    aiAnalysis: {
      structure: 'pass',
      languageQuality: 'pass',
      signaturePresence: 'present',
      logoConsistency: 'pass',
      dateValidation: 'valid',
      issues: [],
      confidence: 95
    },
    fieldMatch: {
      overall: 'pass',
      issues: []
    }
  });

  return {
    missingFields,
    wrongManufacturer,
    expiredCertificate,
    safeCertificate
  };
}

function main() {
  const report = {
    timestamp: new Date().toISOString(),
    fileValidation: runFileValidationSmoke(),
    ruleDecisions: runDecisionSmoke()
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
