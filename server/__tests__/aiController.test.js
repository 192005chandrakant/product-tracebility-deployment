jest.mock('../models/Product', () => ({
  findOne: jest.fn()
}));

jest.mock('../services/ai/chatService', () => ({
  generateProductChatReply: jest.fn(),
  sanitizeQuestion: jest.fn(),
  sanitizeChatHistory: jest.fn(),
  normalizeProductContext: jest.fn()
}));

jest.mock('../services/ai/descriptionService', () => ({
  generateProductDescription: jest.fn(),
  normalizeKeywords: jest.fn(),
  normalizeTone: jest.fn()
}));

jest.mock('../services/ai/dashboardService', () => ({
  generateDashboardInsights: jest.fn()
}));

jest.mock('../services/ai/geminiClient', () => ({
  testConnection: jest.fn()
}));

const Product = require('../models/Product');
const chatService = require('../services/ai/chatService');
const descriptionService = require('../services/ai/descriptionService');
const aiController = require('../models/controllers/aiController');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
}

describe('aiController edge handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('chat returns 404 when product is not found', async () => {
    chatService.sanitizeQuestion.mockReturnValue('Where is this sourced?');

    Product.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      })
    });

    const req = { body: { productId: 'P-404', question: 'Where is this sourced?' } };
    const res = createRes();

    await aiController.chat(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Product not found'
    }));
  });

  test('chat returns 400 when question is empty/invalid', async () => {
    chatService.sanitizeQuestion.mockImplementation(() => {
      throw new Error('Question is required');
    });

    const req = { body: { productId: 'P-1', question: '' } };
    const res = createRes();

    await aiController.chat(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Question is required'
    }));
  });

  test('chat returns safe fallback message on Gemini failure', async () => {
    chatService.sanitizeQuestion.mockReturnValue('Where is this sourced?');
    chatService.sanitizeChatHistory.mockReturnValue([]);
    chatService.normalizeProductContext.mockReturnValue({ productId: 'P-1', name: 'Demo' });

    Product.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ productId: 'P-1', name: 'Demo' })
      })
    });

    chatService.generateProductChatReply.mockRejectedValue(new Error('Gemini API request timed out'));

    const req = { body: { productId: 'P-1', question: 'Where is this sourced?', chatHistory: [] } };
    const res = createRes();

    await aiController.chat(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'AI service temporarily unavailable'
    });
  });

  test('description returns 400 when keywords are empty', async () => {
    descriptionService.normalizeKeywords.mockReturnValue('');

    const req = { body: { keywords: '', tone: 'friendly' } };
    const res = createRes();

    await aiController.generateDescription(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'keywords are required'
    }));
  });

  test('description returns 503 fallback on Gemini failure', async () => {
    descriptionService.normalizeKeywords.mockReturnValue('organic coconut');
    descriptionService.normalizeTone.mockReturnValue('professional');
    descriptionService.generateProductDescription.mockRejectedValue(new Error('Gemini API key is not configured'));

    const req = { body: { keywords: 'organic coconut', tone: 'friendly' } };
    const res = createRes();

    await aiController.generateDescription(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'AI service temporarily unavailable'
    });
  });
});
