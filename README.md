# Blockchain-based Product Traceability Web App MVP

## Overview
A full-stack MVP for a blockchain-based product traceability platform that allows producers to upload product lifecycle data to a blockchain, and customers to scan a QR code and view the tamper-proof history of the product.

## Tech Stack
- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Blockchain:** Solidity (Hardhat, Ethers.js)
- **QR Code:** qrcode, react-qr-reader

## Folder Structure
```
/client         # React frontend
/server         # Node backend (Express, Mongoose)
  /controllers
  /routes
  /models
/contracts      # Solidity smart contracts
/qr             # QR generation and read scripts
/utils          # Hashing, role validation
/scripts        # Deployment scripts for Hardhat
```

## Features
- Product lifecycle on blockchain
- QR code generation and scanning
- Role-based access (Admin/Producer/Customer)
- Web3 wallet integration (MetaMask)

## Setup
1. Clone the repo
2. Install dependencies in `/client` and `/server`
3. Set up environment variables (see `.env.example` in `/server`)
4. Deploy smart contract with Hardhat
5. Run backend and frontend

## Roadmap
- [x] Scaffold project structure
- [ ] Implement smart contract
- [ ] Backend API
- [ ] Frontend UI
- [ ] QR integration
- [ ] Testing & deployment 