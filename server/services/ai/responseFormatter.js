const { sanitizeText } = require('./geminiClient');

const SECTION_ALIASES = {
  executiveSummary: ['executive summary', 'summary', 'overview'],
  keyFindings: ['key findings', 'findings', 'key points'],
  verificationChecklist: ['verification checklist', 'checklist', 'recommended checks'],
  importantNotes: ['important notes', 'notes', 'important considerations'],
  nextSteps: ['recommended next steps', 'next steps', 'actions', 'action items'],
  title: ['product title', 'title'],
  overview: ['overview', 'description', 'product overview'],
  keyHighlights: ['key highlights', 'highlights', 'high level highlights'],
  recommendedUseCases: ['recommended use cases', 'use cases', 'use cases and scenarios'],
  qualityStatement: ['quality statement', 'quality', 'statement'],
  risksOrOpportunities: ['risks / opportunities', 'risks or opportunities', 'risks', 'opportunities'],
  nextActions: ['recommended next actions', 'next actions', 'actions']
};

function parseStructuredJson(rawText) {
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

function stripCodeFences(rawText) {
  return String(rawText || '')
    .replace(/```(?:json|text)?/gi, '')
    .replace(/```/g, '')
    .trim();
}

function escapeRegExp(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findSectionStart(text, aliases) {
  for (const alias of aliases) {
    const pattern = new RegExp(`(?:^|\\n)\\s*${escapeRegExp(alias)}\\s*:`, 'i');
    const match = pattern.exec(text);
    if (match) {
      return match.index + match[0].length;
    }
  }
  return -1;
}

function extractSection(text, aliases) {
  const cleaned = stripCodeFences(text);
  const start = findSectionStart(cleaned, aliases);
  if (start === -1) {
    return '';
  }

  const tail = cleaned.slice(start);
  const nextHeadingRegex = /(?:\n\s*(?:##\s*)?[A-Za-z][A-Za-z0-9 /&()\-]{2,80}\s*:)/g;
  const nextHeading = nextHeadingRegex.exec(tail);
  const body = nextHeading ? tail.slice(0, nextHeading.index) : tail;
  return sanitizeText(body, 6000, { preserveLineBreaks: true }).replace(/^[:\s-]+/, '').trim();
}

function extractBulletItems(text, aliases) {
  const section = extractSection(text, aliases);
  if (!section) {
    return [];
  }

  return section
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 8);
}

function extractTextValue(text, aliases) {
  const section = extractSection(text, aliases);
  if (section) {
    return section.split(/\n+/)[0].trim();
  }

  return '';
}

function normalizeList(value, maxItems = 6) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => sanitizeText(String(item || ''), 260))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeSentence(value, fallback = 'Information not available.') {
  const sentence = sanitizeText(String(value || ''), 600);
  return sentence || fallback;
}

function isPlaceholderValue(value) {
  const cleaned = sanitizeText(String(value || ''), 240).toLowerCase();
  if (!cleaned) {
    return true;
  }

  return [
    'information not available',
    'not available',
    'n/a',
    'na',
    'none',
    'unknown',
    'not provided'
  ].includes(cleaned);
}

function normalizeMeaningfulList(value, maxItems = 6) {
  return normalizeList(value, maxItems).filter((item) => !isPlaceholderValue(item));
}

function splitKeywords(rawKeywords) {
  return sanitizeText(String(rawKeywords || ''), 1600)
    .split(/[;,|]/)
    .flatMap((chunk) => chunk.split(/\band\b/i))
    .map((item) => sanitizeText(item, 80))
    .filter(Boolean)
    .filter((item, index, arr) => arr.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index)
    .slice(0, 8);
}

function toTitleCase(value) {
  return sanitizeText(String(value || ''), 160)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildDescriptionFromKeywords({ keywords, tone }) {
  const list = splitKeywords(keywords);
  const core = list.length ? list : ['premium product'];
  const primary = core[0];
  const title = `${toTitleCase(primary)} Product Overview`;

  const toneGuidance = {
    professional: 'Presented in a clear and business-ready format.',
    friendly: 'Presented in an approachable and customer-friendly style.',
    technical: 'Presented with precision and operational clarity.',
    marketing: 'Presented with a value-driven and persuasive narrative.'
  };

  const overview = [
    `This product centers on ${primary.toLowerCase()} with practical market relevance.`,
    `Key attributes include ${core.slice(0, 4).join(', ')}.`,
    toneGuidance[sanitizeText(String(tone || ''), 40).toLowerCase()] || toneGuidance.professional
  ];

  const keyHighlights = [
    `Core specification focus: ${primary}.`,
    core[1] ? `Supporting attribute: ${core[1]}.` : 'Designed for reliable, repeatable quality outcomes.',
    core[2] ? `Differentiator: ${core[2]}.` : 'Suitable for clear product communication and cataloging.'
  ];

  const recommendedUseCases = [
    `Retail and catalog listings where ${primary.toLowerCase()} needs clear positioning.`,
    'Supply chain documentation and procurement briefs.',
    'Customer-facing product explainers and marketplace descriptions.'
  ];

  const qualityStatement = [
    'Quality claims should be validated against lab, certification, or supplier records before publication.',
    'Use this description as a professional draft and align final wording to verified compliance data.'
  ];

  return {
    title,
    overview,
    keyHighlights,
    recommendedUseCases,
    qualityStatement
  };
}

function formatGeneratedDescription(generatedFallback) {
  return [
    'Product Title:',
    `- ${generatedFallback.title}`,
    '',
    formatSection('Overview', generatedFallback.overview),
    '',
    formatSection('Key Highlights', generatedFallback.keyHighlights),
    '',
    formatSection('Recommended Use Cases', generatedFallback.recommendedUseCases),
    '',
    formatSection('Quality Statement', generatedFallback.qualityStatement)
  ].join('\n');
}

function containsPlaceholderLine(text) {
  return /(^|\n)\s*-\s*information not available\.?\s*($|\n)/i.test(String(text || ''));
}

function formatSection(title, items) {
  if (!items || !items.length) {
    return `${title}:\n- Information not available.`;
  }

  return `${title}:\n${items.map((item) => `- ${item}`).join('\n')}`;
}

function formatFallbackSections(rawText, sectionMap) {
  const cleaned = stripCodeFences(rawText);
  const sections = [];

  for (const [label, aliases] of Object.entries(sectionMap)) {
    const bulletItems = extractBulletItems(cleaned, aliases);
    if (bulletItems.length > 0 && bulletItems.some((item) => !isPlaceholderValue(item))) {
      sections.push(formatSection(label, bulletItems));
      continue;
    }

    const textValue = extractTextValue(cleaned, aliases);
    if (textValue && !isPlaceholderValue(textValue)) {
      sections.push(`${label}:\n- ${textValue}`);
      continue;
    }

    sections.push(`${label}:\n- Information not available.`);
  }

  return sections;
}

function objectToBullets(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value)
    .flatMap(([key, entry]) => {
      const label = sanitizeText(String(key), 80);
      if (Array.isArray(entry)) {
        const lines = normalizeList(entry, 6);
        return lines.length ? [`${label}: ${lines.join('; ')}`] : [];
      }

      if (entry && typeof entry === 'object') {
        const nested = objectToBullets(entry);
        return nested.length ? [`${label}:`, ...nested.map((line) => `  ${line}`)] : [];
      }

      const text = sanitizeText(String(entry || ''), 240);
      return text ? [`${label}: ${text}`] : [];
    })
    .filter(Boolean)
    .slice(0, 12);
}

function formatChatReply(rawText) {
  const parsed = parseStructuredJson(rawText);
  if (!parsed) {
    return formatFallbackSections(rawText, {
      'Executive Summary': SECTION_ALIASES.executiveSummary,
      'Key Findings': SECTION_ALIASES.keyFindings,
      'Verification Checklist': SECTION_ALIASES.verificationChecklist,
      'Important Notes': SECTION_ALIASES.importantNotes,
      'Recommended Next Steps': SECTION_ALIASES.nextSteps
    }).join('\n\n');
  }

  const executiveSummary = normalizeSentence(parsed.executiveSummary);
  const keyFindings = normalizeList(parsed.keyFindings);
  const verificationChecklist = normalizeList(parsed.verificationChecklist);
  const importantNotes = normalizeList(parsed.importantNotes);
  const nextSteps = normalizeList(parsed.nextSteps);
  const fallbackLines = objectToBullets(parsed);

  const finalKeyFindings = keyFindings.length ? keyFindings : fallbackLines;

  return [
    'Executive Summary:',
    `- ${executiveSummary}`,
    '',
    formatSection('Key Findings', finalKeyFindings),
    '',
    formatSection('Verification Checklist', verificationChecklist),
    '',
    formatSection('Important Notes', importantNotes),
    '',
    formatSection('Recommended Next Steps', nextSteps)
  ].join('\n');
}

function formatDescription(rawText, options = {}) {
  const generatedFallback = buildDescriptionFromKeywords({
    keywords: options.keywords,
    tone: options.tone
  });

  const parsed = parseStructuredJson(rawText);
  if (!parsed) {
    const extracted = formatFallbackSections(rawText, {
      'Product Title': SECTION_ALIASES.title,
      'Overview': SECTION_ALIASES.overview,
      'Key Highlights': SECTION_ALIASES.keyHighlights,
      'Recommended Use Cases': SECTION_ALIASES.recommendedUseCases,
      'Quality Statement': SECTION_ALIASES.qualityStatement
    }).join('\n\n');

    if (!containsPlaceholderLine(extracted)) {
      return extracted;
    }

    return formatGeneratedDescription(generatedFallback);
  }

  const title = isPlaceholderValue(parsed.title)
    ? generatedFallback.title
    : normalizeSentence(parsed.title, generatedFallback.title);

  const overview = Array.isArray(parsed.overview)
    ? normalizeMeaningfulList(parsed.overview, 4)
    : [normalizeSentence(parsed.overview, '')].filter((entry) => !isPlaceholderValue(entry));

  const keyHighlights = normalizeMeaningfulList(parsed.keyHighlights);
  const recommendedUseCases = normalizeMeaningfulList(parsed.recommendedUseCases);
  const qualityStatement = Array.isArray(parsed.qualityStatement)
    ? normalizeMeaningfulList(parsed.qualityStatement, 4)
    : [normalizeSentence(parsed.qualityStatement, '')].filter((entry) => !isPlaceholderValue(entry));

  const fallbackLines = objectToBullets(parsed);
  const meaningfulFallbackLines = fallbackLines.filter((entry) => !isPlaceholderValue(entry));

  const finalText = [
    'Product Title:',
    `- ${title}`,
    '',
    formatSection('Overview', overview.length ? overview : generatedFallback.overview),
    '',
    formatSection(
      'Key Highlights',
      keyHighlights.length
        ? keyHighlights
        : (meaningfulFallbackLines.length ? meaningfulFallbackLines : generatedFallback.keyHighlights)
    ),
    '',
    formatSection(
      'Recommended Use Cases',
      recommendedUseCases.length ? recommendedUseCases : generatedFallback.recommendedUseCases
    ),
    '',
    formatSection('Quality Statement', qualityStatement.length ? qualityStatement : generatedFallback.qualityStatement)
  ].join('\n');

  if (containsPlaceholderLine(finalText)) {
    return formatGeneratedDescription(generatedFallback);
  }

  return finalText;
}

function formatDashboardInsights(rawText) {
  const parsed = parseStructuredJson(rawText);
  if (!parsed) {
    return formatFallbackSections(rawText, {
      'Executive Summary': SECTION_ALIASES.executiveSummary,
      'Risks / Opportunities': SECTION_ALIASES.risksOrOpportunities,
      'Recommended Next Actions': SECTION_ALIASES.nextActions
    }).join('\n\n');
  }

  const executiveSummary = normalizeSentence(parsed.executiveSummary);
  const risksOrOpportunities = normalizeList(parsed.risksOrOpportunities);
  const nextActions = normalizeList(parsed.nextActions);
  const fallbackLines = objectToBullets(parsed);

  return [
    'Executive Summary:',
    `- ${executiveSummary}`,
    '',
    formatSection('Risks / Opportunities', risksOrOpportunities.length ? risksOrOpportunities : fallbackLines),
    '',
    formatSection('Recommended Next Actions', nextActions)
  ].join('\n');
}

module.exports = {
  formatChatReply,
  formatDescription,
  formatDashboardInsights
};
