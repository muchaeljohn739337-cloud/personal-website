import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { authOptions } from '@/lib/auth';

import { DashboardNav } from './components/dashboard-nav';
import { DashboardSidebar } from './components/dashboard-sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950">
        <DashboardNav user={session.user} />
        <div className="flex">
          <DashboardSidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
