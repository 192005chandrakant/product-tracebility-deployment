const {
  normalizeTone,
  normalizeKeywords,
  buildDescriptionPrompt
} = require('../services/ai/descriptionService');

describe('descriptionService input normalization', () => {
  test('defaults invalid tone to professional', () => {
    expect(normalizeTone('casual')).toBe('professional');
    expect(normalizeTone('')).toBe('professional');
  });

  test('trims and limits long keyword input', () => {
    const longInput = `${'a'.repeat(1500)}   `;
    const normalized = normalizeKeywords(longInput);

    expect(normalized.length).toBeLessThanOrEqual(1200);
    expect(normalized).toBe(normalized.trim());
  });

  test('throws when keywords are empty after normalization', () => {
    expect(() => buildDescriptionPrompt({ keywords: '   ', tone: 'friendly' })).toThrow(
      'Keywords are required'
    );
  });
});
