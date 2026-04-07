import React from 'react';
import { FaFileAlt, FaExternalLinkAlt, FaDownload, FaEye, FaShieldAlt } from 'react-icons/fa';

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function severityTone(status) {
  if (status === 'allowed' || status === 'verified') {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300';
  }

  if (status === 'blocked' || status === 'rejected') {
    return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300';
  }

  if (status === 'flagged' || status === 'pending_review') {
    return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
  }

  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
}

function fileUrl(file) {
  if (!file) return null;
  return file.downloadUrl || file.publicUrl || file.shareUrl || file.webViewLink || file.url || null;
}

function toPipelineStatusLabel(value) {
  if (typeof value === 'boolean') {
    return value ? 'pass' : 'fail';
  }

  if (!value) {
    return 'not available';
  }

  return String(value);
}

function DocumentCard({ document }) {
  const url = fileUrl(document.file);
  const status = document.verification?.status || 'skipped';
  const tone = severityTone(status);
  const issues = safeArray(document.verification?.issues);
  const criticalFailures = safeArray(document.verification?.criticalFailures);
  const pipeline = document.verification?.pipeline || null;
  const fileValidation = pipeline?.fileValidation || null;
  const ai = pipeline?.ai || null;
  const fieldMatch = pipeline?.fieldMatch || null;
  const verificationReason = document.verification?.reason || null;

  return (
    <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 mb-2">
            <FaFileAlt />
            {document.documentType || 'document'}
          </div>
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{document.title || 'Untitled document'}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{document.documentReference || 'No reference'} · {formatDate(document.uploadedAt || document.recordedAt)}</p>
        </div>

        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${tone}`}>
          <FaShieldAlt />
          {status}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700 dark:text-slate-300">
        <p><span className="font-semibold">Stage:</span> {document.stage || 'N/A'}</p>
        <p><span className="font-semibold">Standard:</span> {document.standardCode || 'N/A'}</p>
        <p><span className="font-semibold">Authority:</span> {document.issuingAuthority || 'N/A'}</p>
        <p><span className="font-semibold">Issuer Country:</span> {document.issuerCountry || 'N/A'}</p>
        <p><span className="font-semibold">Version:</span> {document.documentVersion || 'N/A'}</p>
        <p><span className="font-semibold">Certificate #:</span> {document.certificateNumber || 'N/A'}</p>
        <p><span className="font-semibold">Batch #:</span> {document.batchNumber || 'N/A'}</p>
        <p><span className="font-semibold">Lot #:</span> {document.lotNumber || 'N/A'}</p>
        <p><span className="font-semibold">Issue Date:</span> {formatDate(document.issueDate)}</p>
        <p><span className="font-semibold">Expiry Date:</span> {formatDate(document.expiryDate)}</p>
      </div>

      {document.complianceScope ? (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400"><span className="font-semibold">Scope:</span> {document.complianceScope}</p>
      ) : null}

      {document.notes ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap"><span className="font-semibold">Notes:</span> {document.notes}</p>
      ) : null}

      {document.verificationNotes ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap"><span className="font-semibold">Verification Notes:</span> {document.verificationNotes}</p>
      ) : null}

      {verificationReason ? (
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap"><span className="font-semibold">Verification Reason:</span> {verificationReason}</p>
      ) : null}

      {url ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-sm font-semibold">
            <FaEye />
            View File
          </a>
          <a href={url} target="_blank" rel="noopener noreferrer" download className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-semibold">
            <FaDownload />
            Download
          </a>
          {document.file?.fileName ? (
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400 bg-white dark:bg-slate-900 text-sm">
              <FaExternalLinkAlt />
              {document.file.fileName}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
          No uploaded file available for this document.
        </div>
      )}

      {issues.length > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 mb-2">Verification Issues</p>
          <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-100">
            {issues.map((issue, index) => (
              <li key={`${index}-${issue}`}>• {issue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {criticalFailures.length > 0 ? (
        <div className="mt-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300 mb-2">Critical Failures</p>
          <ul className="space-y-1 text-sm text-rose-900 dark:text-rose-100">
            {criticalFailures.map((issue, index) => (
              <li key={`${index}-${issue}`}>• {issue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {pipeline ? (
        <div className="mt-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300 mb-2">Verification Pipeline</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-indigo-900 dark:text-indigo-100">
            <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white/80 dark:bg-indigo-950/40 p-2">
              <p className="font-semibold">File Validation</p>
              <p className="mt-1">Status: {toPipelineStatusLabel(fileValidation?.valid)}</p>
              {safeArray(fileValidation?.issues).length > 0 ? (
                <p className="mt-1">Issues: {safeArray(fileValidation?.issues).slice(0, 2).join(' | ')}</p>
              ) : null}
            </div>
            <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white/80 dark:bg-indigo-950/40 p-2">
              <p className="font-semibold">AI Analysis</p>
              <p className="mt-1">Status: {ai?.success ? 'pass' : ai?.skipped ? 'skipped' : 'warning'}</p>
              <p className="mt-1">Model: {ai?.model || 'information not available'}</p>
              <p className="mt-1">Reason: {ai?.reason || verificationReason || 'information not available'}</p>
              <p className="mt-1">Confidence: {ai?.analysis?.confidence ?? 'N/A'}</p>
            </div>
            <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white/80 dark:bg-indigo-950/40 p-2">
              <p className="font-semibold">Field Matching</p>
              <p className="mt-1">Overall: {fieldMatch?.overall || 'information not available'}</p>
              <p className="mt-1">Score: {fieldMatch?.averageScore ?? 'N/A'}</p>
              {safeArray(fieldMatch?.issues).length > 0 ? (
                <p className="mt-1">Issues: {safeArray(fieldMatch?.issues).slice(0, 2).join(' | ')}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        Uploaded by {document.uploadedBy || 'system'} · Verification: {document.verification?.reviewState || 'not_required'}
      </div>
    </article>
  );
}

function StageDocumentsSection({ stageEvents = [] }) {
  const events = Array.isArray(stageEvents) ? stageEvents : [];
  const hasDocuments = events.some((event) => Array.isArray(event.documents) && event.documents.length > 0);

  if (!hasDocuments) {
    return null;
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
        <FaFileAlt className="text-blue-500" />
        Stage Documentation
      </h3>

      <div className="space-y-6">
        {events.map((event, index) => {
          const documents = safeArray(event.documents);
          if (documents.length === 0) {
            return null;
          }

          return (
            <div key={`${event.stage || 'stage'}-${index}`} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{event.stage || 'Unknown Stage'}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Recorded {formatDate(event.recordedAt || event.timestamp)}</p>
                </div>
                {event.verificationSummary?.status ? (
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${severityTone(event.verificationSummary.status)}`}>
                    {event.verificationSummary.status}
                  </span>
                ) : null}
              </div>

              {event.stageNotes ? (
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-wrap">{event.stageNotes}</p>
              ) : null}

              {event.verificationSummary?.reason ? (
                <div className="mb-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300 font-semibold mb-1">Stage verification reason</p>
                  <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap">{event.verificationSummary.reason}</p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {documents.map((document, docIndex) => (
                  <DocumentCard key={`${document.documentReference || document.title || 'document'}-${docIndex}`} document={document} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default StageDocumentsSection;
