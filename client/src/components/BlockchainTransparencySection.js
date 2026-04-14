import React, { useEffect, useMemo, useState } from 'react';
import { FaLink, FaCube, FaCheckCircle, FaExclamationTriangle, FaExternalLinkAlt, FaShieldAlt, FaUserShield } from 'react-icons/fa';

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
}

function statusTone(status) {
  if (status === 'confirmed' || status === 'success') {
    return {
      cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      icon: <FaCheckCircle className="text-green-600" />
    };
  }

  if (status === 'failed' || status === 'rejected') {
    return {
      cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      icon: <FaExclamationTriangle className="text-red-600" />
    };
  }

  return {
    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    icon: <FaCube className="text-amber-600" />
  };
}

function normalizeLedgerEvents(product) {
  const transparencyEvents = Array.isArray(product?.transparency?.ledgerEvents)
    ? product.transparency.ledgerEvents
    : [];

  if (transparencyEvents.length > 0) {
    return transparencyEvents;
  }

  const fallback = Array.isArray(product?.blockchainEvents) ? product.blockchainEvents : [];
  return fallback.map((event) => ({
    ...event,
    txHash: event.txHash || event.transactionHash || null,
    recordedAt: event.recordedAt || event.timestamp || null
  }));
}

function normalizeStageProofs(product) {
  const proofs = Array.isArray(product?.transparency?.stageProofs)
    ? product.transparency.stageProofs
    : [];

  if (proofs.length > 0) {
    return proofs;
  }

  const stageEvents = Array.isArray(product?.stageEvents) ? product.stageEvents : [];
  return stageEvents
    .filter((event) => event && event.blockchainTxHash)
    .map((event) => ({
      stage: event.stage || 'Unknown',
      txHash: event.blockchainTxHash,
      status: 'confirmed',
      recordedAt: event.recordedAt || event.timestamp || null,
      updatedBy: event.updatedBy || null,
      location: event.location || null,
      verificationStatus: event.verificationSummary?.status || null,
      verificationReason: event.verificationSummary?.reason || null,
      explorerUrl: null
    }));
}

function maskValue(value) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return 'N/A';
  }

  if (normalized.length <= 6) {
    return `${normalized.slice(0, 2)}...`;
  }

  return `${normalized.slice(0, 3)}...${normalized.slice(-3)}`;
}

function isOwnerOrAdmin(user, product) {
  if (!user || !product) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  const ownerEmail = String(product.createdByWallet || '').toLowerCase();
  const userEmail = String(user.email || '').toLowerCase();
  return Boolean(ownerEmail && userEmail && ownerEmail === userEmail);
}

function getTotalPages(length, pageSize) {
  return Math.max(Math.ceil(length / pageSize), 1);
}

function BlockchainTransparencySection({ product, user }) {
  const sourceProduct = product || {};

  const events = normalizeLedgerEvents(sourceProduct);
  const stageProofs = normalizeStageProofs(sourceProduct);
  const txHash = sourceProduct.transparency?.summary?.latestTxHash || sourceProduct.blockchainTx || sourceProduct.lastTxHash || null;
  const status = sourceProduct.transparency?.summary?.latestStatus || sourceProduct.blockchainStatus || 'pending';
  const tone = statusTone(status);
  const canViewOperatorDetails = isOwnerOrAdmin(user, sourceProduct);
  const onChainProof = sourceProduct.transparency?.onChainProof || null;
  const latestRecordedAt = sourceProduct.transparency?.summary?.latestRecordedAt || sourceProduct.blockchainUpdatedAt || null;
  const verificationBadge = sourceProduct.transparency?.verificationBadge || null;

  const [ledgerPage, setLedgerPage] = useState(1);
  const [stageProofPage, setStageProofPage] = useState(1);
  const pageSize = 5;

  const ledgerTotalPages = getTotalPages(events.length, pageSize);
  const stageProofTotalPages = getTotalPages(stageProofs.length, pageSize);

  useEffect(() => {
    setLedgerPage(1);
    setStageProofPage(1);
  }, [sourceProduct?.productId]);

  useEffect(() => {
    if (ledgerPage > ledgerTotalPages) {
      setLedgerPage(ledgerTotalPages);
    }
  }, [ledgerPage, ledgerTotalPages]);

  useEffect(() => {
    if (stageProofPage > stageProofTotalPages) {
      setStageProofPage(stageProofTotalPages);
    }
  }, [stageProofPage, stageProofTotalPages]);

  const visibleLedgerEvents = useMemo(() => {
    const start = (ledgerPage - 1) * pageSize;
    return events.slice(start, start + pageSize);
  }, [events, ledgerPage]);

  const visibleStageProofs = useMemo(() => {
    const start = (stageProofPage - 1) * pageSize;
    return stageProofs.slice(start, start + pageSize);
  }, [stageProofs, stageProofPage]);

  if (!txHash && events.length === 0 && stageProofs.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
        <FaLink className="text-cyan-500" />
        Blockchain Transparency
      </h3>

      {txHash ? (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/70 mb-3">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Latest Transaction Hash</p>
          <p className="font-mono text-xs break-all text-slate-800 dark:text-slate-200">{txHash}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Recorded: {formatDate(latestRecordedAt)}</p>
        </div>
      ) : null}

      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${tone.cls}`}>
        {tone.icon}
        <span>Status: {status}</span>
      </div>

      {verificationBadge ? (
        <div className="mb-4 rounded-lg border border-sky-200 dark:border-sky-800 p-3 bg-sky-50 dark:bg-sky-900/20">
          <div className="flex items-center gap-2 mb-2">
            <FaShieldAlt className="text-sky-600" />
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Signed Verification Badge</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
            <div className="min-w-0">
              <span className="font-semibold">Contract:</span>
              <p className="mt-1 font-mono break-all">{verificationBadge.contractAddress || 'N/A'}</p>
            </div>
            <div className="min-w-0">
              <span className="font-semibold">Latest TX:</span>
              <p className="mt-1 font-mono break-all">{verificationBadge.latestTxHash || txHash || 'N/A'}</p>
            </div>
            <div className="min-w-0">
              <span className="font-semibold">Proof Hash:</span>
              <p className="mt-1 font-mono break-all">{verificationBadge.proofHash || 'N/A'}</p>
            </div>
            <div className="min-w-0">
              <span className="font-semibold">Signature:</span>
              <p className="mt-1 break-all">{verificationBadge.signature || 'Not signed (set TRANSPARENCY_AUDIT_SIGNING_KEY)'}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Generated: {formatDate(verificationBadge.generatedAt)} | Algorithm: {verificationBadge.algorithm || 'SHA256'}
          </p>
          {verificationBadge.explorerUrl ? (
            <a href={verificationBadge.explorerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
              <FaExternalLinkAlt />
              Verify latest transaction on explorer
            </a>
          ) : null}
        </div>
      ) : null}

      {onChainProof ? (
        <div className="mb-4 rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/70">
          <div className="flex items-center gap-2 mb-2">
            <FaShieldAlt className="text-cyan-600" />
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">On-chain Consistency Check</p>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {onChainProof.available
              ? (onChainProof.matches ? 'Database and on-chain product fields are aligned.' : 'Detected mismatch between database and on-chain fields.')
              : 'On-chain proof currently unavailable.'}
          </p>
        </div>
      ) : null}

      {stageProofs.length > 0 ? (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Stage-to-Transaction Proofs</h4>
          <div className="space-y-2">
            {visibleStageProofs.map((proof, index) => {
              const absoluteIndex = (stageProofPage - 1) * pageSize + index;
              const proofTone = statusTone(proof.status || 'pending');
              return (
                <article key={`${proof.txHash || proof.stage || 'stage-proof'}-${absoluteIndex}`} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/60">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      {proof.stage || 'Unknown Stage'}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${proofTone.cls}`}>{proof.status || 'pending'}</span>
                  </div>
                  {proof.txHash ? <p className="font-mono text-xs break-all text-slate-800 dark:text-slate-200">{proof.txHash}</p> : null}
                  {proof.explorerUrl ? (
                    <a href={proof.explorerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      <FaExternalLinkAlt />
                      Open in explorer
                    </a>
                  ) : null}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatDate(proof.recordedAt)}</p>
                  {proof.verificationStatus ? (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Verification: {proof.verificationStatus}</p>
                  ) : null}
                  {proof.verificationReason ? (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">{proof.verificationReason}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
          {stageProofTotalPages > 1 ? (
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">Page {stageProofPage} of {stageProofTotalPages}</p>
              <div className="flex items-center gap-2">
                <button type="button" className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50" disabled={stageProofPage <= 1} onClick={() => setStageProofPage((page) => Math.max(page - 1, 1))}>Previous</button>
                <button type="button" className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50" disabled={stageProofPage >= stageProofTotalPages} onClick={() => setStageProofPage((page) => Math.min(page + 1, stageProofTotalPages))}>Next</button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {events.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ledger Events</h4>
          {visibleLedgerEvents.map((event, index) => {
            const absoluteIndex = (ledgerPage - 1) * pageSize + index;
            const eventTone = statusTone(event.status || status);
            return (
              <article key={`${event.txHash || 'event'}-${absoluteIndex}`} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2 mb-2">
                  {eventTone.icon}
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${eventTone.cls}`}>{event.status || 'pending'}</span>
                  {event.action ? (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {event.action}
                    </span>
                  ) : null}
                </div>
                {event.txHash ? <p className="font-mono text-xs break-all text-slate-800 dark:text-slate-200">{event.txHash}</p> : null}
                {event.explorerUrl ? (
                  <a href={event.explorerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    <FaExternalLinkAlt />
                    Explorer transaction
                  </a>
                ) : null}
                {event.stage ? (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Stage: {event.stage}</p>
                ) : null}
                {event.initiatedBy ? (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-start gap-1 min-w-0">
                    <FaUserShield className="text-slate-500 mt-0.5 shrink-0" />
                    <span className="min-w-0 break-all">Initiated by: {canViewOperatorDetails ? event.initiatedBy : maskValue(event.initiatedBy)}</span>
                  </p>
                ) : null}
                {canViewOperatorDetails && event.initiatedByRole ? (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Role: {event.initiatedByRole}</p>
                ) : null}
                {event.errorMessage ? (
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 whitespace-pre-wrap">{event.errorMessage}</p>
                ) : null}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatDate(event.recordedAt || event.timestamp)}</p>
              </article>
            );
          })}
          {ledgerTotalPages > 1 ? (
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">Page {ledgerPage} of {ledgerTotalPages}</p>
              <div className="flex items-center gap-2">
                <button type="button" className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50" disabled={ledgerPage <= 1} onClick={() => setLedgerPage((page) => Math.max(page - 1, 1))}>Previous</button>
                <button type="button" className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50" disabled={ledgerPage >= ledgerTotalPages} onClick={() => setLedgerPage((page) => Math.min(page + 1, ledgerTotalPages))}>Next</button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default BlockchainTransparencySection;
