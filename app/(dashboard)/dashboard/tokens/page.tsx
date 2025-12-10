'use client';

import { TokenWallet } from '@/components/dashboard/TokenWallet';

export default function TokensPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Token Wallet</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Manage your ADV tokens, view transactions, and transfer funds
        </p>
      </div>

      <TokenWallet />
    </div>
  );
}
