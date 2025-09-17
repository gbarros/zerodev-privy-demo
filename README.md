# ZeroDev × Privy demo suite

This repository is a living lab for account abstraction on Ethereum testnets. It pairs **Privy** (email-based embedded wallets) with **ZeroDev** (Kernel v3 smart accounts, paymasters, and permissioning) and ships:

- A Next.js app with three hands-on AA experiences
- Foundry contracts used by the demos

## 🏗️ Repository Structure

```
zerodev-privy-demo/
├── foundry-contracts/                 # Smart contracts (Foundry project)
│   ├── script/
│   │   └── MagicBadge.s.sol          # Deployment script
│   ├── src/
│   │   └── MagicBadge.sol            # ERC-721 NFT contract
│   └── test/                         # Contract tests
├── zerodev-privy-demo/                # Next.js demo application
│   ├── src/app/
│   │   ├── batch-operations/         # UserOp batching walkthrough
│   │   ├── session-keys/             # Scoped/session key demo
│   │   ├── simple-login-mint/        # “Hello AA” sponsored mint
│   │   └── page.tsx                  # Landing page linking all demos
│   ├── src/lib/                      # Shared AA helpers (smart account, contracts)
│   └── README.md                     # In-depth frontend tutorial
└── README.md                         # Repo overview (this file)
```

## 🎯 Available demos

From the homepage (`npm run dev` → `http://localhost:3000`) you can launch three ZeroDev-powered flows:

1. **Simple Login & Mint** – Email sign-in via Privy, automatic Kernel smart account provisioning, and a sponsored NFT mint using a verifying paymaster.
2. **Batch Operations** – Compose several contract calls (multiple `mint()`s) into a single UserOperation, observe live status transitions, and inspect operation previews.
3. **Session Keys** – Grant a time-bound, usage-limited permission that lets the dapp mint without further wallet prompts. Includes on-chain revocation and usage tracking.

All demos reuse the same shared helpers in `src/lib/`: we create smart accounts against EntryPoint 0.7 / Kernel v3.3, use ZeroDev paymasters for gas, and showcase best practices.

## 🚀 Quick Start

### Prerequisites

1. **Node.js 18+** and **npm**
2. **Foundry** for smart contract development
3. **Privy Account**: Sign up at [privy.io](https://privy.io)
4. **ZeroDev Account**: Sign up at [zerodev.app](https://zerodev.app)
5. **Ethereum Sepolia RPC** (Alchemy, Infura)

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

The demo targets the `MagicBadge.sol` ERC-721 contract. A pre-deployed instance exists on Sepolia at:  
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

Open [http://localhost:3000](http://localhost:3000) to explore the landing page and jump into any of the demos.


## 📚 Detailed Documentation

- **Frontend tutorials**: `zerodev-privy-demo/README.md` breaks down the simple mint flow end-to-end.
- **Smart contracts**: `foundry-contracts/README.md` covers the MagicBadge contract and deployment scripts.

## 🔧 Key Technologies

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Authentication**: Privy (email-based social login)
- **Account Abstraction**: ZeroDev SDK v5
- **Smart Contracts**: Solidity, Foundry
- **Blockchain**: Ethereum Sepolia testnet

## 🎨 Features Demonstrated

### User experience wins
- **Gasless onboarding** using verifying/token paymasters
- **Email login** with embedded wallet provisioning
- **Repeat actions without prompts** thanks to session keys
- **One-click multi-step flows** through batched UserOperations

### Technical building blocks
- **Kernel v3 smart accounts** controlled by Privy EOAs
- **ZeroDev paymaster clients** for sponsored gas and reimbursements
- **Permission validator** demo via `serializePermissionAccount`/`deserializePermissionAccount`
- **ERC-4337 batching** with status polling (submitted → included)
- **Foundry tooling** for rapid contract iteration

## 🚨 Troubleshooting

### Common Issues

**"Smart Account does not have sufficient funds"**
- Check paymaster balance in ZeroDev dashboard
- Verify paymaster RPC URL configuration

**Session mint fails or bypasses limits**
- Ensure the serialized session approval is present in `localStorage`
- Revoke and grant a fresh session to reset usage counters

**"Embedded wallet not found"**
- Enable embedded wallets in Privy dashboard
- Ensure email login is configured

**`npm install` stalls**
- The project uses a fairly large dependency graph (Next.js 15, Privy SDK). Re-run with a longer timeout or a faster network.

**Contract verification failed**
- Get Etherscan API key and add to environment
- Use correct constructor arguments for verification

## 🔗 Resources

- [Privy Documentation](https://docs.privy.io/)
- [ZeroDev Documentation](https://docs.zerodev.app/)
- [Account Abstraction (ERC-4337)](https://eips.ethereum.org/EIPS/eip-4337)
- [Foundry Documentation](https://book.getfoundry.sh/)

## 📄 License

Apache License 2.0 - see individual project directories for specific license files.

---

This repository demonstrates production-ready patterns for building Web3 applications with seamless user experiences using account abstraction.
