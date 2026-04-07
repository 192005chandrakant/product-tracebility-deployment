const {
  validateStageDocumentEntries,
  parseStageDocumentsMeta,
  resolveStageDocumentEntries
} = require('../services/verification/stageDocumentContracts');

describe('stageDocumentContracts validation behavior', () => {
  test('allows empty registration documents when requireAtLeastOneFile is false', () => {
    const result = validateStageDocumentEntries({
      stage: 'Registered',
      documentsMeta: [],
      documentFiles: [],
      requireAtLeastOneFile: false,
      enforceRequiredFields: true
    });

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.entries).toEqual([]);
  });

  test('requires at least one registration document when requireAtLeastOneFile is true', () => {
    const result = validateStageDocumentEntries({
      stage: 'Registered',
      documentsMeta: [],
      documentFiles: [],
      requireAtLeastOneFile: true,
      enforceRequiredFields: true
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining(['Registration requires at least one uploaded stage document for AI verification.'])
    );
  });

  test('resolves and validates document metadata with matching file index', () => {
    const rawMeta = JSON.stringify([
      {
        stage: 'Processed',
        documentType: 'certificate',
        title: 'ISO Certificate',
        documentReference: 'CERT-001',
        issuingAuthority: 'Compliance Board',
        fileIndex: 0,
        requiresVerification: true
      }
    ]);

    const meta = parseStageDocumentsMeta(rawMeta);
    const files = [
      {
        originalname: 'cert.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('%PDF-1.7')
      }
    ];

    const resolved = resolveStageDocumentEntries({
      stage: 'Processed',
      documentsMeta: meta,
      documentFiles: files
    });

    expect(resolved.length).toBe(1);
    expect(resolved[0].meta.title).toBe('ISO Certificate');

    const validation = validateStageDocumentEntries({
      stage: 'Processed',
      documentsMeta: meta,
      documentFiles: files,
      requireAtLeastOneFile: false,
      enforceRequiredFields: true
    });

    expect(validation.valid).toBe(true);
    expect(validation.issues).toEqual([]);
    expect(validation.entries.length).toBe(1);
  });
});
