import { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';

export function useWalletTransaction() {
  const { signer, provider, chainId } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const signAndBroadcastTransaction = useCallback(
    async (transactionRequest, options = {}) => {
      setIsProcessing(true);
      setError(null);

      try {
        if (!signer || !provider) {
          throw new Error('Wallet not connected. Please connect your wallet first.');
        }

        if (!transactionRequest) {
          throw new Error('Transaction request is required');
        }

        console.log('📋 Transaction Request:', transactionRequest);

        // Verify chain ID matches
        if (transactionRequest.chainId && chainId !== transactionRequest.chainId) {
          throw new Error(
            `Chain mismatch. Expected chain ${transactionRequest.chainId}, but connected to ${chainId}`
          );
        }

        // Build the transaction object for signing
        const txObject = {
          to: transactionRequest.to,
          data: transactionRequest.data,
          value: transactionRequest.value || '0',
          gasLimit: options.gasLimit || undefined,
          maxFeePerGas: options.maxFeePerGas || undefined,
          maxPriorityFeePerGas: options.maxPriorityFeePerGas || undefined,
        };

        console.log('🔐 Requesting wallet signature...');

        // Send transaction via signer
        const tx = await signer.sendTransaction(txObject);
        const txHash = tx.hash;

        console.log(`✅ Transaction sent: ${txHash}`);
        console.log(`⏳ Waiting for ${options.confirmations || 1} confirmation(s)...`);

        // Wait for confirmations
        const receipt = await tx.wait(options.confirmations || 1);

        if (!receipt) {
          throw new Error('Transaction failed - no receipt returned');
        }

        console.log('✅ Transaction confirmed:', {
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString(),
          status: receipt.status === 1 ? 'success' : 'failed'
        });

        return {
          hash: receipt.hash,
          txHash: receipt.hash,
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed?.toString(),
          gasPrice: receipt.gasPrice?.toString(),
          blockHash: receipt.blockHash,
          confirmations: receipt.confirmations,
          from: receipt.from,
          to: receipt.to,
          contractAddress: receipt.contractAddress,
          status: receipt.status === 1 ? 'success' : 'failed',
          success: receipt.status === 1,
          receipt,
        };
      } catch (err) {
        const errorMsg = err.reason || err.message || 'Unknown error occurred';
        console.error('❌ Transaction failed:', errorMsg);
        setError(errorMsg);

        if (err.code === 'ACTION_REJECTED') {
          throw new Error('Transaction rejected by user');
        }

        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [signer, provider, chainId]
  );

  const estimateGas = useCallback(
    async (transactionRequest) => {
      try {
        if (!provider) {
          throw new Error('Provider not available');
        }

        const gasEstimate = await provider.estimateGas({
          to: transactionRequest.to,
          data: transactionRequest.data,
          value: transactionRequest.value || '0',
        });

        return gasEstimate.toString();
      } catch (err) {
        console.warn('Gas estimation failed:', err.message);
        return null;
      }
    },
    [provider]
  );

  return {
    signAndBroadcastTransaction,
    estimateGas,
    isProcessing,
    error,
  };
}
