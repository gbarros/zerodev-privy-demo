// zerodev-privy-demo/src/components/MagicMint.tsx

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from '@zerodev/sdk';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { constants } from '@zerodev/sdk';
import { http, createPublicClient, EIP1193Provider, zeroAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { nftContractAbi, nftContractAddress } from '@/lib/contract';

export default function MagicMint() {
  const { login, ready, authenticated, logout } = usePrivy();
  const { wallets } = useWallets();

  const [saAddress, setSaAddress] = useState<`0x${string}` | null>(null);
  const [eoaAddress, setEoaAddress] = useState<`0x${string}` | null>(null);
  const [kernelClient, setKernelClient] =
    useState<ReturnType<typeof createKernelAccountClient> | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bundlerRpc = process.env.NEXT_PUBLIC_ZERODEV_BUNDLER_RPC;
  const paymasterRpc = process.env.NEXT_PUBLIC_ZERODEV_PAYMASTER_RPC;

  const envOk = useMemo(() => !!bundlerRpc && !!paymasterRpc, [bundlerRpc, paymasterRpc]);

  const setupSmartAccount = useCallback(async () => {
    try {
      setError(null);
      // Find embedded wallet from Privy
      const embedded = wallets.find((w) => w.walletClientType === 'privy');
      if (!embedded) throw new Error('Embedded wallet not found. Ensure embedded wallets are enabled in Privy config.');

      const provider = await embedded.getEthereumProvider();
      // Pass EIP-1193 provider directly as Signer to ZeroDev utilities
      const signer = provider as EIP1193Provider;

      // viem public client for reads & chain config
      const publicClient = createPublicClient({ chain: sepolia, transport: http(sepolia.rpcUrls.default.http[0]) });

      // Configure EntryPoint and Kernel version per ZeroDev SDK (no permissionless needed)
      const entryPoint = constants.getEntryPoint('0.7');
      const kernelVersion = constants.KERNEL_V3_3;

      // Create ZeroDev validator & account
      const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        signer,
        entryPoint,
        kernelVersion,
      });

      const account = await createKernelAccount(publicClient, {
        plugins: { sudo: ecdsaValidator },
        entryPoint,
        kernelVersion,
      });

      const smartAccountBytecode = await publicClient.getBytecode({
        address: account.address,
      });

      // If the smart account is not deployed, we need to use the factory
      const factory = smartAccountBytecode ? undefined : account.factory;
      const factoryData = smartAccountBytecode ? undefined : account.factoryData;

      if (!envOk) throw new Error('Missing NEXT_PUBLIC_ZERODEV_BUNDLER_RPC or NEXT_PUBLIC_ZERODEV_PAYMASTER_RPC in .env.local');

      // Configure ZeroDev Paymaster client and wire into Kernel client
      const paymaster = createZeroDevPaymasterClient({
        chain: sepolia,
        transport: http(paymasterRpc!),
      });

      const client = createKernelAccountClient({
        account,
        chain: sepolia,
        bundlerTransport: http(bundlerRpc!),
        paymaster,
      });

      setKernelClient(client);
      setSaAddress(client.account?.address || null);
      setEoaAddress(embedded.address as `0x${string}`);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || 'Failed to initialize smart account');
    }
  }, [wallets, envOk, bundlerRpc, paymasterRpc]);

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
      <button
        onClick={login}
        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg"
      >
        Log In
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
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