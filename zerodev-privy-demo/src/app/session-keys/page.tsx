export const dynamic = "force-dynamic";

import SessionKeyDemo from './components/SessionKeyDemo';
import Link from "next/link";

export default function SessionKeysPage() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      {/* Back to Home */}
      <div className="absolute top-4 left-4">
        <Link 
          href="/"
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-6">Session Keys Demo</h1>
      
      {!appId ? (
        <div className="max-w-xl text-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-4">
          <p className="font-medium mb-1">Environment not configured</p>
          <p className="mb-2">Create a <code>.env.local</code> with your keys, then restart the dev server:</p>
          <pre className="text-left bg-white border rounded p-3 overflow-auto">
{`NEXT_PUBLIC_PRIVY_APP_ID=...
NEXT_PUBLIC_ZERODEV_BUNDLER_RPC=...
NEXT_PUBLIC_ZERODEV_PAYMASTER_RPC=...
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...`}
          </pre>
        </div>
      ) : (
        <SessionKeyDemo />
      )}
    </main>
  );
}
