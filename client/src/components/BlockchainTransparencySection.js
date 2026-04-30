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
      cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      icon: <FaCheckCircle className="text-emerald-500" />
    };
  }

  if (status === 'failed' || status === 'rejected') {
    return {
      cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
      icon: <FaExclamationTriangle className="text-rose-500" />
    };
  }

  return {
    cls: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
    icon: <FaCube className="text-purple-500" />
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

function Pager({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <p className="text-xs text-slate-300">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-2">
        <button type="button" className="rounded-xl border border-white/10 bg-white/8 px-2 py-1 text-xs text-slate-100 disabled:opacity-50" disabled={page <= 1} onClick={onPrev}>Previous</button>
        <button type="button" className="rounded-xl border border-white/10 bg-white/8 px-2 py-1 text-xs text-slate-100 disabled:opacity-50" disabled={page >= totalPages} onClick={onNext}>Next</button>
      </div>
    </div>
  );
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
    <section className="mt-6 rounded-[28px] border border-white/10 bg-slate-950/85 p-4 text-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.28)] backdrop-blur-xl">
      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-50">
        <FaLink className="text-purple-500" />
        Blockchain Transparency
      </h3>

      {txHash ? (
        <div className="mb-3 rounded-2xl border border-white/10 bg-white/8 p-3">
          <p className="mb-1 text-sm text-slate-300">Latest Transaction Hash</p>
          <p className="break-all font-mono text-xs text-slate-50">{txHash}</p>
          <p className="mt-1 text-xs text-slate-400">Recorded: {formatDate(latestRecordedAt)}</p>
        </div>
      ) : null}

      <div className={`mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold ${tone.cls}`}>
        {tone.icon}
        <span>Status: {status}</span>
      </div>

      {verificationBadge ? (
        <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-3 text-slate-100">
          <div className="mb-2 flex items-center gap-2">
            <FaShieldAlt className="text-cyan-500" />
            <p className="text-sm font-semibold text-slate-50">Signed Verification Badge</p>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs text-slate-200 md:grid-cols-2">
            <div className="min-w-0">
              <span className="font-semibold">Contract:</span>
              <p className="mt-1 break-all font-mono">{verificationBadge.contractAddress || 'N/A'}</p>
            </div>
            <div className="min-w-0">
              <span className="font-semibold">Latest TX:</span>
              <p className="mt-1 break-all font-mono">{verificationBadge.latestTxHash || txHash || 'N/A'}</p>
            </div>
            <div className="min-w-0">
              <span className="font-semibold">Proof Hash:</span>
              <p className="mt-1 break-all font-mono">{verificationBadge.proofHash || 'N/A'}</p>
            </div>
            <div className="min-w-0">
              <span className="font-semibold">Signature:</span>
              <p className="mt-1 break-all">{verificationBadge.signature || 'Not signed (set TRANSPARENCY_AUDIT_SIGNING_KEY)'}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Generated: {formatDate(verificationBadge.generatedAt)} | Algorithm: {verificationBadge.algorithm || 'SHA256'}
          </p>
          {verificationBadge.explorerUrl ? (
            <a href={verificationBadge.explorerUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-purple-300 hover:underline">
              <FaExternalLinkAlt />
              Verify latest transaction on explorer
            </a>
          ) : null}
        </div>
      ) : null}

      {onChainProof ? (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/8 p-3">
          <div className="mb-2 flex items-center gap-2">
            <FaShieldAlt className="text-cyan-500" />
            <p className="text-sm font-semibold text-slate-50">On-chain Consistency Check</p>
          </div>
          <p className="text-xs text-slate-300">
            {onChainProof.available
              ? (onChainProof.matches ? 'Database and on-chain product fields are aligned.' : 'Detected mismatch between database and on-chain fields.')
              : 'On-chain proof currently unavailable.'}
          </p>
        </div>
      ) : null}

      {stageProofs.length > 0 ? (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-semibold text-slate-50">Stage-to-Transaction Proofs</h4>
          <div className="space-y-2">
            {visibleStageProofs.map((proof, index) => {
              const absoluteIndex = (stageProofPage - 1) * pageSize + index;
              const proofTone = statusTone(proof.status || 'pending');
              return (
                <article key={`${proof.txHash || proof.stage || 'stage-proof'}-${absoluteIndex}`} className="rounded-2xl border border-white/10 bg-white/8 p-3 text-slate-100">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-purple-500/15 px-2 py-1 text-xs font-semibold text-purple-100">
                      {proof.stage || 'Unknown Stage'}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${proofTone.cls}`}>{proof.status || 'pending'}</span>
                  </div>
                  {proof.txHash ? <p className="break-all font-mono text-xs text-slate-50">{proof.txHash}</p> : null}
                  {proof.explorerUrl ? (
                    <a href={proof.explorerUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-purple-300 hover:underline">
                      <FaExternalLinkAlt />
                      Open in explorer
                    </a>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-400">{formatDate(proof.recordedAt)}</p>
                  {proof.verificationStatus ? <p className="mt-1 text-xs text-slate-300">Verification: {proof.verificationStatus}</p> : null}
                  {proof.verificationReason ? <p className="mt-1 whitespace-pre-wrap text-xs text-slate-300">{proof.verificationReason}</p> : null}
                </article>
              );
            })}
          </div>
          <Pager
            page={stageProofPage}
            totalPages={stageProofTotalPages}
            onPrev={() => setStageProofPage((page) => Math.max(page - 1, 1))}
            onNext={() => setStageProofPage((page) => Math.min(page + 1, stageProofTotalPages))}
          />
        </div>
      ) : null}

      {events.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-50">Ledger Events</h4>
          {visibleLedgerEvents.map((event, index) => {
            const absoluteIndex = (ledgerPage - 1) * pageSize + index;
            const eventTone = statusTone(event.status || status);
            return (
              <article key={`${event.txHash || 'event'}-${absoluteIndex}`} className="rounded-2xl border border-white/10 bg-white/8 p-3 text-slate-100">
                <div className="mb-2 flex items-center gap-2">
                  {eventTone.icon}
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${eventTone.cls}`}>{event.status || 'pending'}</span>
                  {event.action ? (
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-slate-100">
                      {event.action}
                    </span>
                  ) : null}
                </div>
                {event.txHash ? <p className="break-all font-mono text-xs text-slate-50">{event.txHash}</p> : null}
                {event.explorerUrl ? (
                  <a href={event.explorerUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-purple-300 hover:underline">
                    <FaExternalLinkAlt />
                    Explorer transaction
                  </a>
                ) : null}
                {event.stage ? <p className="mt-1 text-xs text-slate-300">Stage: {event.stage}</p> : null}
                {event.initiatedBy ? (
                  <p className="mt-1 flex min-w-0 items-start gap-1 text-xs text-slate-300">
                    <FaUserShield className="mt-0.5 shrink-0 text-slate-400" />
                    <span className="min-w-0 break-all">Initiated by: {canViewOperatorDetails ? event.initiatedBy : maskValue(event.initiatedBy)}</span>
                  </p>
                ) : null}
                {canViewOperatorDetails && event.initiatedByRole ? <p className="mt-1 text-xs text-slate-300">Role: {event.initiatedByRole}</p> : null}
                {event.errorMessage ? <p className="mt-1 whitespace-pre-wrap text-xs text-rose-300">{event.errorMessage}</p> : null}
                <p className="mt-1 text-xs text-slate-400">{formatDate(event.recordedAt || event.timestamp)}</p>
              </article>
            );
          })}
          <Pager
            page={ledgerPage}
            totalPages={ledgerTotalPages}
            onPrev={() => setLedgerPage((page) => Math.max(page - 1, 1))}
            onNext={() => setLedgerPage((page) => Math.min(page + 1, ledgerTotalPages))}
          />
        </div>
      ) : null}
    </section>
  );
}

export default BlockchainTransparencySection;
