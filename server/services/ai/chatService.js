const { callGeminiGenerateContent, sanitizeText } = require('./geminiClient');
const { formatChatReply } = require('./responseFormatter');

const MAX_QUESTION_LENGTH = 800;
const MAX_CHAT_TURNS = 8;

function normalizeDate(value) {
  if (!value) {
    return 'information not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return sanitizeText(String(value), 64) || 'information not available';
  }

  return date.toISOString();
}

function normalizeProductContext(product = {}) {
  const stageEvents = Array.isArray(product.stageEvents)
    ? product.stageEvents
        .slice(-8)
        .map((event) => {
          const documents = Array.isArray(event && event.documents)
            ? event.documents
                .slice(0, 5)
                .map((doc) => ({
                  type: sanitizeText(doc && doc.documentType ? String(doc.documentType) : 'other', 80),
                  title: sanitizeText(doc && doc.title ? String(doc.title) : 'information not available', 120),
                  reference: sanitizeText(doc && doc.documentReference ? String(doc.documentReference) : 'information not available', 120),
                  issuingAuthority: sanitizeText(doc && doc.issuingAuthority ? String(doc.issuingAuthority) : 'information not available', 120),
                  certificateNumber: sanitizeText(doc && doc.certificateNumber ? String(doc.certificateNumber) : 'information not available', 120),
                  uploadedAt: normalizeDate(doc && doc.uploadedAt),
                  verificationStatus: sanitizeText(
                    doc && doc.verification && doc.verification.status ? String(doc.verification.status) : 'information not available',
                    40
                  )
                }))
            : [];

          return {
            stage: sanitizeText(event && event.stage ? String(event.stage) : 'information not available', 120),
            location: sanitizeText(event && event.location ? String(event.location) : 'information not available', 120),
            stageNotes: sanitizeText(event && event.stageNotes ? String(event.stageNotes) : 'information not available', 600),
            recordedAt: normalizeDate(event && event.recordedAt),
            blockchainTxHash: sanitizeText(event && event.blockchainTxHash ? String(event.blockchainTxHash) : 'information not available', 180),
            verificationSummary: {
              status: sanitizeText(
                event && event.verificationSummary && event.verificationSummary.status
                  ? String(event.verificationSummary.status)
                  : 'information not available',
                40
              ),
              reviewState: sanitizeText(
                event && event.verificationSummary && event.verificationSummary.reviewState
                  ? String(event.verificationSummary.reviewState)
                  : 'information not available',
                60
              ),
              riskScore:
                typeof (event && event.verificationSummary && event.verificationSummary.riskScore) === 'number'
                  ? event.verificationSummary.riskScore
                  : 'information not available',
              reason: sanitizeText(
                event && event.verificationSummary && event.verificationSummary.reason
                  ? String(event.verificationSummary.reason)
                  : 'information not available',
                280
              )
            },
            documents
          };
        })
    : [];

  const blockchainEvents = Array.isArray(product.blockchainEvents)
    ? product.blockchainEvents
        .slice(-6)
        .map((event) => ({
          action: sanitizeText(event && event.action ? String(event.action) : 'information not available', 80),
          stage: sanitizeText(event && event.stage ? String(event.stage) : 'information not available', 120),
          status: sanitizeText(event && event.status ? String(event.status) : 'information not available', 40),
          txHash: sanitizeText(event && event.txHash ? String(event.txHash) : 'information not available', 180),
          blockNumber:
            typeof (event && event.blockNumber) === 'number' ? event.blockNumber : 'information not available',
          recordedAt: normalizeDate(event && event.recordedAt)
        }))
    : [];

  return {
    productId: sanitizeText(product.productId || 'information not available', 120),
    name: sanitizeText(product.name || 'information not available', 200),
    description: sanitizeText(product.description || 'information not available', 1200),
    certifications: sanitizeText(
      product.certificationHash || product.blockchainRefHash || 'information not available',
      500
    ),
    origin: sanitizeText(product.origin || 'information not available', 200),
    manufacturer: sanitizeText(product.manufacturer || 'information not available', 200),
    blockchainStatus: sanitizeText(product.blockchainStatus || 'information not available', 60),
    blockchainTx: sanitizeText(product.blockchainTx || 'information not available', 200),
    blockchainUpdatedAt: normalizeDate(product.blockchainUpdatedAt),
    verification: {
      status: sanitizeText(
        product && product.verification && product.verification.status
          ? String(product.verification.status)
          : 'information not available',
        40
      ),
      reviewState: sanitizeText(
        product && product.verification && product.verification.reviewState
          ? String(product.verification.reviewState)
          : 'information not available',
        60
      ),
      riskScore:
        typeof (product && product.verification && product.verification.riskScore) === 'number'
          ? product.verification.riskScore
          : 'information not available',
      reason: sanitizeText(
        product && product.verification && product.verification.reason
          ? String(product.verification.reason)
          : 'information not available',
        320
      ),
      issues: Array.isArray(product && product.verification && product.verification.issues)
        ? product.verification.issues.map((item) => sanitizeText(String(item || ''), 160)).filter(Boolean).slice(0, 8)
        : [],
      criticalFailures: Array.isArray(product && product.verification && product.verification.criticalFailures)
        ? product.verification.criticalFailures.map((item) => sanitizeText(String(item || ''), 160)).filter(Boolean).slice(0, 8)
        : []
    },
    stages: Array.isArray(product.stages)
      ? product.stages.map((stage) => sanitizeText(String(stage), 80)).filter(Boolean)
      : [],
    stageEvents,
    blockchainEvents
  };
}

function sanitizeQuestion(question) {
  const cleaned = sanitizeText(question, MAX_QUESTION_LENGTH)
    .replace(/ignore\s+all\s+previous\s+instructions/gi, '')
    .replace(/(^|\s)(system|developer)\s*:/gi, ' ')
    .replace(/```/g, '')
    .trim();
  if (!cleaned) {
    throw new Error('Question is required');
  }
  return cleaned;
}

function sanitizeChatHistory(chatHistory = []) {
  if (!Array.isArray(chatHistory)) {
    return [];
  }

  return chatHistory
    .slice(-MAX_CHAT_TURNS)
    .map((item) => {
      const role = item && item.role === 'assistant' ? 'assistant' : 'user';
      const message = sanitizeText(item && item.message ? String(item.message) : '', 600);
      return { role, message };
    })
    .filter((item) => item.message);
}

function buildChatPrompt({ productContext, question, chatHistory = [] }) {
  const context = normalizeProductContext(productContext);
  const cleanedQuestion = sanitizeQuestion(question);
  const cleanedHistory = sanitizeChatHistory(chatHistory);

  const historyBlock = cleanedHistory.length
    ? cleanedHistory
        .map((turn, index) => `${index + 1}. ${turn.role.toUpperCase()}: ${turn.message}`)
        .join('\n')
    : 'No prior chat history available.';

  const productDataJson = JSON.stringify(context, null, 2);

  return [
    'You are a domain expert in supply chain and product compliance.',
    'Explain product information in simple, beginner-friendly language.',
    'Return strict JSON only. Do not include markdown, code fences, or extra prose.',
    '',
    'Context:',
    productDataJson,
    '',
    'Chat History:',
    historyBlock,
    '',
    'User Question:',
    cleanedQuestion,
    '',
    'Return JSON schema exactly:',
    '{',
    '  "executiveSummary": "string",',
    '  "keyFindings": ["string", "string", "string"],',
    '  "verificationChecklist": ["string", "string", "string"],',
    '  "importantNotes": ["string", "string"],',
    '  "nextSteps": ["string", "string", "string"]',
    '}',
    '',
    'Requirements:',
    '- Only use provided product data.',
    '- Do not assume missing information.',
    '- If a required fact is missing, write "information not available".',
    '- Never invent cert IDs, legal approvals, ledger hashes, dates, or manufacturer claims.',
    '- Keep each bullet clear, concise, and actionable.',
    '- Ensure each list has 2 to 4 items.'
  ].join('\n');
}

async function generateProductChatReply({ productContext, question, chatHistory = [] }) {
  const prompt = buildChatPrompt({
    productContext,
    question,
    chatHistory
  });

  const result = await callGeminiGenerateContent(prompt, {
    temperature: 0.2,
    maxOutputTokens: 1100,
    responseMimeType: 'application/json'
  });

  return {
    reply: formatChatReply(result.text || 'information not available'),
    model: result.model
  };
}

function generateProductChatFallback({ productContext, question }) {
  const context = normalizeProductContext(productContext);
  const cleanedQuestion = sanitizeQuestion(question);
  const hasStageEvents = Array.isArray(context.stageEvents) && context.stageEvents.length > 0;

  const keyFindings = [
    `Product ${context.productId}: ${context.name}.`,
    `Origin: ${context.origin}; Manufacturer: ${context.manufacturer}.`,
    `Lifecycle stages recorded: ${context.stages.length ? context.stages.join(' -> ') : 'information not available'}.`,
    `Your question focus: ${cleanedQuestion}.`
  ];

  const checklist = [
    'Confirm the latest stage event and document timestamps for recency.',
    'Cross-check certification and blockchain references before final decisions.',
    hasStageEvents
      ? 'Review stage-level verification summaries and document-level issues for risk signals.'
      : 'Stage-level verification history is limited; request supporting records if needed.'
  ];

  const notes = [
    'Live AI provider was unavailable, so this response is generated from available product data.',
    'No unverifiable facts were introduced beyond the stored product record.',
    'For regulatory or legal decisions, validate against source documents and ledger evidence.'
  ];

  const nextSteps = [
    'Ask a narrower follow-up question (for example: certification validity, stage risk, or chain-of-custody gaps).',
    'Open the stage documentation section and review any flagged or blocked verification outcomes.',
    'Retry AI chat shortly for deeper Gemini-assisted synthesis.'
  ];

  return {
    reply: [
      'Executive Summary:',
      `- Product-specific guidance was generated for ${context.productId} using current stored data.`,
      '',
      `Key Findings:\n${keyFindings.map((item) => `- ${item}`).join('\n')}`,
      '',
      `Verification Checklist:\n${checklist.map((item) => `- ${item}`).join('\n')}`,
      '',
      `Important Notes:\n${notes.map((item) => `- ${item}`).join('\n')}`,
      '',
      `Recommended Next Steps:\n${nextSteps.map((item) => `- ${item}`).join('\n')}`
    ].join('\n'),
    model: 'fallback-local'
  };
}

module.exports = {
  buildChatPrompt,
  generateProductChatReply,
  generateProductChatFallback,
  sanitizeQuestion,
  sanitizeChatHistory,
  normalizeProductContext
};
