import React from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

function badgeTone(status) {
  if (status === 'allowed' || status === 'verified') {
    return { cls: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', icon: FaCheckCircle, label: 'Verified' };
  }

  if (status === 'blocked' || status === 'rejected') {
    return { cls: 'border-rose-300/30 bg-rose-500/10 text-rose-700 dark:text-rose-300', icon: FaTimesCircle, label: 'Blocked' };
  }

  if (status === 'flagged' || status === 'pending_review') {
    return { cls: 'border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-300', icon: FaExclamationTriangle, label: 'Flagged' };
  }

  return { cls: 'border-slate-300/30 bg-slate-500/10 text-slate-700 dark:text-slate-300', icon: FaInfoCircle, label: 'Review' };
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

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/55 p-3 dark:bg-white/5">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
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
    <section className="rounded-[28px] border border-white/10 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:bg-white/5 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Gemini verification details are shown here so users can see why a submission passed, flagged, or was blocked.
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${tone.cls}`}>
          <tone.icon />
          {tone.label}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard label="Status" value={status} />
        <MetricCard label="Risk Score" value={riskScore !== null && riskScore !== undefined ? riskScore : 'N/A'} />
        <MetricCard label="Review State" value={verification.reviewState || decision?.reviewState || 'pending_review'} />
      </div>

      {reason ? (
        <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/8 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Reason</p>
          <p className="whitespace-pre-wrap text-sm text-cyan-900 dark:text-cyan-100">{reason}</p>
        </div>
      ) : null}

      {issues.length > 0 ? (
        <div className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Issues</p>
          <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-100">
            {issues.slice(0, 8).map((issue, index) => (
              <li key={`${index}-${issue}`}>- {issue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary ? (
        <div className="rounded-2xl border border-white/10 bg-white/55 p-4 dark:bg-white/5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Stage Documentation Summary</p>
          <pre className="break-words whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300">{JSON.stringify(summary, null, 2)}</pre>
        </div>
      ) : null}
    </section>
  );
}

export default VerificationResultPanel;
