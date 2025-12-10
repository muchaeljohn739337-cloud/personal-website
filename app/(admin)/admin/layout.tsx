import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PremiumBadge } from '@/components/PremiumBadge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // Check if user is admin or super admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    redirect('/dashboard');
  }

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Admin Header */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold ${
                  isSuperAdmin 
                    ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30' 
                    : 'bg-red-600'
                }`}>
                  {isSuperAdmin ? 'S' : 'A'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">Admin Panel</span>
                  {isSuperAdmin && <PremiumBadge variant="compact" />}
                </div>
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link
                  href="/admin"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Users
                </Link>
                <Link
                  href="/admin/payments"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Payments
                </Link>
                <Link
                  href="/admin/billing"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Billing
                </Link>
                <Link
                  href="/admin/agents"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Agents
                </Link>
                <Link
                  href="/admin/blog"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Blog
                </Link>
                <Link
                  href="/admin/content"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Content
                </Link>
                <Link
                  href="/admin/security"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Security
                </Link>
                <Link
                  href="/admin/analytics"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Analytics
                </Link>
                <Link
                  href="/admin/workflows"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Workflows
                </Link>
                <Link
                  href="/admin/system"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  System
                </Link>
                <Link
                  href="/admin/logs"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Logs
                </Link>
                <Link
                  href="/admin/settings"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle variant="icon" />
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </ErrorBoundary>
  );
}
