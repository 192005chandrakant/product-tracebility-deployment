import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext(null);

/**
 * Detect if a MetaMask-compatible wallet is available in the browser.
 * Returns true if window.ethereum is present, false otherwise.
 */
function isWalletAvailable() {
  return (
    typeof window !== 'undefined' &&
    typeof window.ethereum !== 'undefined' &&
    window.ethereum !== null
  );
}

function hasAuthSession() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(localStorage.getItem('token'));
}

/**
 * Map MetaMask/EIP-1193 error codes to human-readable messages.
 */
function getWalletErrorMessage(err) {
  if (!err) return 'Unknown wallet error';

  const rawMessage = String(err.message || err.reason?.message || err.reason || '').toLowerCase();

  // User rejected the request
  if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
    return 'Connection request was cancelled. Please try again.';
  }

  // Already processing a request
  if (err.code === -32002) {
    return 'A connection request is already pending in MetaMask. Please open MetaMask and approve it.';
  }

  // Wallet locked
  if (err.code === -32603 && err.message?.toLowerCase().includes('lock')) {
    return 'MetaMask is locked. Please unlock it and try again.';
  }

  // Generic MetaMask internal errors — don't surface raw internal messages
  if (
    rawMessage.includes('failed to connect to metamask') ||
    rawMessage.includes('inpage.js') ||
    rawMessage.includes('metamask rpc error')
  ) {
    return 'MetaMask encountered an internal error. Please reload the page and try again.';
  }

  return err.message || 'Failed to connect wallet';
}

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const isConnectingRef = useRef(false);

  // ─── Core connect logic ──────────────────────────────────────────────────────
  const connectWallet = useCallback(async () => {
    // Prevent concurrent connection attempts
    if (isConnectingRef.current) return;

    setError(null);

    if (!isWalletAvailable()) {
      setError('MetaMask not found. Please install the MetaMask browser extension.');
      return;
    }

    isConnectingRef.current = true;
    setIsConnecting(true);

    try {
      // Step 1: Request accounts — this prompts the MetaMask popup
      let accounts;
      try {
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (requestErr) {
        // User cancelled, pending request, etc.
        throw new Error(getWalletErrorMessage(requestErr));
      }

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask and try again.');
      }

      // Step 2: Build ethers provider AFTER accounts are available
      const web3Provider = new ethers.BrowserProvider(window.ethereum);

      // Step 3: Get signer and network
      const [walletSigner, network] = await Promise.all([
        web3Provider.getSigner(),
        web3Provider.getNetwork(),
      ]);

      setProvider(web3Provider);
      setSigner(walletSigner);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));

      console.log(`✅ Wallet connected: ${accounts[0]} on chain ${network.chainId}`);
    } catch (err) {
      const message = getWalletErrorMessage(err);
      console.warn('Wallet connection error:', message);
      setError(message);
      // Clear any partial state
      setProvider(null);
      setSigner(null);
      setAccount(null);
      setChainId(null);
    } finally {
      isConnectingRef.current = false;
      setIsConnecting(false);
    }
  }, []);

  // ─── Disconnect ──────────────────────────────────────────────────────────────
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setError(null);
    console.log('🔌 Wallet disconnected');
  }, []);

  // ─── Switch Network ──────────────────────────────────────────────────────────
  const switchNetwork = useCallback(async (targetChainId) => {
    if (!isWalletAvailable()) {
      setError('Wallet not available');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });

      // Update chain state after switch
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const network = await web3Provider.getNetwork();
      setProvider(web3Provider);
      setSigner(await web3Provider.getSigner());
      setChainId(Number(network.chainId));
      console.log(`✅ Switched to chain ${network.chainId}`);
    } catch (err) {
      const message = getWalletErrorMessage(err);
      console.warn('Network switch error:', message);
      setError(message);
    }
  }, []);

  // ─── Auto-reconnect for already-approved sessions ────────────────────────────
  useEffect(() => {
    if (!hasAuthSession()) return;
    if (!isWalletAvailable()) return;

    // Only silently check — do NOT call eth_requestAccounts here (that opens popup)
    window.ethereum
      .request({ method: 'eth_accounts' })
      .then(async (accounts) => {
        if (accounts && accounts.length > 0) {
          try {
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const [walletSigner, network] = await Promise.all([
              web3Provider.getSigner(),
              web3Provider.getNetwork(),
            ]);
            setProvider(web3Provider);
            setSigner(walletSigner);
            setAccount(accounts[0]);
            setChainId(Number(network.chainId));
            console.log(`🔄 Auto-reconnected wallet: ${accounts[0]}`);
          } catch {
            // Silently ignore auto-reconnect failures (wallet may be locked)
          }
        }
      })
      .catch(() => {
        // Silently ignore — MetaMask may not be ready yet
      });
  }, []);

  // ─── React to MetaMask account / chain changes ───────────────────────────────
  useEffect(() => {
    if (!isWalletAvailable()) return;

    const handleAccountsChanged = (accounts) => {
      if (!hasAuthSession()) {
        disconnectWallet();
        return;
      }

      if (!accounts || accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (newChainIdHex) => {
      const newChainId = parseInt(newChainIdHex, 16);
      setChainId(newChainId);
      // Rebuild provider/signer for new chain
      if (account) {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        web3Provider.getSigner().then((s) => {
          setProvider(web3Provider);
          setSigner(s);
        }).catch(() => {});
      }
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      if (!isWalletAvailable()) return;
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('disconnect', handleDisconnect);
    };
  }, [account, disconnectWallet]);

  // Guard against MetaMask extension errors bubbling as uncaught runtime exceptions.
  useEffect(() => {
    const isMetaMaskExtensionFailure = (payload = {}) => {
      const message = String(payload.message || payload.reason?.message || payload.reason || '').toLowerCase();
      const filename = String(payload.filename || payload.source || '').toLowerCase();

      return (
        message.includes('failed to connect to metamask') ||
        (filename.includes('chrome-extension://') && message.includes('metamask'))
      );
    };

    const handleWindowError = (event) => {
      if (!isMetaMaskExtensionFailure(event)) {
        return;
      }

      event.preventDefault();
      setError('MetaMask is currently unavailable. Please unlock/reopen MetaMask and try again.');
      isConnectingRef.current = false;
      setIsConnecting(false);
      console.warn('Suppressed MetaMask extension runtime error:', event.message);
    };

    const handleUnhandledRejection = (event) => {
      if (!isMetaMaskExtensionFailure({ reason: event.reason })) {
        return;
      }

      event.preventDefault();
      setError('MetaMask is currently unavailable. Please unlock/reopen MetaMask and try again.');
      isConnectingRef.current = false;
      setIsConnecting(false);
      console.warn('Suppressed MetaMask unhandled rejection:', event.reason);
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const value = {
    account,
    provider,
    signer,
    chainId,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isConnected: Boolean(account && signer),
    isWalletAvailable: isWalletAvailable(),
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
