import React from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

function badgeTone(status) {
  if (status === 'allowed' || status === 'verified') {
    return { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: FaCheckCircle, label: 'Verified' };
  }

  if (status === 'blocked' || status === 'rejected') {
    return { cls: 'bg-rose-100 text-rose-700 border-rose-200', icon: FaTimesCircle, label: 'Blocked' };
  }

  if (status === 'flagged' || status === 'pending_review') {
    return { cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: FaExclamationTriangle, label: 'Flagged' };
  }

  return { cls: 'bg-slate-100 text-slate-700 border-slate-200', icon: FaInfoCircle, label: 'Review' };
}

function flattenIssues(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function VerificationResultPanel({ verification, title = 'Verification Result' }) {
  if (!verification) {
    return null;
  }

  const status = verification.status || verification.decision?.status || verification.reviewState || 'flagged';
  const tone = badgeTone(status);
  const issues = flattenIssues(verification.issues || verification.riskResult?.issues || verification.verification?.issues);
  const summary = verification.stageDocumentation?.summary || verification.pipeline?.stageDocumentation?.summary || null;
  const decision = verification.decision || null;
  const riskScore = verification.riskScore ?? verification.riskResult?.riskScore ?? summary?.riskScore ?? null;
  const reason = verification.reason || decision?.reason || summary?.reason || verification.message || null;

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 shadow-lg p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Gemini verification details are shown here so users can see why a submission passed, flagged, or was blocked.</p>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${tone.cls}`}>
          <tone.icon />
          {tone.label}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{status}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Risk Score</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{riskScore !== null && riskScore !== undefined ? riskScore : 'N/A'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Review State</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{verification.reviewState || decision?.reviewState || 'pending_review'}</p>
        </div>
      </div>

      {reason ? (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 mb-4">
          <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300 font-semibold mb-1">Reason</p>
          <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap">{reason}</p>
        </div>
      ) : null}

      {issues.length > 0 ? (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 mb-4">
          <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold mb-2">Issues</p>
          <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-100">
            {issues.slice(0, 8).map((issue, index) => (
              <li key={`${index}-${issue}`}>• {issue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold mb-2">Stage Documentation Summary</p>
          <pre className="text-xs whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300">{JSON.stringify(summary, null, 2)}</pre>
        </div>
      ) : null}
    </section>
  );
}

export default VerificationResultPanel;
