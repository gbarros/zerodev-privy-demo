// src/app/session-keys/lib/sessionKeys.ts
// Educational session key demo for EntryPoint 0.7 and Kernel v3
// Demonstrates session key concepts with simplified implementation

import {
  createKernelAccountClient,
  createKernelAccount,
  createZeroDevPaymasterClient,
  constants,
  type KernelAccountClient,
} from '@zerodev/sdk';
import {
  toPermissionValidator,
  serializePermissionAccount,
  deserializePermissionAccount,
} from '@zerodev/permissions';
import {
  toCallPolicy,
  toTimestampPolicy,
  toRateLimitPolicy,
  CallPolicyVersion,
} from '@zerodev/permissions/policies';
import { toECDSASigner } from '@zerodev/permissions/signers';
import {
  http,
  createPublicClient,
  encodeFunctionData,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { nftContractAddress, nftContractAbi } from '../../../lib/contract';

export interface SessionKeyData {
  privateKey: `0x${string}`;
  sessionKeyAddress: `0x${string}`;
  validUntil: number;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
  serializedAccount: string; // Serialized permission account for revocation
}

/**
 * Clears local session data only (does not revoke on-chain)
 * Use this for expired sessions or when you want to clear cached data
 */
export function clearSessionData(): void {
  localStorage.removeItem('sessionKeyData');
}

export interface SessionStatus {
  isActive: boolean;
  timeRemaining: number;
  usageRemaining: number;
  totalUsage: number;
  usageLimit: number;
}

/**
 * Creates a session key using proper ZeroDev permissions architecture
 * Implements owner-agent pattern with serializePermissionAccount
 */
export async function createSessionKey(
  kernelClient: KernelAccountClient
): Promise<SessionKeyData> {
  // Create public client
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(sepolia.rpcUrls.default.http[0])
  });

  const entryPoint = constants.getEntryPoint('0.7');
  const kernelVersion = constants.KERNEL_V3_3;

  // AGENT SIDE: Generate session key private key
  const sessionKeyPrivateKey = generatePrivateKey();
  const sessionKeySigner = privateKeyToAccount(sessionKeyPrivateKey);
  const sessionKeyAddress = sessionKeySigner.address;

  console.log('Creating session key with address:', sessionKeyAddress);
  console.log('Session key will be valid for 1 hour with 3 usage limit');

  try {
    // OWNER SIDE: Create approval for the session key
    
    // Get the owner's ECDSA validator from existing kernel client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ownerValidator = (kernelClient.account as any)?.kernelPluginManager?.sudoValidator;
    if (!ownerValidator) {
      throw new Error('No owner validator found');
    }

    // Create ECDSA signer for the session key
    const sessionKeySigner = privateKeyToAccount(sessionKeyPrivateKey);
    const sessionKeyECDSASigner = await toECDSASigner({ signer: sessionKeySigner });

    // Create permission validator with proper policies for educational demo
    const currentTime = Math.floor(Date.now() / 1000);
    const oneHourFromNow = currentTime + 3600; // 1 hour in seconds
    
    const policies = [
      // Time-based policy: Valid for 1 hour only
      toTimestampPolicy({
        validAfter: currentTime,
        validUntil: oneHourFromNow,
      }),
      
      // Call policy: Only allow calling the NFT contract's mint function
      toCallPolicy({
        policyVersion: CallPolicyVersion.V0_0_4,
        permissions: [
          {
            target: nftContractAddress,
            valueLimit: BigInt(0), // No ETH transfers allowed
            abi: nftContractAbi,
            functionName: 'mint',
            // args: [], // mint() takes no arguments - omit for functions with no parameters
          },
        ],
      }),
      
      // Rate limit policy: Maximum 3 operations within the session
      toRateLimitPolicy({
        count: 3,
        interval: 3600, // 1 hour in seconds
      }),
    ];
    
    const permissionPlugin = await toPermissionValidator(publicClient, {
      entryPoint,
      kernelVersion,
      signer: sessionKeyECDSASigner,
      policies,
    });

    // Create session key account with owner as sudo and session key as regular
    const permissionAccount = await createKernelAccount(publicClient, {
      entryPoint,
      kernelVersion,
      plugins: {
        sudo: ownerValidator, // Owner remains in control
        regular: permissionPlugin, // Session key as regular validator
      },
    });

    // Serialize the permission account to get approval
    const serializedAccount = await serializePermissionAccount(permissionAccount);
    
    console.log('Session key approved and serialized');

    // Store session data with serialized account for later revocation
    const sessionData: SessionKeyData = {
      privateKey: sessionKeyPrivateKey,
      sessionKeyAddress,
      validUntil: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      usageLimit: 3,
      usageCount: 0,
      isActive: true,
      serializedAccount,
    };

    localStorage.setItem('sessionKeyData', JSON.stringify(sessionData));
    return sessionData;
    
  } catch (error) {
    console.error('Session key creation failed:', error);
    throw error;
  }
}

export type SessionOpStatus = 'idle' | 'submitted' | 'processing' | 'included' | 'failed';

export interface SessionOpResult {
  operationHash?: `0x${string}`;
  status: SessionOpStatus;
  txHash?: `0x${string}`;
  error?: string;
}

/**
 * Mints an NFT using the session key with proper deserialization
 * Demonstrates seamless UX without wallet prompts using ZeroDev permissions
 */
export async function mintWithSession(
  sessionData: SessionKeyData,
  statusCallback?: (status: SessionOpStatus) => void
): Promise<SessionOpResult & { updatedSessionData?: SessionKeyData }> {
  if (!sessionData.isActive) {
    return { status: 'failed', error: 'Session key is not active' };
  }

  if (sessionData.usageCount >= sessionData.usageLimit) {
    return { status: 'failed', error: 'Session key usage limit exceeded' };
  }

  if (Date.now() / 1000 > sessionData.validUntil) {
    return { status: 'failed', error: 'Session key has expired' };
  }

  if (!sessionData.serializedAccount) {
    return { status: 'failed', error: 'Session key serialized account not found' };
  }

  const bundlerRpc = process.env.NEXT_PUBLIC_ZERODEV_BUNDLER_RPC!;
  const paymasterRpc = process.env.NEXT_PUBLIC_ZERODEV_PAYMASTER_RPC!;

  try {
    // Create public client
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(sepolia.rpcUrls.default.http[0])
    });

    const entryPoint = constants.getEntryPoint('0.7');
    const kernelVersion = constants.KERNEL_V3_3;

    // AGENT SIDE: Recreate session key signer from stored private key
    const sessionKeySigner = privateKeyToAccount(sessionData.privateKey);
    const sessionKeyECDSASigner = await toECDSASigner({ signer: sessionKeySigner });

    // Deserialize the permission account using stored serialized account
    const sessionKeyAccount = await deserializePermissionAccount(
      publicClient,
      entryPoint,
      kernelVersion,
      sessionData.serializedAccount,
      sessionKeyECDSASigner
    );

    // Create paymaster client
    const paymaster = createZeroDevPaymasterClient({
      chain: sepolia,
      transport: http(paymasterRpc),
    });

    // Create kernel client for session key
    const sessionKernelClient = createKernelAccountClient({
      account: sessionKeyAccount,
      chain: sepolia,
      bundlerTransport: http(bundlerRpc),
      paymaster,
    });

    // Prepare mint transaction
    const mintCallData = encodeFunctionData({
      abi: nftContractAbi,
      functionName: 'mint',
      args: [], // mint() function takes no parameters - mints to msg.sender
    });

    console.log('Minting NFT with session key...');

    // Send transaction using session key (no wallet prompt)
    statusCallback?.('submitted');
    const txHash = await sessionKernelClient.sendTransaction({
      to: nftContractAddress,
      data: mintCallData,
    });

    console.log('Session mint transaction completed:', txHash);

    // Update usage count
    const updatedSessionData = {
      ...sessionData,
      usageCount: sessionData.usageCount + 1,
    };
    localStorage.setItem('sessionKeyData', JSON.stringify(updatedSessionData));

    statusCallback?.('included');

    return {
      operationHash: txHash,
      status: 'included',
      txHash: txHash,
      updatedSessionData,
    };

  } catch (error) {
    console.error('Session mint failed:', error);
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Revokes the current session key by uninstalling the permission plugin on-chain
 * This requires the owner's wallet signature to execute
 */
export async function revokeSession(
  kernelClient: KernelAccountClient
): Promise<void> {
  const bundlerRpc = process.env.NEXT_PUBLIC_ZERODEV_BUNDLER_RPC!;
  const paymasterRpc = process.env.NEXT_PUBLIC_ZERODEV_PAYMASTER_RPC!;

  // Get stored session data to find the permission plugin
  const sessionDataStr = localStorage.getItem('sessionKeyData');
  if (!sessionDataStr) {
    throw new Error('No active session to revoke');
  }

  const sessionData: SessionKeyData = JSON.parse(sessionDataStr);
  if (!sessionData.serializedAccount) {
    throw new Error('No session serialized account found');
  }

  // Create public client
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(sepolia.rpcUrls.default.http[0])
  });

  const entryPoint = constants.getEntryPoint('0.7');
  const kernelVersion = constants.KERNEL_V3_3;

  try {
    // Get the owner's ECDSA validator from existing kernel client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ownerValidator = (kernelClient.account as any)?.kernelPluginManager?.sudoValidator;
    if (!ownerValidator) {
      throw new Error('No owner validator found');
    }

    // For revocation, we need to recreate the permission plugin with the same configuration
    // that was used during creation to ensure proper matching for uninstallPlugin
    const sessionKeySigner = privateKeyToAccount(sessionData.privateKey);
    const sessionKeyECDSASigner = await toECDSASigner({ signer: sessionKeySigner });
    
    // Deserialize the stored permission account to get the exact plugin configuration
    const sessionAccount = await deserializePermissionAccount(
      publicClient,
      entryPoint,
      kernelVersion,
      sessionData.serializedAccount,
      sessionKeyECDSASigner
    );

    // Create sudo account for uninstalling the permission plugin
    const sudoAccount = await createKernelAccount(publicClient, {
      entryPoint,
      kernelVersion,
      plugins: {
        sudo: ownerValidator,
      },
    });

    // Create paymaster client
    const paymaster = createZeroDevPaymasterClient({
      chain: sepolia,
      transport: http(paymasterRpc),
    });

    // Create sudo kernel client for uninstalling
    const sudoKernelClient = createKernelAccountClient({
      account: sudoAccount,
      chain: sepolia,
      bundlerTransport: http(bundlerRpc),
      paymaster,
    });

    console.log('Revoking session key on-chain...');

    // Uninstall the permission plugin using the deserialized account (this requires owner signature)
    const txHash = await sudoKernelClient.uninstallPlugin({
      plugin: sessionAccount.kernelPluginManager,
    });

    console.log('Session key revoked on-chain:', txHash);

    // Clear local session data after successful on-chain revocation
    localStorage.removeItem('sessionKeyData');

  } catch (error) {
    console.error('Failed to revoke session on-chain:', error);
    throw error;
  }
}

/**
 * Gets the current session status
 */
export function getSessionStatus(): SessionStatus | null {
  const sessionDataStr = localStorage.getItem('sessionKeyData');
  if (!sessionDataStr) {
    return null;
  }

  const sessionData: SessionKeyData = JSON.parse(sessionDataStr);
  const now = Math.floor(Date.now() / 1000);
  
  const isActive = sessionData.isActive && now < sessionData.validUntil;
  const timeRemaining = Math.max(0, sessionData.validUntil - now);
  const usageRemaining = Math.max(0, sessionData.usageLimit - sessionData.usageCount);

  return {
    isActive,
    timeRemaining,
    usageRemaining,
    totalUsage: sessionData.usageCount,
    usageLimit: sessionData.usageLimit,
  };
}

/**
 * Formats time remaining in a human-readable format
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
