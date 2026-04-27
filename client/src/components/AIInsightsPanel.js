import React, { useMemo, useState } from 'react';
import { FaBrain, FaSyncAlt } from 'react-icons/fa';
import { getDashboardInsights, isAIEnabled } from '../utils/aiApi';
import AIStructuredResponse from './AIStructuredResponse';

function isWeakInsightsText(value) {
  const cleaned = String(value || '').trim().toLowerCase();
  if (!cleaned) {
    return true;
  }

  return (
    cleaned.includes('information not available') ||
    cleaned.includes('not available') ||
    cleaned === 'n/a' ||
    cleaned === 'unknown'
  );
}

function buildSectionContentFromLines(linesBySection) {
  const sections = [
    ['Executive Summary', linesBySection.executiveSummary],
    ['Risks / Opportunities', linesBySection.risksOrOpportunities],
    ['Recommended Next Actions', linesBySection.recommendedNextActions]
  ];

  return sections
    .filter(([, items]) => Array.isArray(items) && items.length > 0)
    .map(([title, items]) => `${title}:\n${items.map((item) => `- ${item}`).join('\n')}`)
    .join('\n\n');
}

function summarizeInsightsPayload(payload) {
  if (!payload) {
    return { items: [], content: '', source: 'unknown', metadata: null };
  }

  if (payload.sections && typeof payload.sections === 'object') {
    const executiveSummary = Array.isArray(payload.sections.executiveSummary)
      ? payload.sections.executiveSummary.filter(Boolean)
      : [];
    const risksOrOpportunities = Array.isArray(payload.sections.risksOrOpportunities)
      ? payload.sections.risksOrOpportunities.filter(Boolean)
      : [];
    const recommendedNextActions = Array.isArray(payload.sections.recommendedNextActions)
      ? payload.sections.recommendedNextActions.filter(Boolean)
      : [];

    const summaryLines = [
      ...executiveSummary,
      ...risksOrOpportunities,
      ...recommendedNextActions
    ].filter(Boolean);

    const structuredContent = buildSectionContentFromLines({
      executiveSummary,
      risksOrOpportunities,
      recommendedNextActions
    });

    const rawInsights = typeof payload.insights === 'string' ? payload.insights : '';
    const content = structuredContent || (!isWeakInsightsText(rawInsights) ? rawInsights : '');

    return {
      items: summaryLines,
      content,
      source: payload.source || 'unknown',
      metadata: payload.metadata || null
    };
  }

  if (Array.isArray(payload.recommendations)) {
    return {
      items: payload.recommendations,
      content: typeof payload.insights === 'string' ? payload.insights : '',
      source: payload.source || 'unknown',
      metadata: payload.metadata || null
    };
  }

  if (Array.isArray(payload.actionItems)) {
    return {
      items: payload.actionItems,
      content: typeof payload.insights === 'string' ? payload.insights : '',
      source: payload.source || 'unknown',
      metadata: payload.metadata || null
    };
  }

  if (Array.isArray(payload.keyPoints)) {
    return {
      items: payload.keyPoints,
      content: typeof payload.insights === 'string' ? payload.insights : '',
      source: payload.source || 'unknown',
      metadata: payload.metadata || null
    };
  }

  if (typeof payload.summary === 'string' && payload.summary.trim()) {
    return {
      items: [payload.summary.trim()],
      content: typeof payload.insights === 'string' ? payload.insights : '',
      source: payload.source || 'unknown',
      metadata: payload.metadata || null
    };
  }

  if (typeof payload.insights === 'string' && payload.insights.trim()) {
    return {
      items: [],
      content: payload.insights.trim(),
      source: payload.source || 'unknown',
      metadata: payload.metadata || null
    };
  }

  return { items: [], content: '', source: 'unknown', metadata: null };
}

export default function AIInsightsPanel({ products = [], activeTab, searchQuery, selectedStage, sortBy }) {
  const aiEnabled = isAIEnabled();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [insightState, setInsightState] = useState({
    items: [],
    content: '',
    source: 'unknown',
    metadata: null
  });

  const canGenerate = useMemo(() => Array.isArray(products) && products.length > 0, [products]);

  const handleGenerate = async () => {
    if (!aiEnabled || !canGenerate || loading) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await getDashboardInsights({
        products,
        activeTab,
        searchQuery,
        selectedStage,
        sortBy
      });

      const payload = response && response.data ? response.data : response;
      const parsed = summarizeInsightsPayload(payload);

      if (!parsed.items.length && !parsed.content) {
        setError('AI insights returned no actionable recommendations.');
        setInsightState({ items: [], content: '', source: 'unknown', metadata: null });
      } else {
        setInsightState({
          items: parsed.items.slice(0, 10),
          content: parsed.content,
          source: parsed.source,
          metadata: parsed.metadata
        });
      }
    } catch (err) {
      setError(err.message || 'Unable to generate AI insights right now.');
      setInsightState({ items: [], content: '', source: 'unknown', metadata: null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl cyber-glass shadow-xl p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <FaBrain className="text-purple-300" />
          <h3 className="text-lg font-semibold text-white">AI Dashboard Insights</h3>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!aiEnabled || !canGenerate || loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#A855F7] to-[#2DD4BF] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaSyncAlt className={loading ? 'animate-spin' : ''} />
          {loading ? 'Generating...' : 'Generate Insights'}
        </button>
      </div>

      {!aiEnabled && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          AI insights are disabled in settings.
        </p>
      )}

      {aiEnabled && !canGenerate && (
        <p className="text-sm text-slate-300">
          Add or load products to generate dashboard insights.
        </p>
      )}

      {error && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
          {error}
        </p>
      )}

      {(insightState.items.length > 0 || insightState.content) && (
        <div className="mt-2">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={`px-2 py-1 rounded-full font-semibold ${insightState.source === 'ai' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              Source: {insightState.source === 'ai' ? 'AI-generated' : 'Analytics fallback'}
            </span>
            {insightState.metadata && Number.isFinite(Number(insightState.metadata.totalProducts)) && (
              <span className="px-2 py-1 rounded-full bg-white/10 text-slate-200 font-semibold">
                Products analyzed: {insightState.metadata.totalProducts}
              </span>
            )}
          </div>
          <AIStructuredResponse
            content={insightState.content}
            items={insightState.items}
            fallbackTitle="Recommended Actions"
            titleClassName="text-xs font-semibold uppercase tracking-wide text-purple-200"
            bodyClassName="text-sm leading-6 text-slate-200"
          />
        </div>
      )}
    </div>
  );
}
