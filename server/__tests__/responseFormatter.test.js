const { formatDescription } = require('../services/ai/responseFormatter');

describe('responseFormatter.formatDescription', () => {
  test('replaces placeholder-only output with keyword-driven professional fallback', () => {
    const raw = [
      'Product Title:',
      '- Information not available.',
      '',
      'Overview:',
      '- Information not available.',
      '',
      'Key Highlights:',
      '- Information not available.',
      '',
      'Recommended Use Cases:',
      '- Information not available.',
      '',
      'Quality Statement:',
      '- Information not available.'
    ].join('\n');

    const result = formatDescription(raw, {
      keywords: 'organic coffee, arabica, single origin',
      tone: 'professional'
    });

    expect(result.toLowerCase()).not.toContain('information not available');
    expect(result).toContain('Product Title:');
    expect(result).toContain('Overview:');
    expect(result).toContain('Key Highlights:');
    expect(result).toContain('Recommended Use Cases:');
    expect(result).toContain('Quality Statement:');
  });
});
