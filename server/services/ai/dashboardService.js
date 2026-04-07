const { callGeminiGenerateContent, sanitizeText } = require('./geminiClient');

function isPlaceholderText(value) {
  const cleaned = sanitizeText(String(value || ''), 260).toLowerCase();
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

function normalizeLine(item, fallback) {
  const value = sanitizeText(String(item || ''), 260);
  return value || fallback;
}

function normalizeSectionLines(value, minLines, fallbackLine) {
  const lines = Array.isArray(value)
    ? value.map((item) => sanitizeText(String(item || ''), 260)).filter(Boolean)
    : [];

  const meaningfulLines = lines.filter((line) => !isPlaceholderText(line));

  if (meaningfulLines.length >= minLines) {
    return meaningfulLines.slice(0, 5);
  }

  return [fallbackLine];
}

function summarizeCounts(items = [], key, topN = 3) {
  const counter = {};

  for (const item of items) {
    const label = sanitizeText(String((item && item[key]) || ''), 120) || 'Unknown';
    counter[label] = (counter[label] || 0) + 1;
  }

  return Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([label, count]) => ({ label, count }));
}

function buildDashboardFacts({ products, activeTab, searchQuery, selectedStage, sortBy }) {
  const normalizedProducts = normalizeProducts(products);
  const stageCounts = countStages(products);
  const withDescription = normalizedProducts.filter((item) => item.hasDescription).length;
  const withCertificate = normalizedProducts.filter((item) => item.hasCertificate).length;
  const missingDescription = normalizedProducts.length - withDescription;
  const missingCertificate = normalizedProducts.length - withCertificate;

  const topStages = Object.entries(stageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([stage, count]) => ({ stage, count }));

  const topOrigins = summarizeCounts(normalizedProducts, 'origin', 3);
  const topManufacturers = summarizeCounts(normalizedProducts, 'manufacturer', 3);

  return {
    context: {
      activeTab: sanitizeText(String(activeTab || 'my-products'), 40),
      searchQuery: sanitizeText(String(searchQuery || ''), 120),
      selectedStage: sanitizeText(String(selectedStage || 'all'), 80),
      sortBy: sanitizeText(String(sortBy || 'name'), 40)
    },
    counts: {
      total: normalizedProducts.length,
      withDescription,
      withCertificate,
      missingDescription,
      missingCertificate
    },
    topStages,
    topOrigins,
    topManufacturers,
    stageCounts,
    products: normalizedProducts
  };
}

function buildLocalFallbackInsights(facts) {
  const total = facts.counts.total;
  const descCoverage = total ? Math.round((facts.counts.withDescription / total) * 100) : 0;
  const certCoverage = total ? Math.round((facts.counts.withCertificate / total) * 100) : 0;
  const topStageText = facts.topStages.length
    ? facts.topStages.map((entry) => `${entry.stage} (${entry.count})`).join(', ')
    : 'No stage distribution available';

  const topOriginText = facts.topOrigins.length
    ? facts.topOrigins.map((entry) => `${entry.label} (${entry.count})`).join(', ')
    : 'Origin data not available';

  const topManufacturerText = facts.topManufacturers.length
    ? facts.topManufacturers.map((entry) => `${entry.label} (${entry.count})`).join(', ')
    : 'Manufacturer data not available';

  const executiveSummary = [
    `The current dashboard view contains ${total} products in the ${facts.context.activeTab || 'active'} tab.`,
    `Data completeness is ${descCoverage}% for product descriptions and ${certCoverage}% for certificate references.`,
    `Top stage concentration: ${topStageText}.`
  ];

  const risksOrOpportunities = [
    facts.counts.missingDescription > 0
      ? `${facts.counts.missingDescription} products are missing descriptions, reducing search quality and trust.`
      : 'Description coverage is complete, enabling stronger catalog quality.',
    facts.counts.missingCertificate > 0
      ? `${facts.counts.missingCertificate} products are missing certificate references, increasing compliance review effort.`
      : 'Certificate references are available for all visible products.',
    `Geographic concentration signal: ${topOriginText}. Supplier concentration signal: ${topManufacturerText}.`
  ];

  const recommendedNextActions = [
    facts.counts.missingDescription > 0
      ? 'Prioritize description completion for products missing narrative fields, starting with high-traffic SKUs.'
      : 'Maintain description quality by enforcing mandatory description validation at product creation.',
    facts.counts.missingCertificate > 0
      ? 'Launch a certificate backfill sprint and block stage progression for products without valid certificate links.'
      : 'Add automated certificate freshness checks and reminders for upcoming expiries.',
    'Set weekly dashboard KPIs: description coverage >= 95%, certificate coverage >= 95%, and stage distribution anomaly alerts.'
  ];

  return {
    executiveSummary,
    risksOrOpportunities,
    recommendedNextActions
  };
}

function extractInsightsFromAiPayload(payload, fallbackSections) {
  if (!payload || typeof payload !== 'object') {
    return fallbackSections;
  }

  const executiveSummary = normalizeSectionLines(
    payload.executiveSummary,
    1,
    fallbackSections.executiveSummary[0]
  );
  const risksOrOpportunities = normalizeSectionLines(
    payload.risksOrOpportunities,
    1,
    fallbackSections.risksOrOpportunities[0]
  );
  const recommendedNextActions = normalizeSectionLines(
    payload.recommendedNextActions,
    1,
    fallbackSections.recommendedNextActions[0]
  );

  return {
    executiveSummary,
    risksOrOpportunities,
    recommendedNextActions
  };
}

function sectionsToText(sections) {
  return [
    'Executive Summary:',
    ...sections.executiveSummary.map((item) => `- ${normalizeLine(item, 'Summary unavailable.')}`),
    '',
    'Risks / Opportunities:',
    ...sections.risksOrOpportunities.map((item) => `- ${normalizeLine(item, 'Risk analysis unavailable.')}`),
    '',
    'Recommended Next Actions:',
    ...sections.recommendedNextActions.map((item) => `- ${normalizeLine(item, 'Action recommendations unavailable.')}`)
  ].join('\n');
}

function normalizeProducts(products = []) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.map((product) => ({
    productId: sanitizeText(String(product && product.productId ? product.productId : ''), 80),
    name: sanitizeText(String(product && product.name ? product.name : 'Unnamed product'), 120),
    description: sanitizeText(String(product && product.description ? product.description : 'information not available'), 220),
    origin: sanitizeText(String(product && product.origin ? product.origin : 'information not available'), 120),
    manufacturer: sanitizeText(String(product && product.manufacturer ? product.manufacturer : 'information not available'), 120),
    stage: sanitizeText(
      Array.isArray(product && product.stages) && product.stages.length
        ? String(product.stages[product.stages.length - 1])
        : 'No Status',
      80
    ),
    hasDescription: Boolean(product && product.description && String(product.description).trim()),
    hasCertificate: Boolean(product && (product.certificationHash || product.blockchainRefHash || product.certFile))
  }));
}

function countStages(products = []) {
  return products.reduce((accumulator, product) => {
    const stage = Array.isArray(product.stages) && product.stages.length
      ? String(product.stages[product.stages.length - 1])
      : 'No Status';
    accumulator[stage] = (accumulator[stage] || 0) + 1;
    return accumulator;
  }, {});
}

function buildDashboardInsightsPrompt({ products, activeTab, searchQuery, selectedStage, sortBy }) {
  const facts = buildDashboardFacts({ products, activeTab, searchQuery, selectedStage, sortBy });

  return [
    'You are a senior product operations analyst for a blockchain traceability dashboard.',
    'Generate concise, executive-grade insights for decision making.',
    'Never use placeholders such as information not available, unknown, or N/A.',
    'If evidence is weak, use cautious wording and still provide practical actions.',
    '',
    'Dashboard context:',
    `- Active Tab: ${facts.context.activeTab || 'my-products'}`,
    `- Search Query: ${facts.context.searchQuery || 'none'}`,
    `- Stage Filter: ${facts.context.selectedStage || 'all'}`,
    `- Sort Mode: ${facts.context.sortBy || 'name'}`,
    `- Visible Products: ${facts.counts.total}`,
    `- Stage Distribution: ${sanitizeText(JSON.stringify(facts.stageCounts), 400)}`,
    `- Description Coverage: ${facts.counts.withDescription}/${facts.counts.total}`,
    `- Certificate Coverage: ${facts.counts.withCertificate}/${facts.counts.total}`,
    '',
    'Visible product sample:',
    facts.products.length ? facts.products.slice(0, 20).map((product) => (
      `- ${product.productId} | ${product.name} | stage:${product.stage} | origin:${product.origin} | manufacturer:${product.manufacturer} | hasDescription:${product.hasDescription ? 'yes' : 'no'} | hasCertificate:${product.hasCertificate ? 'yes' : 'no'}`
    )).join('\n') : 'No visible products in the current view.',
    '',
    'Respond in strict JSON only using this schema:',
    '{',
    '  "executiveSummary": ["...", "...", "..."],',
    '  "risksOrOpportunities": ["...", "...", "..."],',
    '  "recommendedNextActions": ["...", "...", "..."]',
    '}',
    'Rules:',
    '- 2 to 4 bullets per section.',
    '- Every bullet must be concrete and action-oriented.',
    '- Include at least one metric in executiveSummary and one in recommendedNextActions.',
    '- Do not include markdown or any text outside JSON.'
  ].join('\n');
}

async function generateDashboardInsights({ products, activeTab, searchQuery, selectedStage, sortBy }) {
  const facts = buildDashboardFacts({ products, activeTab, searchQuery, selectedStage, sortBy });
  const fallbackSections = buildLocalFallbackInsights(facts);
  const prompt = buildDashboardInsightsPrompt({ products, activeTab, searchQuery, selectedStage, sortBy });

  let source = 'fallback';
  let model = null;
  let sections = fallbackSections;

  try {
    const result = await callGeminiGenerateContent(prompt, {
      temperature: 0.2,
      maxOutputTokens: 900,
      responseMimeType: 'application/json'
    });

    const parsed = parseStructuredJson(result.text || '');
    sections = extractInsightsFromAiPayload(parsed, fallbackSections);
    source = 'ai';
    model = result.model;
  } catch (error) {
    sections = fallbackSections;
  }

  const insightsText = sectionsToText(sections);

  return {
    summary: sections.executiveSummary[0],
    recommendations: sections.recommendedNextActions,
    sections,
    insights: insightsText,
    source,
    model,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalProducts: facts.counts.total,
      descriptionCoverage: facts.counts.total ? Math.round((facts.counts.withDescription / facts.counts.total) * 100) : 0,
      certificateCoverage: facts.counts.total ? Math.round((facts.counts.withCertificate / facts.counts.total) * 100) : 0
    }
  };
}


module.exports = {
  normalizeProducts,
  countStages,
  buildDashboardFacts,
  buildLocalFallbackInsights,
  buildDashboardInsightsPrompt,
  generateDashboardInsights
};
