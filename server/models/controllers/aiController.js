const Product = require('../Product');
const {
  generateProductChatReply,
  sanitizeQuestion,
  sanitizeChatHistory,
  normalizeProductContext
} = require('../../services/ai/chatService');
const {
  generateProductDescription,
  normalizeKeywords,
  normalizeTone
} = require('../../services/ai/descriptionService');
const {
  generateDashboardInsights,
} = require('../../services/ai/dashboardService');
const { testConnection } = require('../../services/ai/geminiClient');

function isAiProviderFailure(error) {
  const message = String(error && error.message ? error.message : '').toLowerCase();
  if (!message) {
    return false;
  }

  return (
    message.includes('gemini') ||
    message.includes('generatecontent') ||
    message.includes('api key') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('resource_exhausted') ||
    message.includes('timed out') ||
    message.includes('model not found') ||
    message.includes('unsupported model') ||
    message.includes('billing') ||
    message.includes('blocked the request') ||
    message.includes('empty response')
  );
}

exports.chat = async (req, res) => {
  try {
    const productId = String(req.body && req.body.productId ? req.body.productId : '').trim();
    const question = req.body && req.body.question;
    const chatHistory = req.body && req.body.chatHistory;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId is required'
      });
    }

    let cleanedQuestion;
    try {
      cleanedQuestion = sanitizeQuestion(question);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message || 'Question is required'
      });
    }

    const product = await Product.findOne({ productId })
      .select(
        'productId name description certificationHash blockchainRefHash origin manufacturer stages stageEvents verification blockchainEvents blockchainStatus blockchainTx blockchainUpdatedAt'
      )
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const reply = await generateProductChatReply({
      productContext: normalizeProductContext(product),
      question: cleanedQuestion,
      chatHistory: sanitizeChatHistory(chatHistory)
    });

    return res.json({
      success: true,
      data: {
        productId,
        reply: reply.reply,
        model: reply.model,
        mode: 'gemini'
      }
    });
  } catch (error) {
    console.error('AI chat error:', error.message || error);
    if (isAiProviderFailure(error)) {
      return res.status(503).json({
        success: false,
        message: 'AI service temporarily unavailable'
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to generate AI response'
    });
  }
};

exports.generateDescription = async (req, res) => {
  try {
    const keywordsInput = req.body && req.body.keywords;
    const toneInput = req.body && req.body.tone;

    const keywords = normalizeKeywords(keywordsInput);
    if (!keywords) {
      return res.status(400).json({
        success: false,
        message: 'keywords are required'
      });
    }

    const tone = normalizeTone(toneInput);

    const generated = await generateProductDescription({ keywords, tone });

    return res.json({
      success: true,
      data: {
        description: generated.description,
        tone: generated.tone,
        model: generated.model,
        mode: 'gemini'
      }
    });
  } catch (error) {
    console.error('AI description error:', error.message || error);
    if (isAiProviderFailure(error)) {
      return res.status(503).json({
        success: false,
        message: 'AI service temporarily unavailable'
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to generate product description'
    });
  }
};

exports.dashboardInsights = async (req, res) => {
  try {
    const rawProducts = req.body && req.body.products;
    const products = Array.isArray(rawProducts)
      ? rawProducts
      : Array.isArray(rawProducts && rawProducts.data)
        ? rawProducts.data
        : Array.isArray(req.body && req.body.visibleProducts)
          ? req.body.visibleProducts
          : [];
    const activeTab = req.body && req.body.activeTab;
    const searchQuery = req.body && req.body.searchQuery;
    const selectedStage = req.body && req.body.selectedStage;
    const sortBy = req.body && req.body.sortBy;

    const insights = await generateDashboardInsights({
      products,
      activeTab,
      searchQuery,
      selectedStage,
      sortBy
    });

    return res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('AI dashboard insights error:', error.message || error);
    if (isAiProviderFailure(error)) {
      return res.status(503).json({
        success: false,
        message: 'AI service temporarily unavailable'
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to generate dashboard insights'
    });
  }
};

exports.health = async (req, res) => {
  try {
    const status = await testConnection();

    if (!status.success) {
      return res.status(503).json({
        success: false,
        message: status.message
      });
    }

    return res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('AI health check error:', error.message || error);
    return res.status(503).json({
      success: false,
      message: 'AI service temporarily unavailable'
    });
  }
};
