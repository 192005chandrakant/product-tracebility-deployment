require("dotenv").config(); // ✅ Make sure this is FIRST
require("@nomiclabs/hardhat-ethers");

const { SEPOLIA_RPC_URL, MUMBAI_RPC_URL, PRIVATE_KEY } = process.env;

// 🔍 Optional Debug Print
if (!SEPOLIA_RPC_URL) {
  console.error("❌ SEPOLIA_RPC_URL is not set in your .env file.");
  process.exit(1);
}
if (!PRIVATE_KEY) {
  console.error("❌ PRIVATE_KEY is not set in your .env file.");
  process.exit(1);
}
console.log("Using Sepolia RPC:", SEPOLIA_RPC_URL?.slice(0, 50), "...");

module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
    mumbai: {
      url: MUMBAI_RPC_URL || "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};