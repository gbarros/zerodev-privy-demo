// src/app/batch-operations/lib/userOps.ts
// UserOperation utilities for batched operations and status tracking

import { encodeFunctionData } from 'viem';
import { createKernelAccountClient, type KernelAccountClient } from '@zerodev/sdk';

export type UserOpStatus = 'idle' | 'composing' | 'submitted' | 'processing' | 'included' | 'failed';

export interface UserOpResult {
  opHash: `0x${string}`;
  status: UserOpStatus;
  txHash?: `0x${string}`;
  error?: string;
}

export interface BatchOperation {
  target: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
  description: string;
}

/**
 * Creates a batch of operations for a multi-step action
 */
export async function createBatchOperations(
  kernelClient: KernelAccountClient,
  nftContractAddress: `0x${string}`,
  abi: readonly unknown[]
): Promise<BatchOperation[]> {
  // Create 3 mint operations for demonstration
  const operations: BatchOperation[] = [
    {
      target: nftContractAddress,
      data: encodeFunctionData({
        abi,
        functionName: 'mint',
        args: [],
      }),
      value: 0n,
      description: 'Mint NFT #1',
    },
    {
      target: nftContractAddress,
      data: encodeFunctionData({
        abi,
        functionName: 'mint',
        args: [],
      }),
      value: 0n,
      description: 'Mint NFT #2',
    },
    {
      target: nftContractAddress,
      data: encodeFunctionData({
        abi,
        functionName: 'mint',
        args: [],
      }),
      value: 0n,
      description: 'Mint NFT #3',
    },
  ];
  
  return operations;
}

/**
 * Executes a batched operation and tracks its status
 */
export async function executeBatchOperation(
  kernelClient: KernelAccountClient,
  operations: BatchOperation[],
  statusCallback?: (status: UserOpStatus) => void
): Promise<`0x${string}`> {
  try {
    statusCallback?.('submitted');

    let opHash: `0x${string}`;

    // For single operation, use sendTransaction
    if (operations.length === 1) {
      const op = operations[0];
      const ownerValidator = (kernelClient.account as unknown as { kernelPluginManager?: { sudoValidator?: unknown } })?.kernelPluginManager?.sudoValidator;
      opHash = await kernelClient.sendTransaction({
        to: op.target,
        data: op.data,
        value: op.value,
        account: kernelClient.account!,
        chain: kernelClient.chain,
      });
    } else {
      // For multiple operations, use sendUserOperation with calls
      const calls = operations.map((op: BatchOperation) => ({
        to: op.target,
        data: op.data,
        value: op.value || 0n,
      }));
      opHash = await kernelClient.sendUserOperation({
        account: kernelClient.account!,
        calls,
      });
    }

    statusCallback?.('processing');

    // For demo purposes, return the transaction hash directly
    // In a real implementation, you would wait for the transaction to be included
    statusCallback?.('included');

    return opHash;

  } catch (error: unknown) {
    statusCallback?.('failed');
    throw error;
  }
}

/**
 * Formats operation descriptions for human-readable preview
 */
export function formatOperationPreview(operations: BatchOperation[]): string {
  if (operations.length === 1) {
    return operations[0].description;
  }
  
  return operations
    .map((op, index) => `${index + 1}. ${op.description}`)
    .join('\n');
}

/**
 * Gets user-friendly status messages
 */
export function getStatusMessage(status: UserOpStatus): string {
  switch (status) {
    case 'idle':
      return 'Ready to submit';
    case 'composing':
      return 'Preparing operation...';
    case 'submitted':
      return 'Submitted to network';
    case 'processing':
      return 'Bundling your operation...';
    case 'included':
      return 'Done. Your action is on-chain.';
    case 'failed':
      return 'Operation failed';
    default:
      return 'Unknown status';
  }
}
