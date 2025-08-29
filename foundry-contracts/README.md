# MagicBadge Contract Deployment

This directory contains the Foundry project to deploy the `MagicBadge` ERC-721 contract, which is used by the ZeroDev x Privy demo frontend.

## Contract Details

- **Contract**: `src/MagicBadge.sol`
- **Description**: A simple ERC-721 NFT with an `Ownable` access control. The owner can mint new badges to any address using the `safeMint(address to)` function.

## How to Deploy

### 1. Prerequisites

- [Foundry](https://getfoundry.sh/) must be installed.
- You need a wallet with Sepolia ETH for gas fees.

### 2. Set Up Environment

The deployment script requires your deployer wallet's private key and a Sepolia RPC URL. You can place these in a `.env.local` file at the root of the frontend project (`zerodev-privy-demo/.env.local`).

Create or update the file with the following variables:

```bash
# File: ../zerodev-privy-demo/.env.local

# Wallet private key for deploying the contract
PRIVATE_KEY=your_wallet_private_key_here

# Sepolia RPC URL (e.g., from Infura, Alchemy)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_project_id
```

### 3. Run the Deployment Script

From inside this `foundry-contracts` directory, run the following commands:

```bash
# Source the environment variables from the frontend's .env file
# This makes them available to the forge script
source ../zerodev-privy-demo/.env.local

# Run the deployment script to Sepolia
forge script script/MagicBadge.s.sol:DeployMagicBadge --rpc-url $SEPOLIA_RPC_URL --broadcast
```

### 4. Get the Contract Address

The script output will show the deployed contract address:

```
ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
...
MagicBadge contract deployed at: 0x........................................
```

Copy this address.

### 5. Update Frontend Environment

Paste the copied address into `../zerodev-privy-demo/.env.local` for the `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS` variable.

After updating the file, restart the Next.js dev server for the frontend app to pick up the new contract address.
