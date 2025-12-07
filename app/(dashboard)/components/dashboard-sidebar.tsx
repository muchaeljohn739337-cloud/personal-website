'use client';

import {
  Activity,
  BarChart3,
  Bitcoin,
  Building2,
  Coins,
  CreditCard,
  Gift,
  Home,
  Key,
  Settings,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Token Wallet', href: '/dashboard/tokens', icon: Coins },
  { name: 'Crypto Pay', href: '/dashboard/payments', icon: Bitcoin },
  { name: 'Rewards', href: '/dashboard/rewards', icon: Gift },
  { name: 'Health', href: '/dashboard/health', icon: Activity },
  { name: 'MedBed', href: '/dashboard/medbed', icon: Sparkles },
  { name: 'Passwords', href: '/dashboard/passwords', icon: Key },
  { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
  { name: 'Transactions', href: '/dashboard/transactions', icon: BarChart3 },
  { name: 'Organization', href: '/dashboard/organization', icon: Building2 },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 border-r border-slate-800 bg-slate-900/50 lg:block">
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-gradient-to-r from-violet-500/20 to-blue-500/20 text-white border border-violet-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-violet-400' : '')} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade Card */}
      <div className="mx-4 mt-auto rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 p-4">
        <h4 className="font-semibold text-white">Upgrade to Pro</h4>
        <p className="mt-1 text-sm text-slate-400">
          Unlock all features and unlimited transactions.
        </p>
        <Link
          href="/dashboard/billing"
          className="mt-3 inline-block rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Upgrade now
        </Link>
      </div>
    </aside>
  );
}
