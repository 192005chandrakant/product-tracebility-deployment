export const AI_ENABLED_KEY = 'tracechain.ai.enabled';
export const API_BASE_URL_KEY = 'tracechain.api.baseUrl';
export const SETTINGS_CHANGED_EVENT = 'tracechainSettingsChanged';

export function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function safeGetItem(key) {
  if (!canUseStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.error('Failed to read setting:', key, error);
    return null;
  }
}

export function safeSetItem(key, value) {
  if (!canUseStorage()) return;
  try {
    if (value === null || value === undefined || value === '') {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, String(value));
    }
    window.dispatchEvent(new CustomEvent(SETTINGS_CHANGED_EVENT, {
      detail: { key, value }
    }));
  } catch (error) {
    console.error('Failed to persist setting:', key, error);
  }
}

export function safeRemoveItem(key) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent(SETTINGS_CHANGED_EVENT, {
      detail: { key, value: null }
    }));
  } catch (error) {
    console.error('Failed to remove setting:', key, error);
  }
}

export function parseBoolean(value, fallback = false) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

export function isValidHttpUrl(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch (error) {
    return false;
  }
}

export function getPersistedAIEnabled() {
  const envEnabled = process.env.REACT_APP_ENABLE_AI_FEATURES === 'true';
  if (envEnabled) {
    return true;
  }

  const stored = safeGetItem(AI_ENABLED_KEY);
  if (stored !== null) {
    return parseBoolean(stored, false);
  }
  return false;
}

export function setPersistedAIEnabled(enabled) {
  safeSetItem(AI_ENABLED_KEY, enabled ? 'true' : 'false');
}

export function getPersistedAPIBaseURL() {
  const stored = safeGetItem(API_BASE_URL_KEY);
  if (stored && isValidHttpUrl(stored)) {
    return stored.trim();
  }
  return '';
}

export function setPersistedAPIBaseURL(baseUrl) {
  const trimmed = typeof baseUrl === 'string' ? baseUrl.trim() : '';
  if (!trimmed) {
    safeRemoveItem(API_BASE_URL_KEY);
    return;
  }

  if (!isValidHttpUrl(trimmed)) {
    throw new Error('Please enter a valid http or https API URL');
  }

  safeSetItem(API_BASE_URL_KEY, trimmed);
}

export function clearPersistedAPIBaseURL() {
  safeRemoveItem(API_BASE_URL_KEY);
}


