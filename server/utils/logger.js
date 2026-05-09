/**
 * Production-Safe Logging Utility
 * Controls what gets logged based on NODE_ENV
 * 
 * Usage:
 *   const logger = require('./logger');
 *   logger.info('Application started');
 *   logger.error('An error occurred:', error.message);
 *   logger.debug('Debug info:', data); // Only logs in development
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DEBUG_ENABLED = String(process.env.DEBUG_LOGS || '').toLowerCase() === 'true' && !IS_PRODUCTION;

const LOG_LEVELS = {
  debug: { level: 0, color: '\x1b[36m', prefix: '🔍 DEBUG' },     // Cyan
  info: { level: 1, color: '\x1b[32m', prefix: 'ℹ️  INFO' },       // Green
  warn: { level: 2, color: '\x1b[33m', prefix: '⚠️  WARN' },       // Yellow
  error: { level: 3, color: '\x1b[31m', prefix: '❌ ERROR' },      // Red
  fatal: { level: 4, color: '\x1b[35m', prefix: '💀 FATAL' }       // Magenta
};

const RESET = '\x1b[0m';

/**
 * Sanitize error messages to remove sensitive information
 */
function sanitizeErrorMessage(message) {
  if (!IS_PRODUCTION) return message;
  
  // Remove MongoDB connection strings
  message = message.replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, 'mongodb://***:***@');
  
  // Remove API keys
  message = message.replace(/['\"]?([A-Za-z0-9_-]*[Kk]ey)['\"]?\s*[:=]\s*['"]([^'"\n]+)['"]/g, '$1=***');
  
  // Remove JWT tokens
  message = message.replace(/bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'bearer ***');
  
  // Remove email addresses for some contexts
  message = message.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '***@***.***');
  
  return message;
}

/**
 * Format timestamp for logs
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Main logging function
 */
function log(level, ...args) {
  const logConfig = LOG_LEVELS[level];
  if (!logConfig) return;
  
  // Suppress debug logs in production
  if (level === 'debug' && !DEBUG_ENABLED) return;
  
  const timestamp = getTimestamp();
  const message = args
    .map(arg => {
      if (typeof arg === 'string') {
        return sanitizeErrorMessage(arg);
      }
      if (arg instanceof Error) {
        return sanitizeErrorMessage(arg.message);
      }
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(' ');
  
  if (IS_PRODUCTION) {
    // Simple JSON format for production (easier to parse in logs aggregation)
    console.log(JSON.stringify({
      timestamp,
      level,
      message
    }));
  } else {
    // Colorful format for development
    const coloredPrefix = `${logConfig.color}${logConfig.prefix}${RESET}`;
    console.log(`${coloredPrefix} [${timestamp}] ${message}`);
  }
}

module.exports = {
  debug: (...args) => log('debug', ...args),
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args),
  fatal: (...args) => log('fatal', ...args),
  
  // Utility to log with context
  withContext: (context, level, ...args) => {
    const contextStr = `[${context}]`;
    log(level, contextStr, ...args);
  }
};
