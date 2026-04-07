import React, { useMemo } from 'react';

const PLACEHOLDER_PATTERN = /^(information not available\.?|not available\.?|n\/a\.?|unknown\.?)$/i;

function normalizeText(text) {
  return typeof text === 'string' ? text.trim() : '';
}

function isLikelyHeading(line) {
  if (!line) {
    return false;
  }

  const markdownHeading = /^#{1,6}\s+(.+)$/;
  const trailingColon = /^[A-Za-z][A-Za-z0-9\s/&()\-]{2,60}:$/;

  return markdownHeading.test(line) || trailingColon.test(line);
}

function extractHeading(line) {
  const markdownMatch = line.match(/^#{1,6}\s+(.+)$/);
  if (markdownMatch) {
    return markdownMatch[1].trim();
  }

  return line.replace(/:$/, '').trim();
}

function parseStructuredText(content) {
  const text = normalizeText(content);
  if (!text) {
    return [];
  }

  const lines = text.split(/\r?\n/);
  const sections = [];
  let currentSection = { title: 'Response', items: [], paragraphs: [] };

  const pushCurrent = () => {
    if (currentSection.items.length || currentSection.paragraphs.length) {
      sections.push(currentSection);
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      return;
    }

    const bulletMatch = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
    if (bulletMatch) {
      const item = bulletMatch[1].trim();
      if (item && !PLACEHOLDER_PATTERN.test(item)) {
        currentSection.items.push(item);
      }
      return;
    }

    if (isLikelyHeading(line)) {
      pushCurrent();
      currentSection = {
        title: extractHeading(line),
        items: [],
        paragraphs: []
      };
      return;
    }

    const inlineHeadingMatch = line.match(/^([A-Za-z][A-Za-z0-9\s/&()\-]{2,45}):\s+(.+)$/);
    if (inlineHeadingMatch) {
      const titleWords = inlineHeadingMatch[1].trim().split(/\s+/);
      if (titleWords.length <= 8) {
        pushCurrent();
        currentSection = {
          title: inlineHeadingMatch[1].trim(),
          items: [],
          paragraphs: []
        };

        const remainder = inlineHeadingMatch[2].trim();
        if (remainder && !PLACEHOLDER_PATTERN.test(remainder)) {
          currentSection.paragraphs.push(remainder);
        }
        return;
      }
    }

    if (!PLACEHOLDER_PATTERN.test(line)) {
      currentSection.paragraphs.push(line);
    }
  });

  pushCurrent();

  return sections;
}

export default function AIStructuredResponse({
  content = '',
  items = [],
  fallbackTitle = 'AI Response',
  className = '',
  titleClassName = 'text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300',
  bodyClassName = 'text-sm leading-6 text-slate-700 dark:text-slate-200'
}) {
  const normalizedItems = useMemo(() => {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item && !PLACEHOLDER_PATTERN.test(item));
  }, [items]);

  const parsedSections = useMemo(() => parseStructuredText(content), [content]);

  if (!parsedSections.length && !normalizedItems.length) {
    return null;
  }

  return (
    <div className={className}>
      {parsedSections.length > 0 ? (
        <div className="space-y-4">
          {parsedSections.map((section, sectionIndex) => (
            <div key={`${section.title}-${sectionIndex}`} className="space-y-2">
              <h5 className={titleClassName}>{section.title || fallbackTitle}</h5>

              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={`${section.title}-p-${paragraphIndex}`} className={bodyClassName}>
                  {paragraph}
                </p>
              ))}

              {section.items.length > 0 ? (
                <ul className="space-y-1.5">
                  {section.items.map((item, itemIndex) => (
                    <li key={`${section.title}-i-${itemIndex}`} className={`${bodyClassName} flex gap-2`}>
                      <span className="text-slate-500 dark:text-slate-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <h5 className={titleClassName}>{fallbackTitle}</h5>
          <ul className="space-y-1.5">
            {normalizedItems.map((item, index) => (
              <li key={`insight-${index}`} className={`${bodyClassName} flex gap-2`}>
                <span className="text-slate-500 dark:text-slate-400">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
