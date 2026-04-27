const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.INFURA_API_URL;
const contractAddress = process.env.CONTRACT_ADDRESS;

if (!rpcUrl) {
  throw new Error('Blockchain RPC URL is missing. Set SEPOLIA_RPC_URL or INFURA_API_URL.');
}

if (!contractAddress) {
  throw new Error('Blockchain contract address is missing. Set CONTRACT_ADDRESS.');
}

const provider = new ethers.JsonRpcProvider(rpcUrl);
const abiPath = path.join(__dirname, '../../contracts/ProductTraceability.abi.json');
const abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8'));
const contractInterface = new ethers.Interface(abi);

// Check provider connection at startup
(async () => {
  try {
    const network = await provider.getNetwork();
    console.log('Connected to network:', network);
  } catch (err) {
    console.error('Failed to connect to Ethereum network:', err.message);
  }
})();

const readContract = new ethers.Contract(contractAddress, abi, provider);

async function buildTransactionRequest(methodName, args = []) {
  const network = await provider.getNetwork();

  return {
    contractAddress,
    chainId: Number(network.chainId),
    to: contractAddress,
    data: contractInterface.encodeFunctionData(methodName, args),
    value: '0',
    methodName,
    args
  };
}

exports.buildTransactionRequest = buildTransactionRequest;

exports.addProductOnChain = async ({ productId, name, origin, manufacturer, certificationHash }) => {
  return buildTransactionRequest('addProduct', [productId, name, origin, manufacturer, certificationHash]);
};

exports.updateStageOnChain = async (productId, stage) => {
  return buildTransactionRequest('updateStage', [productId, stage]);
};

exports.getProductOnChain = async (productId) => {
  return await readContract.getProduct(productId);
};

// Function to search for products by certification hash on blockchain
// Note: This is a helper function that can be used to verify certification hashes
exports.searchByCertificationHash = async (certificationHash) => {
  try {
    // Since the smart contract doesn't have a reverse mapping, we would need to:
    // 1. Either add a reverse mapping to the smart contract
    // 2. Or implement an event-based indexing system
    // 3. Or search through known product IDs (not efficient for production)
    
    // For now, this function can be used to verify if a certification hash exists
    // by checking against known products
    console.log('Searching for certification hash on blockchain:', certificationHash);
    
    // This is a placeholder implementation
    // In a production system, you would want to implement proper indexing
    return null;
  } catch (error) {
    console.error('Error searching by certification hash on blockchain:', error);
    throw error;
  }
};

console.log('Blockchain RPC configured:', !!rpcUrl);
console.log('Blockchain contract configured:', !!contractAddress);
