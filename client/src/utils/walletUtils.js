import { ethers } from 'ethers';

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_RPC = process.env.REACT_APP_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY';

export const NETWORK_CONFIG = {
  sepolia: {
    chainId: SEPOLIA_CHAIN_ID,
    name: 'Sepolia Testnet',
    rpc: SEPOLIA_RPC,
    explorerUrl: 'https://sepolia.etherscan.io',
  },
};

export function getNetworkName(chainId) {
  switch (chainId) {
    case 11155111:
      return 'Sepolia';
    case 1:
      return 'Mainnet';
    case 137:
      return 'Polygon';
    case 8453:
      return 'Base';
    default:
      return `Chain ${chainId}`;
  }
}

export function getExplorerUrl(txHash, chainId = 11155111) {
  switch (chainId) {
    case 11155111:
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    case 1:
      return `https://etherscan.io/tx/${txHash}`;
    case 137:
      return `https://polygonscan.com/tx/${txHash}`;
    case 8453:
      return `https://basescan.org/tx/${txHash}`;
    default:
      return null;
  }
}

export function formatAddress(address, length = 6) {
  if (!address) return '';
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function isValidAddress(address) {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

export function isValidTransactionRequest(request) {
  if (!request) return false;
  if (!ethers.isAddress(request.to)) return false;
  if (typeof request.data !== 'string' || !request.data.startsWith('0x')) return false;
  return true;
}

export async function getGasPrice(provider) {
  try {
    const feeData = await provider.getFeeData();
    return {
      gasPrice: feeData.gasPrice?.toString(),
      maxFeePerGas: feeData.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
    };
  } catch (err) {
    console.warn('Failed to fetch gas price:', err);
    return null;
  }
}

export async function getTransactionStatus(txHash, provider, chainId = 11155111) {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return {
        status: 'pending',
        confirmations: 0,
        explorerUrl: getExplorerUrl(txHash, chainId),
      };
    }

    const blockNumber = await provider.getBlockNumber();
    const confirmations = blockNumber - receipt.blockNumber;

    return {
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      blockNumber: receipt.blockNumber,
      confirmations,
      gasUsed: receipt.gasUsed?.toString(),
      explorerUrl: getExplorerUrl(txHash, chainId),
    };
  } catch (err) {
    console.warn('Failed to fetch transaction status:', err);
    return null;
  }
}
