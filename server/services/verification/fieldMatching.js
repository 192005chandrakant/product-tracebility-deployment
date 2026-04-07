const { sanitizeText } = require('../ai/geminiClient');

function normalize(value) {
  return sanitizeText(String(value || ''), 300)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scorePair(expected, actual) {
  const e = normalize(expected);
  const a = normalize(actual);

  if (!e || !a) {
    return { score: 0, status: 'missing' };
  }

  if (e === a) {
    return { score: 100, status: 'exact' };
  }

  if (e.includes(a) || a.includes(e)) {
    return { score: 75, status: 'partial' };
  }

  const eWords = new Set(e.split(' ').filter(Boolean));
  const aWords = new Set(a.split(' ').filter(Boolean));
  const overlap = [...eWords].filter((word) => aWords.has(word)).length;
  const union = new Set([...eWords, ...aWords]).size || 1;
  const similarity = Math.round((overlap / union) * 100);

  if (similarity >= 60) {
    return { score: similarity, status: 'partial' };
  }

  return { score: similarity, status: 'mismatch' };
}

function evaluateFieldMatch(label, expected, actual) {
  const result = scorePair(expected, actual);
  const issues = [];

  if (result.status === 'missing') {
    issues.push(`${label} could not be confidently extracted from certificate.`);
  } else if (result.status === 'mismatch') {
    issues.push(`${label} does not match between product form and certificate.`);
  }

  return {
    label,
    expected: sanitizeText(String(expected || ''), 200),
    actual: sanitizeText(String(actual || ''), 200),
    score: result.score,
    status: result.status,
    issues
  };
}

function matchProductAgainstCertificate({ product = {}, extractedFields = {} }) {
  const nameMatch = evaluateFieldMatch('Product name', product.name, extractedFields.productName);
  const manufacturerMatch = evaluateFieldMatch('Manufacturer', product.manufacturer, extractedFields.manufacturer);
  const certificationTypeMatch = evaluateFieldMatch(
    'Certification type',
    product.certificationType,
    extractedFields.certificationType
  );

  const matches = [nameMatch, manufacturerMatch, certificationTypeMatch];
  const validScores = matches.map((item) => item.score);
  const averageScore = validScores.length
    ? Math.round(validScores.reduce((sum, value) => sum + value, 0) / validScores.length)
    : 0;

  let overall = 'pass';
  if (matches.some((item) => item.status === 'mismatch')) {
    overall = 'fail';
  } else if (matches.some((item) => item.status === 'missing' || item.status === 'partial')) {
    overall = 'warning';
  }

  return {
    overall,
    averageScore,
    fields: {
      productName: nameMatch,
      manufacturer: manufacturerMatch,
      certificationType: certificationTypeMatch
    },
    issues: matches.flatMap((item) => item.issues)
  };
}

module.exports = {
  matchProductAgainstCertificate
};
