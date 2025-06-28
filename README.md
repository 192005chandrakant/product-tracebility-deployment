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

## detailed command to setup directory locally 



````markdown
## 🚀 Project Startup Guide

Here’s your *complete and organized command list* to run the application from the **root directory** of the `product-traceibility` project:

---

## ✅ From Root Folder: `product-traceibility/`

### 🔹 1. Install All Dependencies (for root + blockchain)

```bash
npm install
````

---

### 🔹 2. Start Local Blockchain Node

```bash
npx hardhat node
```

> 🛑 **Keep this terminal running** to maintain the local blockchain.

---

### 🔹 3. In *new terminal*, Deploy Smart Contract

```bash
npx hardhat run scripts/deploy.js --network localhost
```

> This assumes `hardhat.config.js` and `scripts/deploy.js` are in the root directory or properly referenced.

---

### 🔹 4. Start Frontend (React)

```bash
cd client
npm install
npm start
```

> Frontend will run at: [http://localhost:3000](http://localhost:3000)

---

### 🔹 5. Start Backend (Express)

```bash
cd server
npm install
npm start
```

> Backend will run at: [http://localhost:5000](http://localhost:5000)

---

## ✅ Summary

| Component  | Command                                                                      |
| ---------- | ---------------------------------------------------------------------------- |
| Blockchain | `npx hardhat node` + `npx hardhat run scripts/deploy.js --network localhost` |
| Frontend   | `cd client && npm install && npm start`                                      |
| Backend    | `cd server && npm install && npm start`                                      |

---



## Roadmap
- [x] Scaffold project structure
- [ ] Implement smart contract
- [ ] Backend API
- [ ] Frontend UI
- [ ] QR integration
- [ ] Testing & deployment 
