// src/lib/smartAccount.ts
// Smart account initialization utilities for ZeroDev + Privy integration

import {
  createKernelAccountClient,
  createKernelAccount,
  createZeroDevPaymasterClient,
  type KernelAccountClient,
} from '@zerodev/sdk';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { constants } from '@zerodev/sdk';
import { http, createPublicClient, EIP1193Provider, createWalletClient, custom } from 'viem';

import { sepolia } from 'viem/chains';
import type { ConnectedWallet } from '@privy-io/react-auth';

export interface SmartAccountResult {
  kernelClient: KernelAccountClient;
  smartAccountAddress: `0x${string}`;
  eoaAddress: `0x${string}`;
}

/**
 * Monkey patches the signUserOperation method of the ECDSA validator
 * to use the embedded wallet's signTypedData method
 * This is a workaround for the fact that the default ECDSA validator does not
 * support signing with signTypedData (EIP-712)
 */

export function monkeyPatchSignUserOperation(ownerAddress: `0x${string}`) {
  const domain = {
    name: "EntryPoint",
    version: "0.7.0",            // must match your EP deployment
    chainId: sepolia.id,
    verifyingContract: constants.getEntryPoint('0.7').address,
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const types: any = {
    PackedUserOperation: [
      { name: "sender", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "initCode", type: "bytes" },
      { name: "callData", type: "bytes" },
      { name: "accountGasLimits", type: "bytes32" },
      { name: "preVerificationGas", type: "uint256" },
      { name: "gasFees", type: "bytes32" },
      { name: "paymasterAndData", type: "bytes" },
    ],
  };
  
  // packers for EP v0.7 (keep exactly in sync with your unsigned op)
  const packAccountGasLimits = (vGas: bigint, cGas: bigint) =>
    `0x${((vGas << 128n) | cGas).toString(16).padStart(64, "0")}`;
  const packGasFees = (maxTip: bigint, maxFee: bigint) =>
    `0x${((maxTip << 128n) | maxFee).toString(16).padStart(64, "0")}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function(this: any, op: any): Promise<`0x${string}`> {
    // `op` is the Prepared/PackedUserOperation the SDK was about to sign.
    const message = {
      sender: op.sender,
      nonce: op.nonce,
      initCode: op.factory && op.factory !== "0x"
        ? (op.factory + (op.factoryData ?? "0x").slice(2)) as `0x${string}` : "0x",
      callData: op.callData,
      accountGasLimits: packAccountGasLimits(op.verificationGasLimit, op.callGasLimit),
      preVerificationGas: op.preVerificationGas,
      gasFees: packGasFees(op.maxPriorityFeePerGas, op.maxFeePerGas),
      paymasterAndData: op.paymaster && op.paymaster !== "0x"
        ? (op.paymaster
            + (op.paymasterVerificationGasLimit ?? 0n).toString(16).padStart(64, "0")
            + (op.paymasterPostOpGasLimit ?? 0n).toString(16).padStart(64, "0")
            + (op.paymasterData ?? "0x").slice(2)) as `0x${string}`
        : "0x",
    };
  
    // Use the validator's signer to sign typed data (viem WalletClient)
    return this.signer.signTypedData({
      account: ownerAddress,
      domain,
      types,
      primaryType: "PackedUserOperation",
      message,
    }) as Promise<`0x${string}`>;
  };
}

/**
 * Finds the embedded wallet from Privy wallets array
 */
export function findEmbeddedWallet(wallets: ConnectedWallet[]): ConnectedWallet {
  const embedded = wallets.find((w) => w.walletClientType === 'privy');
  if (!embedded) {
    throw new Error('Embedded wallet not found. Ensure embedded wallets are enabled in Privy config.');
  }
  return embedded;
}


/**
 * Creates a ZeroDev smart account using Privy's embedded wallet as the signer
 */
export async function createSmartAccount(
  embeddedWallet: ConnectedWallet,
  bundlerRpc: string,
  paymasterRpc: string
): Promise<SmartAccountResult> {
  // Get the EIP-1193 provider from Privy's embedded wallet
  const provider = await embeddedWallet.getEthereumProvider();
  // Wrap provider into a viem WalletClient to enable signTypedData
  const signer = createWalletClient({
    account: embeddedWallet.address as `0x${string}`,
    chain: sepolia,
    transport: custom(provider as EIP1193Provider),
  });

  // Create viem public client for chain interactions
  const publicClient = createPublicClient({ 
    chain: sepolia, 
    transport: http(sepolia.rpcUrls.default.http[0]) 
  });

  // Configure ZeroDev EntryPoint and Kernel version
  const entryPoint = constants.getEntryPoint('0.7');
  const kernelVersion = constants.KERNEL_V3_3;

  // Create ECDSA validator using Privy's signer
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer,
    entryPoint,
    kernelVersion,
  });
  // ecdsaValidator.signUserOperation = monkeyPatchSignUserOperation(embeddedWallet.address as `0x${string}`);
  // Create the kernel account
  const account = await createKernelAccount(publicClient, {
    plugins: { sudo: ecdsaValidator },
    entryPoint,
    kernelVersion,
  });

  // Create ZeroDev paymaster client for gas sponsorship
  const paymaster = createZeroDevPaymasterClient({
    chain: sepolia,
    transport: http(paymasterRpc),
  });

  // Create the kernel account client with bundler and paymaster
  const kernelClient = createKernelAccountClient({
    account,
    chain: sepolia,
    bundlerTransport: http(bundlerRpc),
    paymaster,
  });

  return {
    kernelClient,
    smartAccountAddress: kernelClient.account?.address as `0x${string}`,
    eoaAddress: embeddedWallet.address as `0x${string}`,
  };
}

/**
 * Validates that required environment variables are present
 */
export function validateEnvironment(): { bundlerRpc: string; paymasterRpc: string } {
  const bundlerRpc = process.env.NEXT_PUBLIC_ZERODEV_BUNDLER_RPC;
  const paymasterRpc = process.env.NEXT_PUBLIC_ZERODEV_PAYMASTER_RPC;

  if (!bundlerRpc || !paymasterRpc) {
    throw new Error('Missing NEXT_PUBLIC_ZERODEV_BUNDLER_RPC or NEXT_PUBLIC_ZERODEV_PAYMASTER_RPC in .env.local');
  }

  return { bundlerRpc, paymasterRpc };
}
