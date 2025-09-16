// src/app/batch-operations/components/BatchOperations.tsx

'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createKernelAccountClient } from '@zerodev/sdk';
import { 
  findEmbeddedWallet, 
  createSmartAccount, 
  validateEnvironment,
  type SmartAccountResult 
} from '../../../lib/smartAccount';
import { nftContractAddress, nftContractAbi } from '../../../lib/contract';
import {
  createBatchOperations,
  executeBatchOperation,
  formatOperationPreview,
  getStatusMessage,
  type UserOpStatus,
  type BatchOperation
} from '../lib/userOps';

export default function BatchOperations() {
  const { login, ready, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();

  // Smart account state
  const [saAddress, setSaAddress] = useState<`0x${string}` | null>(null);
  const [eoaAddress, setEoaAddress] = useState<`0x${string}` | null>(null);
  const [kernelClient, setKernelClient] =
    useState<ReturnType<typeof createKernelAccountClient> | null>(null);
  
  // Operation state
  const [mintQuantity, setMintQuantity] = useState(3);
  const [operations, setOperations] = useState<BatchOperation[]>([]);
  const [opStatus, setOpStatus] = useState<UserOpStatus>('idle');
  const [opHash, setOpHash] = useState<`0x${string}` | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setupSmartAccount = useCallback(async () => {
    try {
      setError(null);
      const { bundlerRpc, paymasterRpc } = validateEnvironment();
      const embeddedWallet = findEmbeddedWallet(wallets);
      const result: SmartAccountResult = await createSmartAccount(
        embeddedWallet,
        bundlerRpc,
        paymasterRpc
      );

      setKernelClient(result.kernelClient);
      setSaAddress(result.smartAccountAddress);
      setEoaAddress(result.eoaAddress);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || 'Failed to initialize smart account');
    }
  }, [wallets]);

  useEffect(() => {
    if (authenticated && wallets.length > 0) {
      setupSmartAccount();
    }
  }, [authenticated, wallets, setupSmartAccount]);

  // Compose the batch operation
  const composeOperation = useCallback(() => {
    if (!saAddress) return;

    setOpStatus('composing');
    
    // Create multiple mint operations
    const batchOps = createBatchOperations(
      nftContractAddress,
      nftContractAbi,
      Array.from({ length: mintQuantity }, (_, i) => ({
        functionName: 'mint',
        args: [],
        description: `Mint NFT #${i + 1}`,
      }))
    );

    setOperations(batchOps);
    setOpStatus('idle');
  }, [saAddress, mintQuantity]);

  // Execute the batch operation
  const executeOperation = useCallback(async () => {
    if (!kernelClient || operations.length === 0) {
      setError('Smart account not initialized or no operations to execute.');
      return;
    }

    setError(null);
    setOpHash(null);
    setTxHash(null);

    try {
      const result = await executeBatchOperation(
        kernelClient,
        operations,
        (status, data) => {
          setOpStatus(status);
          if (data?.opHash) setOpHash(data.opHash);
          if (data?.txHash) setTxHash(data.txHash);
          if (data?.error) setError(data.error);
        }
      );

      if (result.status === 'failed') {
        setError(result.error || 'Operation failed');
      }
    } catch (e: unknown) {
      console.error('Operation error:', e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || 'An error occurred.');
      setOpStatus('failed');
    }
  }, [kernelClient, operations]);

  // Reset operation state
  const resetOperation = useCallback(() => {
    setOperations([]);
    setOpStatus('idle');
    setOpHash(null);
    setTxHash(null);
    setError(null);
  }, []);

  if (!ready) return <p>Loading...</p>;

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold mb-4">Batch Operations Demo</h2>
        <p className="text-gray-600 text-center max-w-md mb-4">
          Login with your email to experience batched UserOperations - multiple actions in a single confirmation.
        </p>
        <button
          onClick={login}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Batch Operations Demo</h2>
      
      <button
        onClick={logout}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded-lg"
      >
        Log Out
      </button>

      {/* Account Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {eoaAddress && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="font-bold">EOA Address</p>
            <p className="text-sm text-gray-600 break-all">{eoaAddress}</p>
          </div>
        )}

        {saAddress && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="font-bold">Smart Account Address</p>
            <p className="text-sm text-gray-600 break-all">{saAddress}</p>
          </div>
        )}
      </div>

      {/* Operation Composer */}
      <div className="w-full p-6 bg-white border rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">1. Compose Operation</h3>
        
        <div className="flex items-center gap-4 mb-4">
          <label className="font-medium">Mint Quantity:</label>
          <input
            type="number"
            min="1"
            max="10"
            value={mintQuantity}
            onChange={(e) => setMintQuantity(parseInt(e.target.value) || 1)}
            className="px-3 py-2 border rounded-lg w-20"
            disabled={opStatus !== 'idle'}
          />
          <button
            onClick={composeOperation}
            disabled={!saAddress || opStatus !== 'idle'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-400"
          >
            Compose
          </button>
        </div>

        {operations.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Operation Preview:</h4>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {formatOperationPreview(operations)}
            </pre>
          </div>
        )}
      </div>

      {/* Operation Execution */}
      {operations.length > 0 && (
        <div className="w-full p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">2. Confirm Operation</h3>
          
          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              This will execute {operations.length} action{operations.length > 1 ? 's' : ''} in a single UserOperation:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {operations.map((op, index) => (
                <li key={index}>{op.description}</li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={executeOperation}
              disabled={opStatus !== 'idle' && opStatus !== 'failed'}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-gray-400 font-medium"
            >
              {opStatus === 'idle' ? 'Confirm Operation' : getStatusMessage(opStatus)}
            </button>
            
            <button
              onClick={resetOperation}
              disabled={opStatus === 'submitted' || opStatus === 'processing'}
              className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg disabled:bg-gray-100"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Status & Results */}
      {(opHash || txHash || error) && (
        <div className="w-full p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">3. Operation Status</h3>
          
          {opHash && (
            <div className="mb-3">
              <p className="font-medium">UserOperation Hash:</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${opHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-blue-600 hover:underline break-all font-mono"
              >
                {opHash}
              </a>
            </div>
          )}

          {txHash && (
            <div className="mb-3">
              <p className="font-medium text-green-600">Transaction Hash:</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline break-all font-mono"
              >
                {txHash}
              </a>
            </div>
          )}

          {opStatus === 'included' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✅ {getStatusMessage(opStatus)}</p>
              <p className="text-sm text-green-700 mt-1">
                Successfully minted {operations.length} NFT{operations.length > 1 ? 's' : ''} in a single operation!
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">❌ Operation Failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Educational Note */}
      <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 What's happening here?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>One confirmation, multiple actions:</strong> Batch multiple mints into a single UserOperation</li>
          <li>• <strong>Operation tracking:</strong> Monitor progress from submission to on-chain inclusion</li>
          <li>• <strong>Sponsored transactions:</strong> No gas fees required from the user</li>
          <li>• <strong>Better UX:</strong> Users confirm once and see clear status updates</li>
        </ul>
      </div>
    </div>
  );
}
