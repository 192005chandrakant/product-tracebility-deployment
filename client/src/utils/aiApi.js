import { apiRequest } from './apiConfig';
const { getPersistedAIEnabled } = require('./appSettings');

export function isAIEnabled() {
  return getPersistedAIEnabled();
}

export async function aiChat({ productId, question, chatHistory = [] }) {
  return apiRequest('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      productId,
      question,
      chatHistory
    })
  });
}

export async function generateProductDescription({ keywords, tone = 'professional' }) {
  return apiRequest('/api/ai/generate-description', {
    method: 'POST',
    body: JSON.stringify({
      keywords,
      tone
    })
  });
}

export async function getAiHealth() {
  return apiRequest('/api/ai/health', {
    method: 'GET'
  });
}

export async function getDashboardInsights(payload) {
  return apiRequest('/api/ai/dashboard-insights', {
    method: 'POST',
    body: JSON.stringify(payload || {})
  });
}
