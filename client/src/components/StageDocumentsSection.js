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
    return 'border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  }

  if (status === 'blocked' || status === 'rejected') {
    return 'border-rose-300/30 bg-rose-500/10 text-rose-700 dark:text-rose-300';
  }

  if (status === 'flagged' || status === 'pending_review') {
    return 'border-amber-300/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';
  }

  return 'border-slate-300/30 bg-slate-500/10 text-slate-700 dark:text-slate-300';
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

function PipelineCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/40 p-3 text-xs text-slate-700 shadow-sm dark:bg-white/5 dark:text-slate-200">
      <p className="mb-1 font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{title}</p>
      {children}
    </div>
  );
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
    <article className="interactive-lift rounded-[24px] border border-white/10 bg-white/70 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] dark:bg-white/5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/60 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-white/5 dark:text-slate-300">
            <FaFileAlt className="text-purple-500" />
            {document.documentType || 'document'}
          </div>
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{document.title || 'Untitled document'}</h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {document.documentReference || 'No reference'} | {formatDate(document.uploadedAt || document.recordedAt)}
          </p>
        </div>

        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${tone}`}>
          <FaShieldAlt />
          {status}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
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
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400"><span className="font-semibold">Notes:</span> {document.notes}</p>
      ) : null}

      {document.verificationNotes ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400"><span className="font-semibold">Verification Notes:</span> {document.verificationNotes}</p>
      ) : null}

      {verificationReason ? (
        <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-500/8 p-3 text-sm text-slate-700 dark:text-slate-200">
          <span className="font-semibold">Verification Reason:</span> {verificationReason}
        </div>
      ) : null}

      {url ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer" className="interactive-lift inline-flex items-center gap-2 rounded-xl border border-purple-300/30 bg-purple-500/10 px-3 py-2 text-sm font-semibold text-purple-700 dark:text-purple-200">
            <FaEye />
            View File
          </a>
          <a href={url} target="_blank" rel="noopener noreferrer" download className="interactive-lift inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/60 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-white/5 dark:text-slate-300">
            <FaDownload />
            Download
          </a>
          {document.file?.fileName ? (
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/40 px-3 py-2 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-400">
              <FaExternalLinkAlt />
              {document.file.fileName}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-purple-300/30 bg-white/40 px-4 py-3 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
          No uploaded file available for this document.
        </div>
      )}

      {issues.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">Verification Issues</p>
          <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-100">
            {issues.map((issue, index) => (
              <li key={`${index}-${issue}`}>- {issue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {criticalFailures.length > 0 ? (
        <div className="mt-3 rounded-2xl border border-rose-300/30 bg-rose-500/10 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 dark:text-rose-300">Critical Failures</p>
          <ul className="space-y-1 text-sm text-rose-900 dark:text-rose-100">
            {criticalFailures.map((issue, index) => (
              <li key={`${index}-${issue}`}>- {issue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {pipeline ? (
        <div className="mt-4 rounded-[24px] border border-purple-300/20 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),rgba(45,212,191,0.08),transparent)] p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-purple-700 dark:text-purple-300">Verification Pipeline</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <PipelineCard title="File Validation">
              <p>Status: {toPipelineStatusLabel(fileValidation?.valid)}</p>
              {safeArray(fileValidation?.issues).length > 0 ? (
                <p className="mt-1">Issues: {safeArray(fileValidation?.issues).slice(0, 2).join(' | ')}</p>
              ) : null}
            </PipelineCard>
            <PipelineCard title="AI Analysis">
              <p>Status: {ai?.success ? 'pass' : ai?.skipped ? 'skipped' : 'warning'}</p>
              <p className="mt-1">Model: {ai?.model || 'information not available'}</p>
              <p className="mt-1">Reason: {ai?.reason || verificationReason || 'information not available'}</p>
              <p className="mt-1">Confidence: {ai?.analysis?.confidence ?? 'N/A'}</p>
            </PipelineCard>
            <PipelineCard title="Field Matching">
              <p>Overall: {fieldMatch?.overall || 'information not available'}</p>
              <p className="mt-1">Score: {fieldMatch?.averageScore ?? 'N/A'}</p>
              {safeArray(fieldMatch?.issues).length > 0 ? (
                <p className="mt-1">Issues: {safeArray(fieldMatch?.issues).slice(0, 2).join(' | ')}</p>
              ) : null}
            </PipelineCard>
          </div>
        </div>
      ) : null}

      <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        Uploaded by {document.uploadedBy || 'system'} | Verification: {document.verification?.reviewState || 'not_required'}
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
    <section className="mt-6 rounded-[28px] border border-white/10 bg-white/75 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:bg-white/5 sm:p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
        <FaFileAlt className="text-purple-500" />
        Stage Documentation
      </h3>

      <div className="space-y-6">
        {events.map((event, index) => {
          const documents = safeArray(event.documents);
          if (documents.length === 0) {
            return null;
          }

          return (
            <div key={`${event.stage || 'stage'}-${index}`} className="rounded-[24px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.82),rgba(245,243,255,0.7))] p-4 dark:bg-white/5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{event.stage || 'Unknown Stage'}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Recorded {formatDate(event.recordedAt || event.timestamp)}</p>
                </div>
                {event.verificationSummary?.status ? (
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${severityTone(event.verificationSummary.status)}`}>
                    {event.verificationSummary.status}
                  </span>
                ) : null}
              </div>

              {event.stageNotes ? (
                <p className="mb-4 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{event.stageNotes}</p>
              ) : null}

              {event.verificationSummary?.reason ? (
                <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/8 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Stage verification reason</p>
                  <p className="text-sm text-cyan-900 dark:text-cyan-100 whitespace-pre-wrap">{event.verificationSummary.reason}</p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
