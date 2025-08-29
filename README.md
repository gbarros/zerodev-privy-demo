# ZeroDev x Privy Demo: Complete Account Abstraction Solution

A comprehensive demonstration of account abstraction using **Privy** for email-based authentication and **ZeroDev** for gasless smart account transactions. This repository contains both the smart contracts and the frontend application.

## 🏗️ Repository Structure

```
zerodev-privy-demo/
├── foundry-contracts/          # Smart contracts (Foundry project)
│   ├── src/
│   │   └── MagicBadge.sol     # ERC-721 NFT contract
│   ├── script/
│   │   └── MagicBadge.s.sol   # Deployment script
│   └── test/                   # Contract tests
├── zerodev-privy-demo/        # Frontend application (Next.js)
│   ├── src/
│   │   ├── app/               # Next.js app directory
│   │   ├── components/        # React components
│   │   └── lib/               # Utilities and config
│   └── README.md              # Detailed frontend tutorial
└── README.md                  # This file
```

## 🎯 What This Demo Does

This application showcases how to create a seamless Web3 experience where users can:

1. **Log in with just their email** (no wallet installation required)
2. **Get both an EOA and Smart Account** automatically
3. **Mint NFTs with zero gas fees** using account abstraction
4. **Experience true Web2-like UX** in Web3

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** and **npm**
2. **Foundry** for smart contract development
3. **Privy Account**: Sign up at [privy.io](https://privy.io)
4. **ZeroDev Account**: Sign up at [zerodev.app](https://zerodev.app)

### 1. Clone and Install

```bash
git clone git@github.com:gbarros/zerodev-privy-demo.git
cd zerodev-privy-demo

# Install frontend dependencies
cd zerodev-privy-demo
npm install

# Install contract dependencies
cd ../foundry-contracts
forge install
```

### 2. Smart Contract Setup

The `MagicBadge.sol` contract is already deployed on Sepolia at:
**`0x7F07bf8A79d91478Fe7EAA4c39935b26F3A13980`**

To deploy your own contract:

```bash
cd foundry-contracts

# Set environment variables
export PRIVATE_KEY="your_private_key"
export SEPOLIA_RPC_URL="your_sepolia_rpc_url"

# Deploy to Sepolia
forge script script/MagicBadge.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

### 3. Frontend Configuration

Create `.env.local` in the `zerodev-privy-demo` directory:

```bash
# Privy App ID (from dashboard.privy.io)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# ZeroDev RPC endpoints (from dashboard.zerodev.app)
NEXT_PUBLIC_ZERODEV_BUNDLER_RPC=https://rpc.zerodev.app/api/v3/YOUR_PROJECT_ID/chain/11155111
NEXT_PUBLIC_ZERODEV_PAYMASTER_RPC=https://rpc.zerodev.app/api/v3/YOUR_PROJECT_ID/chain/11155111?selfFunded=true

# Deployed MagicBadge contract address
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x7F07bf8A79d91478Fe7EAA4c39935b26F3A13980
```

### 4. Run the Application

```bash
cd zerodev-privy-demo
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📚 Detailed Documentation

- **Frontend Tutorial**: See `zerodev-privy-demo/README.md` for comprehensive setup and code explanation
- **Smart Contracts**: See `foundry-contracts/README.md` for contract details and deployment

## 🔧 Key Technologies

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Authentication**: Privy (email-based social login)
- **Account Abstraction**: ZeroDev SDK v5
- **Smart Contracts**: Solidity, Foundry
- **Blockchain**: Ethereum Sepolia testnet

## 🎨 Features Demonstrated

### Account Abstraction Benefits
- **Gas Sponsorship**: Users don't need ETH for transactions
- **Email Login**: No seed phrases or wallet installations
- **Smart Account**: Programmable wallet with advanced features
- **Seamless UX**: Web2-like experience in Web3

### Technical Implementation
- **ERC-4337 UserOperations**: Gasless transaction execution
- **Paymaster Integration**: Automatic gas sponsorship
- **Embedded Wallets**: Privy-managed EOA as smart account signer
- **Contract Interaction**: Standard ERC-721 NFT minting

## 🚨 Troubleshooting

### Common Issues

**"Smart Account does not have sufficient funds"**
- Check paymaster balance in ZeroDev dashboard
- Verify paymaster RPC URL configuration

**"Embedded wallet not found"**
- Enable embedded wallets in Privy dashboard
- Ensure email login is configured

**Contract verification failed**
- Get Etherscan API key and add to environment
- Use correct constructor arguments for verification

## 🔗 Resources

- [Privy Documentation](https://docs.privy.io/)
- [ZeroDev Documentation](https://docs.zerodev.app/)
- [Account Abstraction (ERC-4337)](https://eips.ethereum.org/EIPS/eip-4337)
- [Foundry Documentation](https://book.getfoundry.sh/)

## 📄 License

MIT License - see individual project directories for specific license files.

---

This repository demonstrates production-ready patterns for building Web3 applications with seamless user experiences using account abstraction.
