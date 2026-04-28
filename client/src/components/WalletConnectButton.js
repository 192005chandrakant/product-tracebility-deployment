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
        className={`interactive-lift rounded-xl bg-gradient-to-r from-[#A855F7] to-[#2DD4BF] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_22px_rgba(168,85,247,0.18)] transition-all hover:shadow-[0_0_28px_rgba(45,212,191,0.22)] disabled:opacity-50 ${className}`}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-2 shadow-sm">
        <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-100">
          {formatAddress(account)}
        </div>
        <div className="text-xs text-emerald-700 dark:text-emerald-200">
          {chainId ? getNetworkName(chainId) : 'Unknown Network'}
        </div>
      </div>
      <button
        onClick={disconnectWallet}
        className="interactive-lift rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-700 transition-all hover:bg-rose-500/15 dark:text-rose-200"
      >
        Disconnect
      </button>
    </div>
  );
}
