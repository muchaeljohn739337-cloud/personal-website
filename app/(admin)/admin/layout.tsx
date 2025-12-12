import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// eslint-disable-next-line import/no-unresolved
import { ErrorBoundary } from '@/components/ErrorBoundary';
// eslint-disable-next-line import/no-unresolved
import { PremiumBadge } from '@/components/PremiumBadge';
// eslint-disable-next-line import/no-unresolved
import { ThemeToggle } from '@/components/ThemeToggle';
// eslint-disable-next-line import/no-unresolved
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
// eslint-disable-next-line import/no-unresolved
import { authOptions } from '@/lib/auth';
// eslint-disable-next-line import/no-unresolved
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

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/payments', label: 'Payments', icon: '💳' },
    { href: '/admin/billing', label: 'Billing', icon: '💰' },
    { href: '/admin/agents', label: 'Agents', icon: '🤖' },
    { href: '/admin/blog', label: 'Blog', icon: '📝' },
    { href: '/admin/content', label: 'Content', icon: '📄' },
    { href: '/admin/security', label: 'Security', icon: '🔒' },
    { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { href: '/admin/workflows', label: 'Workflows', icon: '⚙️' },
    { href: '/admin/system', label: 'System', icon: '🖥️' },
    { href: '/admin/logs', label: 'Logs', icon: '📋' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Admin Header - Mobile Responsive */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-4 lg:px-8">
            <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
              <Link href="/admin" className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-white font-bold text-sm sm:text-base ${
                    isSuperAdmin
                      ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30'
                      : 'bg-red-600'
                  }`}
                >
                  {isSuperAdmin ? 'S' : 'A'}
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">
                    Admin Panel
                  </span>
                  {isSuperAdmin && <PremiumBadge variant="compact" />}
                </div>
              </Link>
              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-3 xl:gap-4 flex-wrap">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <ThemeToggle variant="icon" />
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                ← Back
              </Link>
              {/* Mobile Menu Button */}
              <AdminMobileNav navItems={navItems} />
            </div>
          </div>
        </header>

        {/* Main Content - Mobile Responsive */}
        <main className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  );
}
