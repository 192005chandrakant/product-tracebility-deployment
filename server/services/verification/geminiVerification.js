const { callGeminiGenerateContent, sanitizeText } = require('../ai/geminiClient');

const GEMINI_FAILURE_STRATEGY = ['flagged', 'blocked'].includes(
  String(process.env.VERIFICATION_GEMINI_FAILURE_STRATEGY || '').toLowerCase()
)
  ? String(process.env.VERIFICATION_GEMINI_FAILURE_STRATEGY).toLowerCase()
  : 'flagged';

function parseJsonFromText(rawText) {
  const cleaned = sanitizeText(String(rawText || ''), 20000, { preserveLineBreaks: true });
  if (!cleaned) {
    return null;
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end <= start) {
      return null;
    }

    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch (innerError) {
      return null;
    }
  }
}

function normalizeEnum(value, allowed, fallback) {
  const normalized = String(value || '').toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function normalizeAnalysisPayload(payload = {}) {
  const structure = normalizeEnum(payload.structure, ['pass', 'warning', 'fail'], 'warning');
  const languageQuality = normalizeEnum(payload.languageQuality, ['pass', 'warning', 'fail'], 'warning');
  const signaturePresence = normalizeEnum(payload.signaturePresence, ['present', 'missing', 'unclear'], 'unclear');
  const logoConsistency = normalizeEnum(payload.logoConsistency, ['pass', 'warning', 'fail', 'unclear'], 'unclear');
  const dateValidation = normalizeEnum(payload.dateValidation, ['valid', 'expired', 'missing', 'unclear'], 'unclear');

  const issues = Array.isArray(payload.issues)
    ? payload.issues.map((item) => sanitizeText(String(item || ''), 260)).filter(Boolean).slice(0, 12)
    : [];

  const extractedFields = payload.extractedFields && typeof payload.extractedFields === 'object'
    ? {
        productName: sanitizeText(String(payload.extractedFields.productName || ''), 200),
        manufacturer: sanitizeText(String(payload.extractedFields.manufacturer || ''), 200),
        certificationType: sanitizeText(String(payload.extractedFields.certificationType || ''), 200),
        issuer: sanitizeText(String(payload.extractedFields.issuer || ''), 200),
        certificateId: sanitizeText(String(payload.extractedFields.certificateId || ''), 120),
        issueDate: sanitizeText(String(payload.extractedFields.issueDate || ''), 80),
        expiryDate: sanitizeText(String(payload.extractedFields.expiryDate || ''), 80)
      }
    : {};

  const confidenceNumeric = Number(payload.confidence);
  const confidence = Number.isFinite(confidenceNumeric)
    ? Math.max(0, Math.min(100, Math.round(confidenceNumeric)))
    : 0;

  return {
    structure,
    languageQuality,
    signaturePresence,
    logoConsistency,
    dateValidation,
    issues,
    extractedFields,
    confidence
  };
}

function isStrictAnalysisContractValid(payload) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const requiredEnums = {
    structure: ['pass', 'warning', 'fail'],
    languageQuality: ['pass', 'warning', 'fail'],
    signaturePresence: ['present', 'missing', 'unclear'],
    logoConsistency: ['pass', 'warning', 'fail', 'unclear'],
    dateValidation: ['valid', 'expired', 'missing', 'unclear']
  };

  return Object.entries(requiredEnums).every(([key, allowed]) => {
    const rawValue = payload[key];
    if (typeof rawValue !== 'string') {
      return false;
    }

    const value = String(rawValue).toLowerCase();
    return allowed.includes(value);
  });
}

function normalizeGeminiFailureIssue(message) {
  const normalized = String(message || '').toLowerCase();

  if (normalized.includes('quota') || normalized.includes('rate limit') || normalized.includes('billing')) {
    return 'Gemini verification quota was exhausted during certificate analysis.';
  }

  if (normalized.includes('timed out')) {
    return 'Gemini verification timed out during certificate analysis.';
  }

  if (normalized.includes('malformed')) {
    return 'Gemini returned an unreadable verification payload.';
  }

  return 'Gemini verification service failed during certificate analysis.';
}

function buildGeminiCertificatePrompt(productContext = {}) {
  const productName = sanitizeText(String(productContext.productName || ''), 200) || 'not provided';
  const manufacturer = sanitizeText(String(productContext.manufacturer || ''), 200) || 'not provided';
  const certificationType = sanitizeText(String(productContext.certificationType || ''), 200) || 'not provided';

  return [
    'You are an expert certificate verification analyst.',
    'Analyze the attached certificate image/document for authenticity signals.',
    '',
    'Product context:',
    `- Product Name: ${productName}`,
    `- Manufacturer: ${manufacturer}`,
    `- Certification Type: ${certificationType}`,
    '',
    'Checks to perform:',
    '- Structure validity and completeness',
    '- Presence of issuer, certificate ID, and signature/seal',
    '- Language professionalism and consistency',
    '- Logo/branding consistency (if visible)',
    '- Date validity (issue/expiry signals)',
    '',
    'Return ONLY valid JSON (no markdown, no extra text):',
    '{',
    '  "structure": "pass|warning|fail",',
    '  "languageQuality": "pass|warning|fail",',
    '  "signaturePresence": "present|missing|unclear",',
    '  "logoConsistency": "pass|warning|fail|unclear",',
    '  "dateValidation": "valid|expired|missing|unclear",',
    '  "issues": ["..."],',
    '  "extractedFields": {',
    '    "productName": "",',
    '    "manufacturer": "",',
    '    "certificationType": "",',
    '    "issuer": "",',
    '    "certificateId": "",',
    '    "issueDate": "",',
    '    "expiryDate": ""',
    '  },',
    '  "confidence": 0',
    '}'
  ].join('\n');
}

async function analyzeCertificateWithGemini({ file, productContext = {} }) {
  if (!file || !Buffer.isBuffer(file.buffer) || !file.buffer.length) {
    return {
      success: false,
      recommendedAction: 'blocked',
      issues: ['Certificate file buffer is missing for AI verification.'],
      reason: 'invalid_input'
    };
  }

  const prompt = buildGeminiCertificatePrompt(productContext);

  try {
    const result = await callGeminiGenerateContent('', {
      temperature: 0,
      maxOutputTokens: 900,
      responseMimeType: 'application/json',
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: String(file.mimetype || 'application/octet-stream'),
            data: file.buffer.toString('base64')
          }
        }
      ]
    });

    const parsed = parseJsonFromText(result.text);
    if (!parsed) {
      return {
        success: false,
        recommendedAction: GEMINI_FAILURE_STRATEGY,
        issues: [normalizeGeminiFailureIssue('malformed verification payload')],
        reason: 'malformed_ai_payload',
        model: result.model
      };
    }

    if (!isStrictAnalysisContractValid(parsed)) {
      return {
        success: false,
        recommendedAction: GEMINI_FAILURE_STRATEGY,
        issues: ['Gemini returned a payload that did not satisfy the verification JSON contract.'],
        reason: 'invalid_ai_contract',
        model: result.model
      };
    }

    const normalized = normalizeAnalysisPayload(parsed);

    return {
      success: true,
      model: result.model,
      analysis: normalized
    };
  } catch (error) {
    return {
      success: false,
      recommendedAction: GEMINI_FAILURE_STRATEGY,
      issues: [normalizeGeminiFailureIssue(error.message || 'Gemini verification failed')],
      reason: 'gemini_api_error'
    };
  }
}

module.exports = {
  analyzeCertificateWithGemini,
  buildGeminiCertificatePrompt,
  normalizeAnalysisPayload,
  isStrictAnalysisContractValid,
  GEMINI_FAILURE_STRATEGY
};
