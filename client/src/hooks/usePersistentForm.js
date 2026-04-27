import { useEffect, useMemo, useState } from 'react';

const STORAGE_PREFIX = 'tracechain:draft:';

function readDraft(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (
      fallback &&
      typeof fallback === 'object' &&
      !Array.isArray(fallback) &&
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
    ) {
      return {
        ...fallback,
        ...parsed
      };
    }
    return parsed;
  } catch (error) {
    console.warn('Unable to read saved draft:', error);
    return fallback;
  }
}

export function usePersistentForm(key, initialValue, options = {}) {
  const { sanitize = (value) => value, debounceMs = 250 } = options;
  const stableInitialValue = useMemo(() => initialValue, []);
  const [value, setValue] = useState(() => readDraft(key, stableInitialValue));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        const nextValue = sanitize(value);
        window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(nextValue));
      } catch (error) {
        console.warn('Unable to save draft:', error);
      }
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [key, value, sanitize, debounceMs]);

  const clearDraft = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    }
  };

  return [value, setValue, clearDraft];
}

export function stripTransientDocumentFields(documents = []) {
  if (!Array.isArray(documents)) {
    return [];
  }

  return documents.map(({ file, fileName, ...document }) => ({
    ...document,
    file: null,
    fileName: ''
  }));
}
