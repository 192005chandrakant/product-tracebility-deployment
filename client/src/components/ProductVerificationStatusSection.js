import React from 'react';
import { FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
}

function statusTone(status) {
  if (status === 'allowed' || status === 'verified') {
    return {
      badge: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      icon: FaCheckCircle,
      label: 'Verified'
    };
  }

  if (status === 'blocked' || status === 'rejected') {
    return {
      badge: 'border-rose-300/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
      icon: FaTimesCircle,
      label: 'Blocked'
    };
  }

  if (status === 'flagged' || status === 'pending_review') {
    return {
      badge: 'border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
      icon: FaExclamationTriangle,
      label: 'Manual Review'
    };
  }

  return {
    badge: 'border-slate-300/30 bg-slate-500/10 text-slate-700 dark:text-slate-300',
    icon: FaInfoCircle,
    label: 'Not Required'
  };
}

function collectDocumentReasons(event = {}) {
  const documents = normalizeArray(event.documents);

  return documents
    .map((document) => {
      const reason = document?.verification?.reason || normalizeArray(document?.verification?.issues)[0] || '';
      if (!reason) {
        return null;
      }

      return {
        title: document.title || document.documentType || 'Document',
        reason,
        status: document?.verification?.status || 'skipped'
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/55 p-3 dark:bg-white/5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function ProductVerificationStatusSection({ product }) {
  const stageEvents = normalizeArray(product?.stageEvents);
  const productVerification = product?.verification || {};

  if (!stageEvents.length && !productVerification.status) {
    return null;
  }

  const overallTone = statusTone(productVerification.status || productVerification.reviewState || 'skipped');

  return (
    <section className="col-span-1 rounded-[28px] border border-white/10 bg-white/75 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:bg-white/5 sm:col-span-2 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <FaShieldAlt className="text-purple-500" />
            Product Verification Status
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Stage-level documentation verification summary with Gemini rejection reasons where applicable.
          </p>
        </div>

        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${overallTone.badge}`}>
          <overallTone.icon />
          {overallTone.label}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MetricCard label="Overall Status" value={productVerification.status || 'N/A'} />
        <MetricCard label="Review State" value={productVerification.reviewState || 'N/A'} />
        <MetricCard label="Risk Score" value={productVerification.riskScore ?? 'N/A'} />
        <MetricCard label="Last Verified" value={formatDate(productVerification.verifiedAt)} />
      </div>

      {productVerification.reason ? (
        <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/8 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Overall Reason</p>
          <p className="whitespace-pre-wrap text-sm text-cyan-900 dark:text-cyan-100">{productVerification.reason}</p>
        </div>
      ) : null}

      <div className="space-y-3">
        {stageEvents.map((event, index) => {
          const summary = event.verificationSummary || {};
          const docReasons = collectDocumentReasons(event);
          const tone = statusTone(summary.status || summary.reviewState || 'skipped');

          return (
            <article key={`${event.stage || 'stage'}-${index}`} className="rounded-[24px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.82),rgba(245,243,255,0.7))] p-4 dark:bg-white/5">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{event.stage || 'Unknown Stage'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Recorded {formatDate(event.recordedAt)}</p>
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${tone.badge}`}>
                  <tone.icon />
                  {summary.status || 'skipped'}
                </div>
              </div>

              <div className="mb-2 grid grid-cols-1 gap-2 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-3">
                <p><span className="font-semibold">Risk:</span> {summary.riskScore ?? 'N/A'}</p>
                <p><span className="font-semibold">Review:</span> {summary.reviewState || 'not_required'}</p>
                <p><span className="font-semibold">Documents:</span> {normalizeArray(event.documents).length}</p>
              </div>

              {summary.reason ? (
                <p className="mb-2 text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Stage Reason:</span> {summary.reason}</p>
              ) : null}

              {docReasons.length > 0 ? (
                <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-3">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">Document Verification Reasons</p>
                  <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-100">
                    {docReasons.map((item, reasonIndex) => (
                      <li key={`${item.title}-${reasonIndex}`}>
                        {item.title}: {item.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ProductVerificationStatusSection;
