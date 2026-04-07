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
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
      icon: FaCheckCircle,
      label: 'Verified'
    };
  }

  if (status === 'blocked' || status === 'rejected') {
    return {
      badge: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300',
      icon: FaTimesCircle,
      label: 'Blocked'
    };
  }

  if (status === 'flagged' || status === 'pending_review') {
    return {
      badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
      icon: FaExclamationTriangle,
      label: 'Manual Review'
    };
  }

  return {
    badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
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

function ProductVerificationStatusSection({ product }) {
  const stageEvents = normalizeArray(product?.stageEvents);
  const productVerification = product?.verification || {};

  if (!stageEvents.length && !productVerification.status) {
    return null;
  }

  const overallTone = statusTone(productVerification.status || productVerification.reviewState || 'skipped');

  return (
    <section className="col-span-1 sm:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FaShieldAlt className="text-blue-500" />
            Product Verification Status
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Stage-level documentation verification summary with Gemini rejection reasons where applicable.
          </p>
        </div>

        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${overallTone.badge}`}>
          <overallTone.icon />
          {overallTone.label}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Overall Status</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{productVerification.status || 'N/A'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Review State</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{productVerification.reviewState || 'N/A'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Risk Score</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{productVerification.riskScore ?? 'N/A'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Last Verified</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{formatDate(productVerification.verifiedAt)}</p>
        </div>
      </div>

      {productVerification.reason ? (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300 mb-1">Overall Reason</p>
          <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap">{productVerification.reason}</p>
        </div>
      ) : null}

      <div className="space-y-3">
        {stageEvents.map((event, index) => {
          const summary = event.verificationSummary || {};
          const docReasons = collectDocumentReasons(event);
          const tone = statusTone(summary.status || summary.reviewState || 'skipped');

          return (
            <article key={`${event.stage || 'stage'}-${index}`} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{event.stage || 'Unknown Stage'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Recorded {formatDate(event.recordedAt)}</p>
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${tone.badge}`}>
                  <tone.icon />
                  {summary.status || 'skipped'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-700 dark:text-slate-300 mb-2">
                <p><span className="font-semibold">Risk:</span> {summary.riskScore ?? 'N/A'}</p>
                <p><span className="font-semibold">Review:</span> {summary.reviewState || 'not_required'}</p>
                <p><span className="font-semibold">Documents:</span> {normalizeArray(event.documents).length}</p>
              </div>

              {summary.reason ? (
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2"><span className="font-semibold">Stage Reason:</span> {summary.reason}</p>
              ) : null}

              {docReasons.length > 0 ? (
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 mb-1.5">Document Verification Reasons</p>
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
