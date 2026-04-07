function loadModuleWithMock({ strategy = 'flagged', callResult, callError }) {
  const originalStrategy = process.env.VERIFICATION_GEMINI_FAILURE_STRATEGY;
  process.env.VERIFICATION_GEMINI_FAILURE_STRATEGY = strategy;

  jest.resetModules();
  jest.doMock('../services/ai/geminiClient', () => ({
    callGeminiGenerateContent: callError
      ? jest.fn().mockRejectedValue(callError)
      : jest.fn().mockResolvedValue(callResult),
    sanitizeText: (value) => String(value || '').trim()
  }));

  const moduleUnderTest = require('../services/verification/geminiVerification');

  if (originalStrategy === undefined) {
    delete process.env.VERIFICATION_GEMINI_FAILURE_STRATEGY;
  } else {
    process.env.VERIFICATION_GEMINI_FAILURE_STRATEGY = originalStrategy;
  }

  return moduleUnderTest;
}

describe('geminiVerification strict contract and fallback policy', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('rejects payload that does not satisfy strict contract', async () => {
    const { analyzeCertificateWithGemini } = loadModuleWithMock({
      strategy: 'flagged',
      callResult: {
        text: JSON.stringify({
          structure: 'pass',
          confidence: 90,
          issues: []
        }),
        model: 'gemini-2.5-flash-lite'
      }
    });

    const result = await analyzeCertificateWithGemini({
      file: {
        mimetype: 'image/png',
        buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47])
      },
      productContext: {
        productName: 'Demo',
        manufacturer: 'Acme',
        certificationType: 'ISO 22000'
      }
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('invalid_ai_contract');
    expect(result.recommendedAction).toBe('flagged');
  });

  test('uses blocked strategy when Gemini API fails and policy is blocked', async () => {
    const { analyzeCertificateWithGemini } = loadModuleWithMock({
      strategy: 'blocked',
      callError: new Error('rate limit exceeded')
    });

    const result = await analyzeCertificateWithGemini({
      file: {
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4')
      },
      productContext: {
        productName: 'Demo',
        manufacturer: 'Acme',
        certificationType: 'ISO 22000'
      }
    });

    expect(result.success).toBe(false);
    expect(result.reason).toBe('gemini_api_error');
    expect(result.recommendedAction).toBe('blocked');
  });

  test('returns normalized analysis on valid strict JSON payload', async () => {
    const { analyzeCertificateWithGemini } = loadModuleWithMock({
      strategy: 'flagged',
      callResult: {
        text: JSON.stringify({
          structure: 'pass',
          languageQuality: 'warning',
          signaturePresence: 'present',
          logoConsistency: 'unclear',
          dateValidation: 'valid',
          issues: ['minor spacing issue'],
          extractedFields: {
            productName: 'Organic Turmeric Powder',
            manufacturer: 'Walmart Foods Pvt Ltd',
            certificationType: 'ISO 22000'
          },
          confidence: 87
        }),
        model: 'gemini-2.5-flash-lite'
      }
    });

    const result = await analyzeCertificateWithGemini({
      file: {
        mimetype: 'image/jpeg',
        buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9])
      },
      productContext: {
        productName: 'Organic Turmeric Powder',
        manufacturer: 'Walmart Foods Pvt Ltd',
        certificationType: 'ISO 22000'
      }
    });

    expect(result.success).toBe(true);
    expect(result.analysis.structure).toBe('pass');
    expect(result.analysis.languageQuality).toBe('warning');
    expect(result.analysis.confidence).toBe(87);
    expect(result.analysis.extractedFields.manufacturer).toBe('Walmart Foods Pvt Ltd');
  });
});
