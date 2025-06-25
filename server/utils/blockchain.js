const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.INFURA_API_KEY);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contractAddress = process.env.CONTRACT_ADDRESS;
const abi = JSON.parse(fs.readFileSync(path.join(__dirname, '../../contracts/ProductTraceability.abi.json')));
const contract = new ethers.Contract(contractAddress, abi, wallet);

exports.addProductOnChain = async ({ productId, name, origin, manufacturer, certificationHash }) => {
  const tx = await contract.addProduct(productId, name, origin, manufacturer, certificationHash);
  await tx.wait();
  return tx.hash;
};

exports.updateStageOnChain = async (productId, stage) => {
  const tx = await contract.updateStage(productId, stage);
  await tx.wait();
  return tx.hash;
};

exports.getProductOnChain = async (productId) => {
  return await contract.getProduct(productId);
}; 