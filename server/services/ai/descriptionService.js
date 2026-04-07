const { callGeminiGenerateContent, sanitizeText } = require('./geminiClient');
const { formatDescription } = require('./responseFormatter');

const ALLOWED_TONES = ['professional', 'friendly', 'technical', 'marketing'];
const DEFAULT_TONE = 'professional';
const MAX_KEYWORDS_LENGTH = 1200;

function normalizeTone(tone) {
  const cleanedTone = sanitizeText(String(tone || ''), 40).toLowerCase();
  return ALLOWED_TONES.includes(cleanedTone) ? cleanedTone : DEFAULT_TONE;
}

function normalizeKeywords(keywords) {
  if (Array.isArray(keywords)) {
    const merged = keywords
      .map((item) => sanitizeText(String(item || ''), 120))
      .filter(Boolean)
      .join(', ');
    return sanitizeText(merged, MAX_KEYWORDS_LENGTH);
  }

  return sanitizeText(String(keywords || ''), MAX_KEYWORDS_LENGTH);
}

function buildDescriptionPrompt({ keywords, tone }) {
  const cleanedKeywords = normalizeKeywords(keywords);

  if (!cleanedKeywords) {
    throw new Error('Keywords are required');
  }

  const normalizedTone = normalizeTone(tone);

  return [
    'Generate a product description in strict JSON format.',
    'Do not return markdown or prose outside JSON.',
    '',
    'Input:',
    `Keywords: ${cleanedKeywords}`,
    `Tone: ${normalizedTone}`,
    '',
    'Return this JSON schema exactly:',
    '{',
    '  "title": "string",',
    '  "overview": ["string", "string"],',
    '  "keyHighlights": ["string", "string", "string"],',
    '  "recommendedUseCases": ["string", "string"],',
    '  "qualityStatement": ["string", "string"]',
    '}',
    '',
    'Requirements:',
    '- Write in the requested tone.',
    '- Keep language concise, professional, and specific.',
    '- Avoid placeholder lines such as "Information not available".',
    '- If exact context is missing, infer practical and safe generic statements from the keywords.',
    '- Do not fabricate verifiable claims (certification IDs, legal approvals, lab values).'
  ].join('\n');
}

async function generateProductDescription({ keywords, tone }) {
  const prompt = buildDescriptionPrompt({ keywords, tone });

  const result = await callGeminiGenerateContent(prompt, {
    temperature: 0.4,
    maxOutputTokens: 500,
    responseMimeType: 'application/json'
  });

  return {
    description: formatDescription(result.text || '', { keywords, tone }),
    tone: normalizeTone(tone),
    model: result.model
  };
}

module.exports = {
  ALLOWED_TONES,
  DEFAULT_TONE,
  normalizeTone,
  normalizeKeywords,
  buildDescriptionPrompt,
  generateProductDescription
};
