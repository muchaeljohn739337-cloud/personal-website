'use client';

import { HealthDashboard } from '@/components/dashboard/HealthDashboard';

export default function HealthPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Health Monitoring</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Track your vitals, set goals, and monitor your wellness journey
        </p>
      </div>

      <HealthDashboard />
    </div>
  );
}
