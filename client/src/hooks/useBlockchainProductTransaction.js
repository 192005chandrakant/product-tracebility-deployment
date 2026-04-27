import React, { useState, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { useWalletTransaction } from '../hooks/useWalletTransaction';
import { WalletConnectButton } from '../components/WalletConnectButton';
import { getExplorerUrl } from '../utils/walletUtils';
import { toast } from 'react-toastify';

/**
 * Hook to handle blockchain transaction flow for product operations
 * Coordinates between API unsigned requests and wallet signing
 */
export function useBlockchainProductTransaction() {
  const { isConnected, account, chainId, error: walletError } = useWallet();
  const { signAndBroadcastTransaction, isProcessing } = useWalletTransaction();
  const [blockchainState, setBlockchainState] = useState({
    status: 'idle', // idle, pending_api, signing, broadcasting, confirmed, failed
    transactionHash: null,
    explorerUrl: null,
    error: null,
    receipt: null,
  });

  const processProductTransaction = useCallback(
    async (apiCall, options = {}) => {
      try {
        if (!isConnected) {
          throw new Error('Wallet not connected. Please connect your wallet first.');
        }

        if (chainId !== 11155111) {
          throw new Error(
            'Wrong network. Please connect to Sepolia testnet (Chain ID: 11155111)'
          );
        }

        setBlockchainState({
          status: 'pending_api',
          transactionHash: null,
          explorerUrl: null,
          error: null,
          receipt: null,
        });

        console.log('📡 Calling API to get transaction request...');

        // Step 1: Call API to get unsigned transaction request
        const apiResponse = await apiCall();

        const transactionRequest = apiResponse?.data?.transactionRequest;

        if (!transactionRequest) {
          // If no transaction request, API may have already confirmed (e.g., receipt was submitted)
          if (apiResponse?.data?.blockchainTx) {
            setBlockchainState({
              status: 'confirmed',
              transactionHash: apiResponse.data.blockchainTx,
              explorerUrl: getExplorerUrl(
                apiResponse.data.blockchainTx,
                chainId
              ),
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

          throw new Error('No transaction request returned from API');
        }

        console.log('✓ Received transaction request from API');

        setBlockchainState((prev) => ({
          ...prev,
          status: 'signing',
        }));

        // Step 2: User signs transaction in wallet
        console.log('🔐 Requesting wallet signature...');
        toast.info('Please sign the transaction in your wallet...');

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

        // Step 3: Submit receipt back to API to mark as confirmed
        console.log('📤 Submitting transaction receipt to API...');

        const receiptResponse = await fetch(
          `${options.receiptEndpoint || '/api/products/product/' + options.productId + '/blockchain-receipt'}`,
          {
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
          }
        );

        if (!receiptResponse.ok) {
          const errorData = await receiptResponse.json();
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

        toast.success(`✅ Transaction confirmed and recorded in blockchain!`);

        return {
          success: true,
          txHash: receipt.hash,
          receipt: finalResponse,
        };
      } catch (err) {
        const errorMsg = err.message || 'Unknown error occurred';
        console.error('❌ Blockchain transaction failed:', errorMsg);

        setBlockchainState({
          status: 'failed',
          transactionHash: null,
          explorerUrl: null,
          error: errorMsg,
          receipt: null,
        });

        toast.error(`❌ Transaction failed: ${errorMsg}`);

        throw err;
      }
    },
    [isConnected, chainId, signAndBroadcastTransaction]
  );

  return {
    ...blockchainState,
    isProcessing,
    walletError,
    isConnected,
    account,
    chainId,
    processProductTransaction,
  };
}

/**
 * Component to display blockchain transaction progress
 */
export function BlockchainTransactionProgress({ state }) {
  const statusConfig = {
    idle: { icon: '⏱️', label: 'Ready to submit', color: 'gray' },
    pending_api: {
      icon: '📡',
      label: 'Contacting API...',
      color: 'blue',
    },
    signing: { icon: '🔐', label: 'Waiting for wallet signature...', color: 'orange' },
    broadcasting: { icon: '📤', label: 'Broadcasting transaction...', color: 'purple' },
    confirmed: {
      icon: '✅',
      label: 'Confirmed on blockchain!',
      color: 'green',
    },
    failed: { icon: '❌', label: 'Transaction failed', color: 'red' },
  };

  const config = statusConfig[state.status] || statusConfig.idle;

  return (
    <div
      className={`p-4 rounded-lg border-2 bg-${config.color}-50 border-${config.color}-300 dark:bg-${config.color}-900 dark:border-${config.color}-700`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{config.icon}</span>
        <div>
          <p className={`font-semibold text-${config.color}-800 dark:text-${config.color}-100`}>
            {config.label}
          </p>
          {state.error && (
            <p className={`text-sm text-${config.color}-700 dark:text-${config.color}-200`}>
              {state.error}
            </p>
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
            View on Explorer: {state.transactionHash.slice(0, 10)}...
          </a>
        </div>
      )}
    </div>
  );
}
