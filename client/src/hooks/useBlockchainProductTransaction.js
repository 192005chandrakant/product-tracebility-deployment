import React, { useState, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { useWalletTransaction } from '../hooks/useWalletTransaction';
import { getExplorerUrl } from '../utils/walletUtils';
import { toast } from 'react-toastify';

/**
 * Hook to handle blockchain transaction flow for product operations.
 * Coordinates between API unsigned requests and wallet signing.
 *
 * Key design decisions:
 * - processProductTransaction **never** throws — callers get `{ success, error }` back.
 * - If the wallet is not connected or on the wrong chain the hook gracefully
 *   returns an error result instead of throwing, preventing React error-boundary
 *   crashes in AddProduct / UpdateProduct.
 */
export function useBlockchainProductTransaction() {
  const { isConnected, account, chainId, error: walletError } = useWallet();
  const { signAndBroadcastTransaction, isProcessing } = useWalletTransaction();
  const [blockchainState, setBlockchainState] = useState({
    status: 'idle', // idle | pending_api | signing | broadcasting | confirmed | failed
    transactionHash: null,
    explorerUrl: null,
    error: null,
    receipt: null,
  });

  const processProductTransaction = useCallback(
    async (apiCall, options = {}) => {
      // ── Pre-flight checks ────────────────────────────────────────────────
      if (!isConnected) {
        const msg = 'Wallet not connected. Please connect your wallet first.';
        setBlockchainState({
          status: 'failed',
          transactionHash: null,
          explorerUrl: null,
          error: msg,
          receipt: null,
        });
        toast.error(msg);
        return { success: false, error: msg };
      }

      if (chainId !== 11155111) {
        const msg = 'Wrong network. Please switch to Sepolia Testnet (Chain ID: 11155111).';
        setBlockchainState({
          status: 'failed',
          transactionHash: null,
          explorerUrl: null,
          error: msg,
          receipt: null,
        });
        toast.error(msg);
        return { success: false, error: msg };
      }

      // ── Step 1: Call API ──────────────────────────────────────────────────
      try {
        setBlockchainState({
          status: 'pending_api',
          transactionHash: null,
          explorerUrl: null,
          error: null,
          receipt: null,
        });

        console.log('📡 Calling API to get transaction request...');

        const apiResponse = await apiCall();
        const transactionRequest = apiResponse?.data?.transactionRequest;

        if (!transactionRequest) {
          // API may have already confirmed (receipt was submitted)
          if (apiResponse?.data?.blockchainTx) {
            setBlockchainState({
              status: 'confirmed',
              transactionHash: apiResponse.data.blockchainTx,
              explorerUrl: getExplorerUrl(apiResponse.data.blockchainTx, chainId),
              error: null,
              receipt: null,
            });
            toast.success('✅ Transaction already confirmed on blockchain!');
            return {
              success: true,
              txHash: apiResponse.data.blockchainTx,
              receipt: apiResponse.data,
            };
          }

          // No transaction request returned — still treat as success for the
          // API operation itself (product was registered/updated in DB).
          console.log('ℹ️ No blockchain transaction request returned — API-only success.');
          setBlockchainState({
            status: 'confirmed',
            transactionHash: null,
            explorerUrl: null,
            error: null,
            receipt: apiResponse?.data || null,
          });
          return {
            success: true,
            txHash: null,
            receipt: apiResponse?.data || null,
          };
        }

        // ── Step 2: Sign transaction ──────────────────────────────────────
        console.log('✓ Received transaction request from API');
        setBlockchainState((prev) => ({
          ...prev,
          status: 'signing',
        }));
        console.log('🔐 Requesting wallet signature...');
        toast.info('Please sign the transaction in your wallet…');

        const receipt = await signAndBroadcastTransaction(transactionRequest, {
          confirmations: options.confirmations || 1,
          gasLimit: options.gasLimit,
          maxFeePerGas: options.maxFeePerGas,
          maxPriorityFeePerGas: options.maxPriorityFeePerGas,
        });

        console.log('✓ Transaction signed and broadcast:', receipt.hash);

        setBlockchainState({
          status: 'broadcasting',
          transactionHash: receipt.hash,
          explorerUrl: getExplorerUrl(receipt.hash, chainId),
          error: null,
          receipt,
        });

        toast.info(`⏳ Transaction broadcast: ${receipt.hash}`);

        // ── Step 3: Submit receipt back to API ────────────────────────────
        console.log('📤 Submitting transaction receipt to API...');

        const receiptEndpoint =
          options.receiptEndpoint ||
          `/api/product/${options.productId}/blockchain-receipt`;

        const receiptResponse = await fetch(receiptEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            blockchainReceipt: receipt,
            transactionHash: receipt.hash,
            stage: options.stage || null,
          }),
        });

        if (!receiptResponse.ok) {
          let errorData;
          try {
            errorData = await receiptResponse.json();
          } catch {
            errorData = {};
          }
          throw new Error(
            errorData.error || `Failed to submit receipt: ${receiptResponse.statusText}`
          );
        }

        const finalResponse = await receiptResponse.json();

        setBlockchainState({
          status: 'confirmed',
          transactionHash: receipt.hash,
          explorerUrl: getExplorerUrl(receipt.hash, chainId),
          error: null,
          receipt: finalResponse,
        });

        toast.success('✅ Transaction confirmed and recorded on blockchain!');

        return {
          success: true,
          txHash: receipt.hash,
          receipt: finalResponse,
        };
      } catch (err) {
        const errorMsg = err?.reason || err?.message || 'Unknown error occurred';
        console.error('❌ Blockchain transaction failed:', errorMsg);

        setBlockchainState({
          status: 'failed',
          transactionHash: null,
          explorerUrl: null,
          error: errorMsg,
          receipt: null,
        });

        toast.error(`❌ Transaction failed: ${errorMsg}`);

        // Return error result instead of throwing — prevents crash
        return { success: false, error: errorMsg };
      }
    },
    [isConnected, chainId, signAndBroadcastTransaction]
  );

  return {
    processProductTransaction,
    blockchainState,
    isProcessing,
    walletError,
    isConnected,
    account,
    chainId,
  };
}

/**
 * Component to display blockchain transaction progress.
 */
export function BlockchainTransactionProgress({ state }) {
  if (!state || state.status === 'idle') {
    return null; // Don't render anything when idle
  }

  const statusConfig = {
    pending_api: {
      icon: '📡',
      label: 'Contacting API…',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      border: 'border-blue-300 dark:border-blue-700',
      text: 'text-blue-800 dark:text-blue-200',
    },
    signing: {
      icon: '🔐',
      label: 'Waiting for wallet signature…',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      border: 'border-amber-300 dark:border-amber-700',
      text: 'text-amber-800 dark:text-amber-200',
    },
    broadcasting: {
      icon: '📤',
      label: 'Broadcasting transaction…',
      bg: 'bg-purple-50 dark:bg-purple-900/30',
      border: 'border-purple-300 dark:border-purple-700',
      text: 'text-purple-800 dark:text-purple-200',
    },
    confirmed: {
      icon: '✅',
      label: 'Confirmed on blockchain!',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      border: 'border-emerald-300 dark:border-emerald-700',
      text: 'text-emerald-800 dark:text-emerald-200',
    },
    failed: {
      icon: '❌',
      label: 'Transaction failed',
      bg: 'bg-red-50 dark:bg-red-900/30',
      border: 'border-red-300 dark:border-red-700',
      text: 'text-red-800 dark:text-red-200',
    },
  };

  const config = statusConfig[state.status];
  if (!config) return null;

  return (
    <div className={`p-4 rounded-xl border-2 ${config.bg} ${config.border} transition-all duration-300`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{config.icon}</span>
        <div>
          <p className={`font-semibold ${config.text}`}>{config.label}</p>
          {state.error && (
            <p className={`text-sm ${config.text} opacity-80 mt-1`}>{state.error}</p>
          )}
        </div>
      </div>

      {state.transactionHash && (
        <div className="mt-3 text-sm">
          <a
            href={state.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline"
          >
            View on Explorer: {state.transactionHash.slice(0, 10)}…
          </a>
        </div>
      )}
    </div>
  );
}
