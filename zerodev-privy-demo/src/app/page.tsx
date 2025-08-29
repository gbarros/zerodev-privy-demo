export const dynamic = "force-dynamic";

import MagicMint from "@/components/MagicMint";

export default function Home() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-6">ZeroDev x Privy Demo</h1>
      {!appId ? (
        <div className="max-w-xl text-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-4">
          <p className="font-medium mb-1">Environment not configured</p>
          <p className="mb-2">Create a <code>.env.local</code> with your keys, then restart the dev server:</p>
          <pre className="text-left bg-white border rounded p-3 overflow-auto">
{`NEXT_PUBLIC_PRIVY_APP_ID=...\nNEXT_PUBLIC_ZERODEV_BUNDLER_RPC=...\nNEXT_PUBLIC_ZERODEV_PAYMASTER_RPC=...\nNEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...`}
          </pre>
        </div>
      ) : (
        <MagicMint />
      )}
    </main>
  );
}
