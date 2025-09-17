'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createKernelAccountClient, type KernelAccountClient } from '@zerodev/sdk';
import { 
  validateEnvironment, 
  findEmbeddedWallet,
  createSmartAccount,
  type SmartAccountResult 
} from '../../../lib/smartAccount';
import { 
  createSessionKey, 
  mintWithSession, 
  revokeSession, 
  getSessionStatus, 
  formatTimeRemaining, 
  type SessionKeyData,
  type SessionStatus,
  type SessionOpStatus,
  type SessionOpResult
} from '../lib/sessionKeys';

type DemoStatus = 'idle' | 'granting' | 'minting' | 'revoking' | 'error';

export default function SessionKeyDemo() {
  const { login, ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  
  // Smart account state
  const [saAddress, setSaAddress] = useState<`0x${string}` | null>(null);
  const [, setEoaAddress] = useState<`0x${string}` | null>(null);
  const [kernelClient, setKernelClient] = useState<KernelAccountClient | null>(null);
  const [sessionData, setSessionData] = useState<SessionKeyData | null>(null);
  
  // Session state
  const [status, setStatus] = useState<DemoStatus>('idle');
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mintOpStatus, setMintOpStatus] = useState<SessionOpStatus>('idle');
  const [lastOpResult, setLastOpResult] = useState<SessionOpResult | null>(null);

  // Setup smart account when authenticated
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

      // Check for existing session data in localStorage
      const existingSessionStr = localStorage.getItem('sessionKeyData');
      if (existingSessionStr) {
        try {
          const existingSession = JSON.parse(existingSessionStr);
          setSessionData(existingSession);
        } catch {
          console.warn('Invalid session data in localStorage, clearing it');
          localStorage.removeItem('sessionKeyData');
        }
      }
    } catch (err) {
      console.error('Failed to setup smart account:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup smart account');
    }
  }, [wallets]);

  // Setup smart account when authenticated and wallets are available
  useEffect(() => {
    if (authenticated && wallets.length > 0 && !kernelClient) {
      setupSmartAccount();
    }
  }, [authenticated, wallets, kernelClient, setupSmartAccount]);

  // Update session status periodically
  useEffect(() => {
    const updateStatus = () => {
      const currentStatus = getSessionStatus();
      setSessionStatus(currentStatus);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleGrantSession = async () => {
    if (!kernelClient) {
      setError('Smart account not initialized');
      return;
    }

    try {
      setStatus('granting');
      setError(null);
      
      // Create new session key (this will automatically clear any existing session)
      const sessionData = await createSessionKey(kernelClient);
      
      setSessionData(sessionData);
      setStatus('idle');
      console.log('Session key granted successfully:', sessionData.sessionKeyAddress);
    } catch (err) {
      console.error('Failed to grant session:', err);
      setError(err instanceof Error ? err.message : 'Failed to grant session');
      setStatus('error');
    }
  };

  const handleMintWithSession = async () => {
    if (!saAddress || !sessionData) return;

    try {
      setStatus('minting');
      setError(null);
      setMintOpStatus('idle');

      const result = await mintWithSession(
        sessionData,
        (status: SessionOpStatus) => {
          setMintOpStatus(status);
        }
      );
      
      if (result.txHash) {
        setLastOpResult(result);
      }
      
      // Update session data with the incremented usage count
      if (result.updatedSessionData) {
        setSessionData(result.updatedSessionData);
      }
      setStatus('idle');
    } catch (err) {
      console.error('Failed to mint with session:', err);
      setError(err instanceof Error ? err.message : 'Failed to mint with session');
      setStatus('error');
      setMintOpStatus('failed');
    }
  };

  const handleRevokeSession = async () => {
    if (!kernelClient) return;

    try {
      setStatus('revoking');
      setError(null);

      await revokeSession(kernelClient);
      setSessionData(null);
      setSessionStatus(null);
      setStatus('idle');
    } catch (err) {
      console.error('Failed to revoke session:', err);
      setError(err instanceof Error ? err.message : 'Failed to revoke session');
      setStatus('error');
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-semibold mb-4">Session Keys Demo</h2>
        <p className="text-gray-600 text-center max-w-md mb-4">
          Login with your email to experience session keys - grant scoped permissions once, then mint NFTs without wallet prompts.
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Keys Demo</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Grant a session key to mint up to 3 NFTs within 1 hour without wallet prompts after the initial approval.
        </p>
      </div>

      {/* Session Status Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Status</h2>
        
        {sessionStatus ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                sessionStatus.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {sessionStatus.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            {sessionStatus.isActive && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Session Key Address:</span>
                  <span className="font-mono text-xs text-gray-800 break-all">
                    {sessionData?.sessionKeyAddress ? 
                      `${sessionData.sessionKeyAddress.slice(0, 6)}...${sessionData.sessionKeyAddress.slice(-4)}` : 
                      'N/A'
                    }
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Time Remaining:</span>
                  <span className="font-mono text-sm">
                    {formatTimeRemaining(sessionStatus.timeRemaining)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Mints Remaining:</span>
                  <span className="font-mono text-sm">
                    {sessionStatus.usageRemaining} / {sessionStatus.usageLimit}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Mints Used:</span>
                  <span className="font-mono text-sm">
                    {sessionStatus.totalUsage}
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">
            No active session
          </div>
        )}
      </div>

      {/* Actions Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
        
        <div className="space-y-4">
          {/* Grant Session */}
          {!sessionStatus?.isActive && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">1. Grant Session Key</h3>
              <p className="text-sm text-gray-600 mb-3">
                Create a session key that can mint up to 3 NFTs within 1 hour. This requires one wallet signature.
              </p>
              <button
                onClick={handleGrantSession}
                disabled={!saAddress || status === 'granting' || (sessionStatus?.isActive && sessionStatus.timeRemaining > 0)}
                className={`px-6 py-3 rounded-lg font-medium ${
                  !saAddress || status === 'granting'
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : sessionStatus?.isActive && sessionStatus.timeRemaining > 0
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {!saAddress ? 'Setting up account...' : status === 'granting' ? 'Granting Session...' : 'Grant Session Key'}
              </button>
            </div>
          )}

          {/* Mint with Session */}
          {sessionStatus?.isActive && sessionStatus.usageRemaining > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">2. Mint with Session</h3>
              <p className="text-sm text-gray-600 mb-3">
                Mint an NFT using your active session key. No wallet signature required!
              </p>
              <button
                onClick={handleMintWithSession}
                disabled={status === 'minting'}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {status === 'minting' ? 'Minting...' : 'Mint NFT with Session'}
              </button>
            </div>
          )}

          {/* Usage Limit Reached */}
          {sessionStatus?.isActive && sessionStatus.usageRemaining === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800">Usage Limit Reached</h3>
              <p className="text-sm text-yellow-700 mt-1">
                You&apos;ve used all 3 mints for this session. Revoke and create a new session to continue.
              </p>
            </div>
          )}

          {/* Revoke Session */}
          {sessionStatus?.isActive && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">3. Revoke Session</h3>
              <p className="text-sm text-gray-600 mb-3">
                Revoke the active session key on-chain by uninstalling the permission plugin. This requires a wallet signature and submits a transaction.
              </p>
              <button
                onClick={handleRevokeSession}
                disabled={status === 'revoking'}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {status === 'revoking' ? 'Revoking Session...' : 'Revoke Session Key'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mint Status and Results */}
      {mintOpStatus !== 'idle' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Session Mint Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-blue-700">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                mintOpStatus === 'included' 
                  ? 'bg-green-100 text-green-800' 
                  : mintOpStatus === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {mintOpStatus === 'submitted' ? 'Submitted' : 
                 mintOpStatus === 'processing' ? 'Processing' :
                 mintOpStatus === 'included' ? 'Confirmed' : 
                 mintOpStatus === 'failed' ? 'Failed' : mintOpStatus}
              </span>
            </div>

            {lastOpResult?.txHash && (
              <div className="flex items-center justify-between">
                <span className="text-blue-700">Transaction Hash:</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${lastOpResult.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline font-mono text-sm break-all"
                >
                  {lastOpResult.txHash.slice(0, 10)}...{lastOpResult.txHash.slice(-8)}
                </a>
              </div>
            )}
          </div>

          {mintOpStatus === 'included' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Mint Successful!</h3>
              <p className="text-green-700 text-sm">
                Your NFT was minted using the session key without requiring a wallet signature!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Educational Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-3">How Session Keys Work</h2>
        <div className="space-y-3 text-blue-800">
          <div>
            <h3 className="font-medium">1. Grant Phase</h3>
            <p className="text-sm text-blue-700">
              Create an ephemeral key with limited permissions (contract, function, usage count, time limit).
              Requires one wallet signature to install the session validator.
            </p>
          </div>
          <div>
            <h3 className="font-medium">2. Use Phase</h3>
            <p className="text-sm text-blue-700">
              The session key can sign operations within its scope without prompting your main wallet.
              Perfect for gaming, batch operations, or time-limited activities.
            </p>
          </div>
          <div>
            <h3 className="font-medium">3. Revoke/Expire Phase</h3>
            <p className="text-sm text-blue-700">
              Sessions automatically expire after the time limit, or can be manually revoked.
              This ensures your account stays secure even if the session key is compromised.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
