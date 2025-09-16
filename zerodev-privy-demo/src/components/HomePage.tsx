'use client';

import Link from 'next/link';

export default function HomePage() {
  const examples = [
    {
      title: 'Simple Login & Mint',
      description: 'Login with email and mint NFTs with sponsored transactions using account abstraction',
      href: '/simple-login-mint',
      status: 'Available',
      features: ['Email authentication', 'Smart account creation', 'Sponsored transactions', 'NFT minting']
    },
    {
      title: 'Batch Operations',
      description: 'Experience UserOperations - batch multiple actions into a single confirmation with proper status tracking',
      href: '/batch-operations',
      status: 'Available',
      features: ['Batched operations', 'UserOp status tracking', 'One confirmation, multiple actions', 'Operation previews']
    },
    {
      title: 'Session Keys',
      description: 'Grant limited, time-bound permissions to eliminate wallet prompts for repeated actions',
      href: '/session-keys',
      status: 'Available',
      features: ['Scoped permissions', 'Time-based expiry', 'Usage limits', 'No wallet prompts after grant']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ZeroDev × Privy Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore the power of account abstraction with seamless Web3 experiences. 
            No wallet installation required, just your email address.
          </p>
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Email Login</h3>
            <p className="text-gray-600">No seed phrases or wallet installations. Just use your email address.</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Sponsored Transactions</h3>
            <p className="text-gray-600">All transactions are sponsored. Users never need to buy ETH for gas.</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Accounts</h3>
            <p className="text-gray-600">Programmable wallets with advanced features and security.</p>
          </div>
        </div>

        {/* Examples Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {examples.map((example, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{example.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    example.status === 'Available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {example.status}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-6">{example.description}</p>
                
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Features:</h4>
                  <ul className="space-y-2">
                    {example.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {example.status === 'Available' ? (
                  <Link
                    href={example.href}
                    className="inline-flex items-center px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Try Demo
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center px-6 py-3 bg-gray-300 text-gray-500 font-medium rounded-lg cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600">
            Built with{' '}
            <a href="https://privy.io" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
              Privy
            </a>
            {' '}and{' '}
            <a href="https://zerodev.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              ZeroDev
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
