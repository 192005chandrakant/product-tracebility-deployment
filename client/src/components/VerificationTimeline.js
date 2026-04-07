import React, { useMemo } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaClock, FaShieldAlt } from 'react-icons/fa';

function toDisplayDate(value) {
  if (!value) return 'Pending';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Pending' : date.toLocaleString();
}

function normalizeVerificationEvents(verification, product) {
  const events = [];
  const sourceProduct = product || {};
  const sourceVerification = verification || sourceProduct.verification || {};

  if (sourceProduct.createdAt || sourceVerification.createdAt) {
    events.push({
      key: 'created',
      label: 'Verification Requested',
      description: 'Product verification record was created.',
      date: sourceVerification.createdAt || sourceProduct.createdAt,
      type: 'neutral'
    });
  }

  if (Array.isArray(sourceProduct.stageEvents) && sourceProduct.stageEvents.length > 0) {
    sourceProduct.stageEvents.slice(-3).forEach((event, index) => {
      events.push({
        key: `stage-${index}`,
        label: `Stage Update: ${event.stage || 'Unknown'}`,
        description: event.verificationSummary?.reason || event.stageNotes || 'Stage documentation was updated.',
        date: event.recordedAt || event.timestamp || sourceProduct.createdAt,
        type: event.verificationSummary?.status === 'allowed'
          ? 'success'
          : event.verificationSummary?.status === 'blocked'
            ? 'danger'
            : event.verificationSummary?.status === 'flagged'
              ? 'warning'
              : 'neutral'
      });
    });
  }

  if (sourceVerification && sourceVerification.ai) {
    events.push({
      key: 'ai',
      label: 'AI Document Analysis',
      description: sourceVerification.ai.summary || 'AI analysis completed on uploaded document artifacts.',
      date: sourceVerification.ai.completedAt || sourceVerification.ai.timestamp,
      type: 'ai'
    });
  }

  if (sourceVerification && sourceVerification.decisionAt) {
    events.push({
      key: 'decision',
      label: 'Decision Finalized',
      description: `Final status: ${sourceVerification.status || 'flagged'}`,
      date: sourceVerification.decisionAt,
      type: sourceVerification.status === 'allowed' ? 'success' : sourceVerification.status === 'blocked' ? 'danger' : 'warning'
    });
  }

  if (events.length === 0 && sourceVerification) {
    events.push({
      key: 'fallback',
      label: 'Verification Snapshot',
      description: sourceVerification.reason || 'Verification is available but no timeline events were recorded.',
      date: sourceVerification.updatedAt || sourceVerification.createdAt || sourceProduct.createdAt,
      type: sourceVerification.status === 'allowed' ? 'success' : sourceVerification.status === 'blocked' ? 'danger' : 'warning'
    });
  }

  return events
    .filter((event) => event && (event.date || event.description || event.label))
    .sort((a, b) => {
      const aTs = a.date ? new Date(a.date).getTime() : 0;
      const bTs = b.date ? new Date(b.date).getTime() : 0;
      return aTs - bTs;
    });
}

function iconForType(type) {
  if (type === 'success') return <FaCheckCircle className="text-green-600" />;
  if (type === 'danger') return <FaExclamationTriangle className="text-red-600" />;
  if (type === 'warning') return <FaExclamationTriangle className="text-amber-600" />;
  if (type === 'ai') return <FaShieldAlt className="text-blue-600" />;
  return <FaClock className="text-slate-500" />;
}

function styleForType(type) {
  if (type === 'success') return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
  if (type === 'danger') return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
  if (type === 'warning') return 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20';
  if (type === 'ai') return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
  return 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50';
}

function VerificationTimeline({ verification, product, title = 'Verification Timeline' }) {
  const events = useMemo(() => normalizeVerificationEvents(verification, product), [verification, product]);

  if (!verification && !product) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">{title}</h3>
      <div className="space-y-3">
        {events.map((event) => (
          <article key={event.key} className={`rounded-lg border p-3 ${styleForType(event.type)}`}>
            <div className="flex items-start gap-3">
              <div className="mt-1">{iconForType(event.type)}</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{event.label}</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{event.description}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{toDisplayDate(event.date)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default VerificationTimeline;
