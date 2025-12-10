'use client';

import { RewardsDashboard } from '@/components/dashboard/RewardsDashboard';

export default function RewardsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Rewards & Achievements
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Track your progress, earn points, and claim rewards
        </p>
      </div>

      <RewardsDashboard />
    </div>
  );
}
