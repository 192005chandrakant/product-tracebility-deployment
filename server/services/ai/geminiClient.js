const https = require('https');

const MODEL_PREFERENCE = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash'
].filter(Boolean);

const DEFAULT_MODEL = MODEL_PREFERENCE[0] || 'gemini-2.5-flash-lite';
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 15000);

function getApiKey() {
  return process.env.GEMINI_API_KEY;
}

function isConfigured() {
  return Boolean(getApiKey());
}

function sanitizeText(text, maxLength = 4000, options = {}) {
  if (typeof text !== 'string') {
    return '';
  }

  const preserveLineBreaks = Boolean(options && options.preserveLineBreaks);

  if (preserveLineBreaks) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, maxLength);
  }

  return text
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function isRetryableModelError(message) {
  if (typeof message !== 'string') {
    return false;
  }

  const normalized = message.toLowerCase();
  return (
    normalized.includes('is not found for api version') ||
    normalized.includes('is not supported for generatecontent') ||
    normalized.includes('model not found') ||
    normalized.includes('unsupported model') ||
    normalized.includes('quota') ||
    normalized.includes('rate limit') ||
    normalized.includes('resource_exhausted') ||
    normalized.includes('too many requests') ||
    normalized.includes('billing') ||
    normalized.includes('internal error') ||
    normalized.includes('backend error') ||
    normalized.includes('service unavailable')
  );
}

function callGeminiGenerateContent(prompt, options = {}) {
  return new Promise((resolve, reject) => {
    const apiKey = getApiKey();

    if (!apiKey) {
      reject(new Error('Gemini API key is not configured'));
      return;
    }

    const requestedModel = options.model || DEFAULT_MODEL;
    const cleanedPrompt = sanitizeText(prompt || '', 8000);

    const hasCustomParts = Array.isArray(options.parts) && options.parts.length > 0;
    const finalParts = hasCustomParts
      ? options.parts
          .map((part) => {
            if (!part || typeof part !== 'object') {
              return null;
            }

            if (typeof part.text === 'string') {
              const cleanedText = sanitizeText(part.text, 8000);
              return cleanedText ? { text: cleanedText } : null;
            }

            if (
              part.inlineData &&
              typeof part.inlineData === 'object' &&
              typeof part.inlineData.mimeType === 'string' &&
              typeof part.inlineData.data === 'string'
            ) {
              return {
                inlineData: {
                  mimeType: part.inlineData.mimeType,
                  data: part.inlineData.data
                }
              };
            }

            return null;
          })
          .filter(Boolean)
      : [{ text: cleanedPrompt }];

    if (!finalParts.length) {
      reject(new Error('Prompt/parts are empty after sanitization'));
      return;
    }

    const payload = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: finalParts
        }
      ],
      generationConfig: {
        temperature: typeof options.temperature === 'number' ? options.temperature : 0.3,
        maxOutputTokens: typeof options.maxOutputTokens === 'number' ? options.maxOutputTokens : 512,
        ...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {})
      }
    });

    const requestWithModel = (targetModel) => {
      return new Promise((innerResolve, innerReject) => {
        const endpointPath = `/v1beta/models/${encodeURIComponent(targetModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const req = https.request(
          {
            hostname: 'generativelanguage.googleapis.com',
            path: endpointPath,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload)
            },
            timeout: GEMINI_TIMEOUT_MS
          },
          (res) => {
            let raw = '';

            res.on('data', (chunk) => {
              raw += chunk;
            });

            res.on('end', () => {
              let parsed;

              try {
                parsed = raw ? JSON.parse(raw) : {};
              } catch (parseError) {
                innerReject(new Error('Invalid JSON response from Gemini API'));
                return;
              }

              if (res.statusCode < 200 || res.statusCode >= 300) {
                const apiError =
                  parsed && parsed.error && parsed.error.message
                    ? parsed.error.message
                    : `Gemini API request failed with status ${res.statusCode}`;

                innerReject(new Error(`Gemini API error (${res.statusCode}): ${apiError}`));
                return;
              }

              if (parsed && parsed.promptFeedback && parsed.promptFeedback.blockReason) {
                innerReject(
                  new Error(`Gemini blocked the request: ${parsed.promptFeedback.blockReason}`)
                );
                return;
              }

              const parts =
                parsed &&
                parsed.candidates &&
                parsed.candidates[0] &&
                parsed.candidates[0].content &&
                Array.isArray(parsed.candidates[0].content.parts)
                  ? parsed.candidates[0].content.parts
                  : [];

              const joinedText = parts
                .map((part) => (part && typeof part.text === 'string' ? part.text : ''))
                .filter(Boolean)
                .join('\n')
                .trim();

              if (!joinedText) {
                innerReject(new Error('Gemini returned an empty response'));
                return;
              }

              innerResolve({
                text: sanitizeText(joinedText, 12000, { preserveLineBreaks: true }),
                raw: parsed,
                model: targetModel
              });
            });
          }
        );

        req.on('timeout', () => {
          req.destroy(new Error('Gemini API request timed out'));
        });

        req.on('error', (error) => {
          innerReject(error);
        });

        req.write(payload);
        req.end();
      });
    };

    const modelQueue = [];
    if (requestedModel) {
      modelQueue.push(requestedModel);
    }

    for (const modelName of MODEL_PREFERENCE) {
      if (!modelQueue.includes(modelName)) {
        modelQueue.push(modelName);
      }
    }

    const tryNextModel = (index, lastError) => {
      if (index >= modelQueue.length) {
        reject(lastError || new Error('All Gemini models failed'));
        return;
      }

      requestWithModel(modelQueue[index])
        .then((result) => resolve(result))
        .catch((error) => {
          if (!isRetryableModelError(error && error.message)) {
            reject(error);
            return;
          }

          tryNextModel(index + 1, error);
        });
    };

    tryNextModel(0);
  });
}

async function testConnection() {
  try {
    const result = await callGeminiGenerateContent('Reply with exactly: GEMINI_OK', {
      temperature: 0,
      maxOutputTokens: 16
    });

    return {
      success: true,
      model: result.model,
      responsePreview: result.text.slice(0, 60),
      mode: 'gemini'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to connect to Gemini API'
    };
  }
}

module.exports = {
  isConfigured,
  callGeminiGenerateContent,
  testConnection,
  sanitizeText,
  isRetryableModelError,
  MODEL_PREFERENCE
};
