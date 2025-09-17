// src/app/simple-login-mint/components/MagicMint.tsx

'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createKernelAccountClient, type KernelAccountClient } from '@zerodev/sdk';
import { sepolia } from 'viem/chains';
import { nftContractAbi, nftContractAddress } from '../../../lib/contract';
import { 
  findEmbeddedWallet, 
  createSmartAccount, 
  validateEnvironment,
  type SmartAccountResult 
} from '../../../lib/smartAccount';

export default function MagicMint() {
  // Get Privy auth state
  const { login, ready, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();

  const [saAddress, setSaAddress] = useState<`0x${string}` | null>(null);
  const [eoaAddress, setEoaAddress] = useState<`0x${string}` | null>(null);
  const [kernelClient, setKernelClient] = useState<KernelAccountClient | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setupSmartAccount = useCallback(async () => {
    try {
      setError(null);
      
      // Validate environment variables
      const { bundlerRpc, paymasterRpc } = validateEnvironment();
      
      // Find Privy's embedded wallet
      const embeddedWallet = findEmbeddedWallet(wallets);
      
      // Create smart account with ZeroDev
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

  const handleMint = useCallback(async () => {
    if (!kernelClient) {
      setError('Smart account not initialized.');
      return;
    }
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      console.log('Smart Account Address:', kernelClient.account?.address);
      console.log('Contract Address:', nftContractAddress);
      console.log('Attempting mint...');
      
      const hash = await kernelClient.writeContract({
        address: nftContractAddress,
        abi: nftContractAbi,
        functionName: 'mint',
        args: [],
        account: kernelClient.account!,
        chain: sepolia,
      });
      setTxHash(hash);
    } catch (e: unknown) {
      console.error('Mint error:', e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }, [kernelClient]);

  if (!ready) return <p>Loading...</p>;

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold mb-4">Simple Login & Mint Demo</h2>
        <p className="text-gray-600 text-center max-w-md mb-4">
          Login with your email and mint an NFT with sponsored transactions using account abstraction.
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
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-semibold mb-4">Simple Login & Mint Demo</h2>
      
      <button
        onClick={logout}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded-lg"
      >
        Log Out
      </button>

      {eoaAddress && (
        <div className="text-center">
          <p className="font-bold">EOA Address</p>
          <p className="text-sm text-gray-600">{eoaAddress}</p>
        </div>
      )}

      {saAddress && (
        <div className="text-center">
          <p className="font-bold">Smart Account Address</p>
          <p className="text-sm text-gray-600">{saAddress}</p>
        </div>
      )}

      <button
        onClick={handleMint}
        disabled={loading || !kernelClient}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-400"
      >
        {loading ? 'Minting...' : 'Claim Your Free Badge'}
      </button>

      {txHash && (
        <div className="text-green-600">
          <p>Success! Your transaction:</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View on Etherscan
          </a>
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
