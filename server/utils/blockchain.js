const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Use ethers v6 syntax
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Check provider connection at startup
(async () => {
  try {
    const network = await provider.getNetwork();
    console.log('Connected to network:', network);
  } catch (err) {
    console.error('Failed to connect to Ethereum network:', err.message);
  }
})();

const contractAddress = process.env.CONTRACT_ADDRESS;
const abiPath = path.join(__dirname, '../../contracts/ProductTraceability.abi.json');
const abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8'));

const contract = new ethers.Contract(contractAddress, abi, wallet);

exports.addProductOnChain = async ({ productId, name, origin, manufacturer, certificationHash }) => {
  const tx = await contract.addProduct(productId, name, origin, manufacturer, certificationHash);
  await tx.wait();
  return tx.hash;
};

exports.updateStageOnChain = async (productId, stage) => {
  try {
    console.log('Calling blockchain contract to update stage:', { productId, stage });
    
    // Attempt to update stage on blockchain
    const tx = await contract.updateStage(productId, stage);
    console.log('Transaction sent, waiting for confirmation...');
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log('Transaction confirmed, hash:', receipt.hash);
    
    return receipt.hash;
  } catch (error) {
    console.error('Blockchain update stage error:', error);
    // Throw a more user-friendly error that will be caught by the controller
    throw new Error('Failed to update product stage on blockchain. Please try again.');
  }
};

exports.getProductOnChain = async (productId) => {
  return await contract.getProduct(productId);
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

console.log("INFURA:", process.env.INFURA_API_URL);
console.log("PRIVATE_KEY loaded:", !!process.env.PRIVATE_KEY);
console.log("Contract Address:", process.env.CONTRACT_ADDRESS);
