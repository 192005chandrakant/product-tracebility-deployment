import React from 'react';
import { useWallet } from '../context/WalletContext';
import { formatAddress, getNetworkName } from '../utils/walletUtils';

export function WalletConnectButton({ className = '' }) {
  const { account, isConnecting, error, chainId, connectWallet, disconnectWallet } = useWallet();

  if (!account) {
    return (
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors ${className}`}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="px-4 py-2 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg">
        <div className="text-sm font-semibold text-green-800 dark:text-green-100">
          {formatAddress(account)}
        </div>
        <div className="text-xs text-green-700 dark:text-green-200">
          {chainId ? getNetworkName(chainId) : 'Unknown Network'}
        </div>
      </div>
      <button
        onClick={disconnectWallet}
        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
      >
        Disconnect
      </button>
    </div>
  );
}
