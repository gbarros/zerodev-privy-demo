// src/app/batch-operations/lib/userOps.ts
// UserOperation utilities for batched operations and status tracking

import { createKernelAccountClient } from '@zerodev/sdk';
import { encodeFunctionData } from 'viem';

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
export function createBatchOperations(
  contractAddress: `0x${string}`,
  abi: readonly any[],
  operations: Array<{
    functionName: string;
    args: any[];
    description: string;
    value?: bigint;
  }>
): BatchOperation[] {
  return operations.map(op => ({
    target: contractAddress,
    data: encodeFunctionData({
      abi,
      functionName: op.functionName,
      args: op.args,
    }),
    value: op.value || 0n,
    description: op.description,
  }));
}

/**
 * Executes a batched operation and tracks its status
 */
export async function executeBatchOperation(
  kernelClient: ReturnType<typeof createKernelAccountClient>,
  operations: BatchOperation[],
  onStatusChange: (status: UserOpStatus, data?: any) => void
): Promise<UserOpResult> {
  try {
    onStatusChange('submitted');

    let opHash: `0x${string}`;

    // For single operation, use sendTransaction
    if (operations.length === 1) {
      const op = operations[0];
      opHash = await kernelClient.sendTransaction({
        to: op.target,
        data: op.data,
        value: op.value,
        account: kernelClient.account!,
        chain: kernelClient.chain,
      });
    } else {
      // For multiple operations, use sendUserOperation with calls
      opHash = await kernelClient.sendUserOperation({
        account: kernelClient.account!,
        calls: operations.map(op => ({
          to: op.target,
          data: op.data,
          value: op.value || 0n,
        })),
      });
    }

    onStatusChange('processing', { opHash });

    // Wait for the UserOperation to be included
    const receipt = await kernelClient.waitForUserOperationReceipt({ 
      hash: opHash 
    });

    const txHash = receipt.receipt.transactionHash;
    onStatusChange('included', { opHash, txHash });

    return {
      opHash,
      status: 'included',
      txHash,
    };

  } catch (error: any) {
    onStatusChange('failed', { error: error.message });
    return {
      opHash: '0x' as `0x${string}`,
      status: 'failed',
      error: error.message,
    };
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
