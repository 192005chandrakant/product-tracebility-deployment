const { validateCertificateFile } = require('../services/verification/fileValidation');
const { matchProductAgainstCertificate } = require('../services/verification/fieldMatching');
const { computeVerificationRisk } = require('../services/verification/riskScoring');
const { decideVerificationOutcome } = require('../services/verification/decisionEngine');

function evaluateDecision({ fileValidation, aiAnalysis, fieldMatch, aiFailure = false, aiRecommendedAction = 'flagged' }) {
  const risk = computeVerificationRisk({
    fileValidation,
    aiAnalysis,
    fieldMatch,
    aiFailure
  });

  const decision = decideVerificationOutcome({
    riskScore: risk.riskScore,
    criticalFailures: risk.criticalFailures,
    aiFailed: aiFailure,
    aiRecommendedAction
  });

  return { risk, decision };
}

describe('verification pipeline deterministic outcomes', () => {
  test('fake certificate is blocked at file validation stage', () => {
    const fakeCertificate = {
      mimetype: 'image/png',
      size: 1024,
      buffer: Buffer.from('this-is-not-a-real-png')
    };

    const fileValidation = validateCertificateFile(fakeCertificate);

    expect(fileValidation.valid).toBe(false);
    expect(fileValidation.issues).toEqual(
      expect.arrayContaining(['Certificate file appears corrupted or has mismatched format signature.'])
    );

    const { risk, decision } = evaluateDecision({
      fileValidation,
      aiAnalysis: null,
      fieldMatch: null
    });

    expect(risk.riskScore).toBe(100);
    expect(decision.status).toBe('blocked');
  });

  test('missing extracted fields yields flagged (not blocked) outcome', () => {
    const fieldMatch = {
      overall: 'warning',
      averageScore: 0,
      fields: {
        productName: null,
        manufacturer: null,
        certificationType: null
      },
      issues: ['Field matching was skipped because AI extraction failed.']
    };

    const { risk, decision } = evaluateDecision({
      fileValidation: { valid: true, issues: [] },
      aiAnalysis: {
        structure: 'warning',
        languageQuality: 'warning',
        signaturePresence: 'unclear',
        logoConsistency: 'unclear',
        dateValidation: 'unclear',
        issues: ['Gemini verification service failed during certificate analysis.'],
        extractedFields: {},
        confidence: 0
      },
      fieldMatch,
      aiFailure: true,
      aiRecommendedAction: 'flagged'
    });

    expect(risk.criticalFailures).toEqual([]);
    expect(decision.status).toBe('flagged');
    expect(decision.reviewState).toBe('pending_review');
  });

  test('wrong manufacturer mismatch is blocked by rule engine', () => {
    const fieldMatch = matchProductAgainstCertificate({
      product: {
        name: 'Organic Turmeric Powder',
        manufacturer: 'Walmart Foods Pvt Ltd',
        certificationType: 'ISO 22000'
      },
      extractedFields: {
        productName: 'Organic Turmeric Powder',
        manufacturer: 'Unknown Vendor Inc',
        certificationType: 'ISO 22000'
      }
    });

    const { risk, decision } = evaluateDecision({
      fileValidation: { valid: true, issues: [] },
      aiAnalysis: {
        structure: 'pass',
        languageQuality: 'pass',
        signaturePresence: 'present',
        logoConsistency: 'pass',
        dateValidation: 'valid',
        issues: [],
        extractedFields: {},
        confidence: 90
      },
      fieldMatch
    });

    expect(fieldMatch.overall).toBe('fail');
    expect(risk.criticalFailures).toContain('field_mismatch');
    expect(decision.status).toBe('blocked');
  });

  test('expired certificate is blocked by critical date rule', () => {
    const { risk, decision } = evaluateDecision({
      fileValidation: { valid: true, issues: [] },
      aiAnalysis: {
        structure: 'pass',
        languageQuality: 'pass',
        signaturePresence: 'present',
        logoConsistency: 'pass',
        dateValidation: 'expired',
        issues: ['Expiry date has passed.'],
        extractedFields: {},
        confidence: 92
      },
      fieldMatch: {
        overall: 'pass',
        issues: []
      }
    });

    expect(risk.criticalFailures).toContain('expired_certificate');
    expect(decision.status).toBe('blocked');
    expect(decision.reviewState).toBe('rejected');
  });
});
