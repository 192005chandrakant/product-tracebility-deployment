import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { formatAddress, getNetworkName } from '../utils/walletUtils';
import { FaWallet, FaSignOutAlt, FaCircle, FaDownload } from 'react-icons/fa';

export function WalletConnectButton({ className = '' }) {
  const {
    account,
    isConnecting,
    error,
    chainId,
    connectWallet,
    disconnectWallet,
    isWalletAvailable,
  } = useWallet();

  const [showTooltip, setShowTooltip] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleConnectClick = async () => {
    try {
      await connectWallet();
    } catch (err) {
      // The provider already sets user-facing error state. This prevents uncaught UI rejections.
      console.warn('Handled wallet connect click rejection:', err?.message || err);
    }
  };

  // Show error for 5 seconds when it appears
  React.useEffect(() => {
    if (error) {
      setShowError(true);
      const t = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // MetaMask not installed
  if (!isWalletAvailable) {
    return (
      <div className={`relative ${className}`}>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-2.5 font-semibold text-white shadow-[0_0_16px_rgba(168,85,247,0.2)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_28px_rgba(168,85,247,0.4)]"
          style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.85), rgba(45,212,191,0.85))',
            border: '1px solid rgba(168,85,247,0.3)',
          }}
        >
          <FaDownload className="text-base" />
          <span className="relative font-bold tracking-wide text-sm">Install MetaMask</span>
        </a>
      </div>
    );
  }

  // Not connected
  if (!account) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={handleConnectClick}
          disabled={isConnecting}
          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-2.5 font-semibold text-white shadow-[0_0_16px_rgba(45,212,191,0.2)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_28px_rgba(45,212,191,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: isConnecting
              ? 'linear-gradient(135deg, rgba(20,184,166,0.6), rgba(13,148,136,0.6))'
              : 'linear-gradient(135deg, rgba(20,184,166,0.9), rgba(13,148,136,0.9))',
            border: '1px solid rgba(45,212,191,0.3)',
          }}
          aria-label="Connect MetaMask wallet"
        >
          {/* Shimmer sweep on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:translate-x-[150%] transition-transform duration-700 ease-out pointer-events-none" />

          <FaWallet className={`text-base ${isConnecting ? 'animate-bounce' : ''}`} />
          <span className="relative font-bold tracking-wide text-sm">
            {isConnecting ? 'Connecting…' : 'Connect Wallet'}
          </span>
        </button>

        {/* Error tooltip */}
        {showError && error && (
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 text-xs text-red-300 bg-red-950/90 border border-red-500/30 p-3 rounded-xl backdrop-blur-md z-[999] shadow-xl leading-relaxed">
            ⚠️ {error}
          </div>
        )}
      </div>
    );
  }

  // Connected
  const isSepolia = chainId === 11155111;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Connected card */}
      <div
        className="relative flex items-center gap-3 rounded-full border border-white/10 bg-[#1A1A24]/90 px-4 py-2 backdrop-blur-xl shadow-lg transition-all hover:border-emerald-400/30 cursor-default"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={`Wallet connected: ${account}`}
      >
        {/* Wallet icon with status dot */}
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_12px_rgba(52,211,153,0.35)] flex-shrink-0">
          <FaWallet className="text-white text-sm" />
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#1A1A24] ${
              isSepolia ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'
            }`}
          />
        </div>

        {/* Address and network */}
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
            {formatAddress(account)}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <FaCircle className={`text-[6px] ${isSepolia ? 'text-emerald-400' : 'text-rose-500'}`} />
            {chainId ? getNetworkName(chainId) : 'Unknown Network'}
          </span>
        </div>

        {/* Network warning tooltip */}
        {!isSepolia && showTooltip && (
          <div className="absolute top-full mt-3 right-0 w-max max-w-[220px] text-xs text-rose-300 bg-rose-950/90 border border-rose-500/30 px-3 py-2 rounded-xl backdrop-blur-md z-[999] shadow-xl leading-relaxed">
            ⚠️ Switch to Sepolia Testnet for transactions
          </div>
        )}
      </div>

      {/* Disconnect button */}
      <button
        onClick={disconnectWallet}
        className="group flex h-9 w-9 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 transition-all hover:bg-rose-500 hover:text-white hover:shadow-[0_0_14px_rgba(244,63,94,0.45)] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-[#1A1A24]"
        title="Disconnect Wallet"
        aria-label="Disconnect wallet"
      >
        <FaSignOutAlt className="text-sm transition-transform group-hover:-translate-x-0.5" />
      </button>
    </div>
  );
}

export default WalletConnectButton;
